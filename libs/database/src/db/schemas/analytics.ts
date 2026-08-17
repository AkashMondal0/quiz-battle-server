import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, timestamp, boolean, text,
  index, integer, uniqueIndex, jsonb, doublePrecision,
  smallint,
} from 'drizzle-orm/pg-core';
import {
  reviewStatusEnum, reportReasonEnum, followEntityEnum,
  notificationTypeEnum, notificationChannelEnum, auditActionEnum,
} from './enums';
import { UsersSchema } from './users';
import { EventsSchema } from './events';
import { OrganizationsSchema } from './organizations';
import { OrdersSchema, RegistrationsSchema } from './payments';

// REVIEWS

export const ReviewsSchema = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    // Only users who attended can review — enforced at app layer using registrations
    registrationId: uuid('registration_id')
      .references(() => RegistrationsSchema.id, { onDelete: 'set null' }),

    rating: smallint('rating').notNull(),    // 1–5; CHECK constraint in migration
    // Sub-ratings for richer analytics
    venueRating: smallint('venue_rating'),
    organizationRating: smallint('organization_rating'),
    valueRating: smallint('value_rating'),

    title: text('title'),
    comment: text('comment'),

    status: reviewStatusEnum('status').notNull().default('published'),
    flagCount: integer('flag_count').notNull().default(0),

    // Organizer's public reply
    replyText: text('reply_text'),
    replyAt: timestamp('reply_at'),
    replyBy: uuid('reply_by').references(() => UsersSchema.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    // Enforce one review per verified attendee per event
    uniqueIndex('idx_reviews_user_event').on(t.userId, t.eventId),
    index('idx_reviews_event').on(t.eventId),
    index('idx_reviews_rating').on(t.rating),
    // Moderation queue: flagged reviews
    index('idx_reviews_flagged')
      .on(t.flagCount)
      .where(sql`${t.flagCount} > 0`),
  ],
);

// Content Reports — spam / inappropriate flagging

export const ContentReportsSchema = pgTable(
  'content_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportedBy: uuid('reported_by').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    // Polymorphic: what entity is being reported
    entityType: text('entity_type').notNull(),  // 'event' | 'review' | 'user' | 'org'
    entityId: uuid('entity_id').notNull(),
    reason: reportReasonEnum('reason').notNull(),
    description: text('description'),
    status: text('status').notNull().default('pending'),  // 'pending' | 'reviewed' | 'resolved' | 'dismissed'
    resolvedBy: uuid('resolved_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    resolution: text('resolution'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_reports_entity').on(t.entityType, t.entityId),
    index('idx_reports_status').on(t.status),
    index('idx_reports_reporter').on(t.reportedBy),
  ],
);

// SOCIAL — follows, bookmarks, waitlist

// Follows — user → user | org | category | tag 

export const FollowsSchema = pgTable(
  'follows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    followerId: uuid('follower_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    entityType: followEntityEnum('entity_type').notNull(),
    // Polymorphic entity ID — type determines which table to join
    entityId: text('entity_id').notNull(),     // uuid string or tag string
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_follows_unique').on(t.followerId, t.entityType, t.entityId),
    index('idx_follows_follower').on(t.followerId),
    index('idx_follows_entity').on(t.entityType, t.entityId),
  ],
);

// Bookmarks

export const BookmarksSchema = pgTable(
  'bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_bookmarks_unique').on(t.userId, t.eventId),
    index('idx_bookmarks_user').on(t.userId),
    index('idx_bookmarks_event').on(t.eventId),
  ],
);

// ANALYTICS AGGREGATES
//
// Raw data lives in event_page_views (events.ts).
// These tables store pre-aggregated rollups so dashboard queries are O(1)
// regardless of event size. Populated by a background job (cron / queue).

// Daily Event Analytics — per-event, per-day ──

