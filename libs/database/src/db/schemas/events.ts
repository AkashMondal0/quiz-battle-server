import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, timestamp, boolean, text,
  index, integer, uniqueIndex, jsonb, doublePrecision, smallint, primaryKey,
} from 'drizzle-orm/pg-core';
import {
  eventTypeEnum, eventStatusEnum, eventVisibilityEnum, eventFormatEnum,
  ticketTypeEnum,
} from './enums';
import { UsersSchema } from './users';
import { OrganizationsSchema } from './organizations';

// LOCATIONS

export const EventLocationsSchema = pgTable(
  'event_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name'),
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state'),
    country: text('country').notNull(),
    postalCode: text('postal_code'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    timezone: text('timezone'),             // IANA tz at venue
    placeId: text('place_id'),              // Google Maps Place ID
    // H3 hex indexes at multiple resolutions — O(1) proximity lookup
    // r7 ≈ 1.2 km | r6 ≈ 3.2 km | r5 ≈ 8.5 km
    h3R7: text('h3_r7').notNull(),
    h3R6: text('h3_r6').notNull(),
    h3R5: text('h3_r5').notNull(),
    createdBy: uuid('created_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_loc_h3_r7').on(t.h3R7),
    index('idx_loc_h3_r6').on(t.h3R6),
    index('idx_loc_h3_r5').on(t.h3R5),
    index('idx_loc_country').on(t.country),
    index('idx_loc_state').on(t.state),
    index('idx_loc_city_trgm').using('gin', sql`${t.city} gin_trgm_ops`),
    index('idx_loc_lat_lng').on(t.lat, t.lng),
  ],
);

// CATEGORIES — hierarchical (parent → child)

export const CategoriesSchema = pgTable(
  'categories',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    icon: text('icon'),
    parentId: integer('parent_id'),   // self-ref; FK added via migration CHECK
    displayOrder: smallint('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_categories_slug').on(t.slug),
    index('idx_categories_parent').on(t.parentId),
  ],
);

// TAGS

export const TagsSchema = pgTable(
  'tags',
  {
    id: text('id').primaryKey(),              // slug-style: "react-native"
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_tags_usage').on(t.usageCount)],
);

// EVENTS

export const EventsSchema = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    coverImage: text('cover_image'),
    // Gallery images (ordered list of URLs)
    gallery: jsonb('gallery').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    language: text('language').notNull().default('en'),
    type: eventTypeEnum('type').notNull().default('conference'),
    format: eventFormatEnum('format').notNull().default('in_person'),
    visibility: eventVisibilityEnum('visibility').notNull().default('public'),
    status: eventStatusEnum('status').notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),

    // Organizer: either a personal user or an organization
    organizerId: uuid('organizer_id').notNull()
      .references(() => UsersSchema.id),
    orgId: uuid('org_id')
      .references(() => OrganizationsSchema.id, { onDelete: 'set null' }),

    locationId: uuid('location_id')
      .references(() => EventLocationsSchema.id, { onDelete: 'set null' }),

    // Online event fields
    onlineUrl: text('online_url'),
    onlinePlatform: text('online_platform'),   // 'zoom' | 'meet' | 'teams' | 'custom'

    // Timing
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    timezone: text('timezone'),
    // Doors open / check-in start (may be before startDate)
    doorsOpen: timestamp('doors_open'),
    registrationDeadline: timestamp('registration_deadline'),

    // Capacity and registration
    capacity: integer('capacity'),             // null = unlimited
    minAttendees: integer('min_attendees'),    // event may be cancelled below this
    ageRestriction: smallint('age_restriction'),  // min age (0 = none)
    isRefundable: boolean('is_refundable').notNull().default(true),
    refundDeadlineHours: integer('refund_deadline_hours').default(48),

    // Waitlist
    waitlistEnabled: boolean('waitlist_enabled').notNull().default(false),

    // Order expiry: minutes before unpaid orders are automatically cancelled
    // Prevents inventory from being locked indefinitely
    orderExpiryMinutes: integer('order_expiry_minutes').notNull().default(15),

    // Custom registration form schema (JSON Schema draft-07)
    customFormSchema: jsonb('custom_form_schema')
      .$type<Record<string, unknown>>()
      .default(sql`'null'::jsonb`),

    // SEO / discovery metadata
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    tags: text('tags').array().default(sql`'{}'::text[]`),   // denorm for fast read

    // Denormalized counters — avoids COUNT(*) on hot reads
    // Updated by DB trigger or app-level after each write
    registrationCount: integer('registration_count').notNull().default(0),
    confirmedCount: integer('confirmed_count').notNull().default(0),
    waitlistCount: integer('waitlist_count').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    averageRating: doublePrecision('average_rating'),
    bookmarkCount: integer('bookmark_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),

    // Revenue snapshot — updated after each payment/refund
    totalRevenue: text('total_revenue').notNull().default('0'),    // string → no float drift
    netRevenue: text('net_revenue').notNull().default('0'),        // after fees + refunds

    publishedAt: timestamp('published_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancelReason: text('cancel_reason'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_events_slug').on(t.slug),
    index('idx_events_organizer').on(t.organizerId),
    index('idx_events_org').on(t.orgId),
    index('idx_events_location').on(t.locationId),
    // GIN trigram full-text search on title and description
    index('idx_events_title_trgm').using('gin', sql`${t.title} gin_trgm_ops`),
    index('idx_events_desc_trgm').using('gin', sql`${t.description} gin_trgm_ops`),
    // B-tree for date range filtering
    index('idx_events_start_date').on(t.startDate),
    index('idx_events_end_date').on(t.endDate),
    // Partial: only published events need fast date-range scans
    index('idx_events_pub_start')
      .on(t.startDate)
      .where(sql`${t.status} = 'published'`),
    // Composite: status + date — covers "upcoming published events" query
    index('idx_events_pub_future')
      .on(t.status, t.startDate)
      .where(sql`${t.status} = 'published'`),
    // Featured events are tiny — partial index is near-instant
    index('idx_events_featured')
      .on(t.startDate)
      .where(sql`${t.featured} = true AND ${t.status} = 'published'`),
    // Org's events dashboard query
    index('idx_events_org_status').on(t.orgId, t.status),
    // Order expiry settings index
    index('idx_events_order_expiry').on(t.orderExpiryMinutes),
  ],
);