export const EventAnalyticsDailySchema = pgTable(
  'event_analytics_daily',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),           // 'YYYY-MM-DD' (intentionally text for partitioning)

    // Traffic
    pageViews: integer('page_views').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    // Funnel
    ticketPageViews: integer('ticket_page_views').notNull().default(0),
    checkoutStarts: integer('checkout_starts').notNull().default(0),
    checkoutCompletions: integer('checkout_completions').notNull().default(0),
    // Registrations
    newRegistrations: integer('new_registrations').notNull().default(0),
    cancellations: integer('cancellations').notNull().default(0),
    waitlistAdds: integer('waitlist_adds').notNull().default(0),
    // Revenue (in minor units)
    grossRevenue: integer('gross_revenue').notNull().default(0),
    netRevenue: integer('net_revenue').notNull().default(0),
    refundsIssued: integer('refunds_issued').notNull().default(0),
    // Engagement
    bookmarks: integer('bookmarks').notNull().default(0),
    shares: integer('shares').notNull().default(0),
    // Traffic sources (serialized for flexibility)
    trafficSources: jsonb('traffic_sources')
      .$type<Record<string, number>>()
      .default(sql`'{}'::jsonb`),
    deviceBreakdown: jsonb('device_breakdown')
      .$type<{ mobile: number; desktop: number; tablet: number }>()
      .default(sql`'{}'::jsonb`),
    topCountries: jsonb('top_countries')
      .$type<Record<string, number>>()
      .default(sql`'{}'::jsonb`),

    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_analytics_daily_event_date').on(t.eventId, t.date),
    index('idx_analytics_daily_date').on(t.date),
  ],
);

// Organizer Dashboard Snapshot — per org, per month 
// The "summary card" data on the organizer home page.

export const OrgAnalyticsMonthlySchema = pgTable(
  'org_analytics_monthly',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    month: text('month').notNull(),                // 'YYYY-MM'

    totalEvents: integer('total_events').notNull().default(0),
    publishedEvents: integer('published_events').notNull().default(0),
    cancelledEvents: integer('cancelled_events').notNull().default(0),
    totalTicketsSold: integer('total_tickets_sold').notNull().default(0),
    totalAttendees: integer('total_attendees').notNull().default(0),
    newFollowers: integer('new_followers').notNull().default(0),
    totalPageViews: integer('total_page_views').notNull().default(0),

    // Revenue
    grossRevenue: integer('gross_revenue').notNull().default(0),
    netRevenue: integer('net_revenue').notNull().default(0),
    platformFees: integer('platform_fees').notNull().default(0),
    refundsIssued: integer('refunds_issued').notNull().default(0),
    pendingPayouts: integer('pending_payouts').notNull().default(0),
    completedPayouts: integer('completed_payouts').notNull().default(0),

    // Review metrics
    averageRating: doublePrecision('average_rating'),
    totalReviews: integer('total_reviews').notNull().default(0),

    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_org_analytics_monthly').on(t.orgId, t.month),
    index('idx_org_analytics_date').on(t.month),
  ],
);

// Organizer Revenue Summary — lifetime, updated incrementally 

export const OrgRevenueSummarySchema = pgTable(
  'org_revenue_summary',
  {
    orgId: uuid('org_id').notNull().primaryKey()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    totalGrossRevenue: integer('total_gross_revenue').notNull().default(0),
    totalNetRevenue: integer('total_net_revenue').notNull().default(0),
    totalRefunds: integer('total_refunds').notNull().default(0),
    totalPayouts: integer('total_payouts').notNull().default(0),
    pendingPayouts: integer('pending_payouts').notNull().default(0),
    totalTicketsSold: integer('total_tickets_sold').notNull().default(0),
    totalEventsHosted: integer('total_events_hosted').notNull().default(0),
    averageTicketPrice: doublePrecision('average_ticket_price'),
    lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
  },
);

// Ticket Sales Hourly — for real-time "tickets selling fast" signals 

export const TicketSalesHourlySchema = pgTable(
  'ticket_sales_hourly',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    ticketId: uuid('ticket_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }), // join to tickets
    hour: timestamp('hour').notNull(),    // truncated to hour: '2024-01-15 14:00:00'
    unitsSold: integer('units_sold').notNull().default(0),
    revenue: integer('revenue').notNull().default(0),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_ticket_hourly_unique').on(t.ticketId, t.hour),
    index('idx_ticket_hourly_event').on(t.eventId),
    index('idx_ticket_hourly_hour').on(t.hour),
  ],
);

// UTM / Traffic Source Attribution 

export const TrafficAttributionSchema = pgTable(
  'traffic_attribution',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .references(() => OrdersSchema.id, { onDelete: 'set null' }),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    referrer: text('referrer'),
    sessionId: text('session_id'),
    converted: boolean('converted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_attr_event').on(t.eventId),
    index('idx_attr_source').on(t.utmSource, t.utmMedium),
    index('idx_attr_event_source').on(t.eventId, t.utmSource),
  ],
);

// NOTIFICATIONS

export const NotificationsSchema = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull().default('in_app'),

    // Polymorphic context references
    eventId: uuid('event_id')
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .references(() => OrdersSchema.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    message: text('message').notNull(),
    // Structured payload for rich push / deep-link routing
    data: jsonb('data').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    // Template used for email rendering
    emailTemplateId: text('email_template_id'),

    read: boolean('read').notNull().default(false),
    readAt: timestamp('read_at'),

    // Delivery tracking
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_notifs_user').on(t.userId),
    index('idx_notifs_user_unread')
      .on(t.userId)
      .where(sql`${t.read} = false`),
    index('idx_notifs_created').on(t.createdAt),
    index('idx_notifs_type').on(t.type),
    // Delivery job: unsent notifications
    index('idx_notifs_unsent')
      .on(t.createdAt)
      .where(sql`${t.sentAt} IS NULL AND ${t.failedAt} IS NULL`),
  ],
);

// Notification Templates 

export const NotificationTemplatesSchema = pgTable(
  'notification_templates',
  {
    id: text('id').primaryKey(),              // e.g. 'registration_confirmed'
    channel: notificationChannelEnum('channel').notNull(),
    subjectTemplate: text('subject_template'), // Handlebars / Mustache
    bodyTemplate: text('body_template').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
);

// Webhook Endpoints — org-level event streaming 

export const WebhookEndpointsSchema = pgTable(
  'webhook_endpoints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    secret: text('secret').notNull(),         // HMAC-SHA256 signing secret (hashed)
    // Events to subscribe to: ['registration.confirmed', 'payment.succeeded', ...]
    events: text('events').array().notNull().default(sql`'{}'::text[]`),
    isActive: boolean('is_active').notNull().default(true),
    lastDeliveredAt: timestamp('last_delivered_at'),
    failureCount: integer('failure_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_webhooks_org').on(t.orgId)],
);

// Webhook Deliveries — retry log 

export const WebhookDeliveriesSchema = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    endpointId: uuid('endpoint_id').notNull()
      .references(() => WebhookEndpointsSchema.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),           // 'registration.confirmed'
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    attempt: smallint('attempt').notNull().default(1),
    statusCode: integer('status_code'),
    responseBody: text('response_body'),
    success: boolean('success').notNull().default(false),
    nextRetryAt: timestamp('next_retry_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_webhook_deliveries_endpoint').on(t.endpointId),
    index('idx_webhook_deliveries_retry')
      .on(t.nextRetryAt)
      .where(sql`${t.success} = false`),
  ],
);

// AUDIT LOG — immutable record, append-only

export const AuditLogsSchema = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    actorType: text('actor_type').notNull().default('user'),  // 'user' | 'system' | 'webhook'
    // Polymorphic target entity
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    // Before/after diff (redacted of PII for non-admin viewers)
    diff: jsonb('diff')
      .$type<{ before: unknown; after: unknown }>()
      .default(sql`'null'::jsonb`),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_audit_actor').on(t.actorId),
    index('idx_audit_entity').on(t.entityType, t.entityId),
    index('idx_audit_action').on(t.action),
    index('idx_audit_created').on(t.createdAt),
    // Compliance: all actions by an org's members
    index('idx_audit_actor_action').on(t.actorId, t.action),
  ],
);