// Event Staff — per-event role assignments

export const EventStaffSchema = pgTable(
  'event_staff',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    // 'co_organizer' | 'check_in_agent' | 'moderator' | 'speaker' | 'volunteer'
    role: text('role').notNull().default('co_organizer'),
    // Fine-grained capability flags beyond role
    canViewRevenue: boolean('can_view_revenue').notNull().default(false),
    canIssueRefunds: boolean('can_issue_refunds').notNull().default(false),
    canCheckIn: boolean('can_check_in').notNull().default(true),
    canEditEvent: boolean('can_edit_event').notNull().default(false),
    addedBy: uuid('added_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_event_staff_unique').on(t.eventId, t.userId),
    index('idx_event_staff_event').on(t.eventId),
    index('idx_event_staff_user').on(t.userId),
  ],
);

// Junction: Events ↔ Categories

export const EventCategoriesSchema = pgTable(
  'event_categories',
  {
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull()
      .references(() => CategoriesSchema.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.categoryId] }),
    index('idx_event_cat_category').on(t.categoryId),
  ],
);

// Junction: Events ↔ Tags

export const EventTagsSchema = pgTable(
  'event_tags',
  {
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').notNull()
      .references(() => TagsSchema.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.tagId] }),
    index('idx_event_tags_tag').on(t.tagId),
  ],
);

// Event FAQs

export const EventFaqsSchema = pgTable(
  'event_faqs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    displayOrder: smallint('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_faqs_event').on(t.eventId)],
);

// Event Updates / Announcements

export const EventUpdatesSchema = pgTable(
  'event_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // Triggers notification to all confirmed registrants when true
    notifyAttendees: boolean('notify_attendees').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_event_updates_event').on(t.eventId)],
);

// Event Page Views (raw, for analytics aggregation)

export const EventPageViewsSchema = pgTable(
  'event_page_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),   // null = anon
    sessionId: text('session_id'),
    referrer: text('referrer'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    ipCountry: text('ip_country'),
    deviceType: text('device_type'),
    viewedAt: timestamp('viewed_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_page_views_event').on(t.eventId),
    index('idx_page_views_event_time').on(t.eventId, t.viewedAt),
    // Analytics roll-up range scans
    index('idx_page_views_viewed_at').on(t.viewedAt),
  ],
);

// TICKETS

export const TicketsSchema = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: ticketTypeEnum('type').notNull().default('free'),

    // Pricing — stored as text (minor units string) to avoid float drift
    // e.g., "50000" = ₹500.00 (paise), or use decimal string "500.00"
    basePrice: text('base_price').notNull().default('0'),
    currentPrice: text('current_price').notNull().default('0'),
    maxPrice: text('max_price'),
    dynamicPricing: boolean('dynamic_pricing').notNull().default(false),
    // Minimum price floor for donation tickets
    minDonation: text('min_donation'),

    quantity: integer('quantity').notNull(), // total available at start; null = unlimited
    // `available` decremented atomically: UPDATE SET available = available - 1 WHERE available > 0
    available: integer('available').notNull(),

    maxPerUser: integer('max_per_user').notNull().default(1),
    minPerOrder: integer('min_per_order').notNull().default(1),

    isHidden: boolean('is_hidden').notNull().default(false),
    isTransferable: boolean('is_transferable').notNull().default(true),

    saleStartsAt: timestamp('sale_starts_at'),
    saleEndsAt: timestamp('sale_ends_at'),

    // Early-bird: price increases after date or threshold
    earlyBirdPrice: text('early_bird_price'),
    earlyBirdEndsAt: timestamp('early_bird_ends_at'),
    earlyBirdQuantity: integer('early_bird_quantity'),

    displayOrder: smallint('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    index('idx_tickets_event').on(t.eventId),
    index('idx_tickets_active')
      .on(t.eventId)
      .where(sql`${t.isHidden} = false AND ${t.available} > 0`),
  ],
);

// Promo Codes / Discount Codes

export const PromoCodesSchema = pgTable(
  'promo_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'cascade' }),
    // Optional: restrict to specific ticket types
    ticketId: uuid('ticket_id')
      .references(() => TicketsSchema.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),               // case-insensitive; normalize on insert
    status: text('status').notNull().default('active'),
    discountType: text('discount_type').notNull().default('percentage'), // 'percentage' | 'fixed_amount'
    discountValue: text('discount_value').notNull(),
    currency: text('currency').default('INR'),
    maxUsage: integer('max_usage'),             // null = unlimited
    usageCount: integer('usage_count').notNull().default(0),
    maxPerUser: integer('max_per_user').notNull().default(1),
    minOrderAmount: text('min_order_amount'),   // minimum cart value
    startsAt: timestamp('starts_at'),
    expiresAt: timestamp('expires_at'),
    createdBy: uuid('created_by').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_promo_event_code').on(t.eventId, t.code),
    index('idx_promo_event').on(t.eventId),
    index('idx_promo_code').on(t.code),
  ],
);