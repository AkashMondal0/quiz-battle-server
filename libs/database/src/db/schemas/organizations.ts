import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, timestamp, boolean, text,
  index, uniqueIndex, jsonb,
} from 'drizzle-orm/pg-core';
import { orgRoleEnum, orgPlanEnum, inviteStatusEnum, payoutScheduleEnum, currencyEnum } from './enums';
import { UsersSchema } from './users';

// ORGANIZATIONS

export const OrganizationsSchema = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    website: text('website'),
    logo: text('logo'),
    banner: text('banner'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    country: text('country'),
    city: text('city'),

    // Platform plan — controls feature gates
    plan: orgPlanEnum('plan').notNull().default('free'),
    planExpiresAt: timestamp('plan_expires_at'),

    // Verification badge (manually granted by platform staff)
    verified: boolean('verified').notNull().default(false),
    verifiedAt: timestamp('verified_at'),

    // Social links stored as JSONB for flexibility
    socialLinks: jsonb('social_links')
      .$type<{ twitter?: string; instagram?: string; linkedin?: string; facebook?: string }>()
      .default(sql`'{}'::jsonb`),

    // Payout / financial settings
    defaultCurrency: currencyEnum('default_currency').notNull().default('INR'),
    payoutSchedule: payoutScheduleEnum('payout_schedule').notNull().default('manual'),

    // Feature flags per org (e.g., { waitlist: true, custom_forms: false })
    featureFlags: jsonb('feature_flags')
      .$type<Record<string, boolean>>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    // Soft-delete — preserves all historical data
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('idx_orgs_slug').on(t.slug),
    index('idx_orgs_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`),
    index('idx_orgs_active').on(t.createdAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// Org Members — many-to-many with roles 

export const OrgMembersSchema = pgTable(
  'org_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    role: orgRoleEnum('role').notNull().default('member'),
    invitedBy: uuid('invited_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    // Permissions can be overridden per-member beyond their role
    // e.g., { can_view_revenue: true, can_issue_refunds: false }
    customPermissions: jsonb('custom_permissions')
      .$type<Record<string, boolean>>()
      .default(sql`'{}'::jsonb`),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    roleUpdatedAt: timestamp('role_updated_at'),
  },
  (t) => [
    uniqueIndex('idx_org_members_unique').on(t.orgId, t.userId),
    index('idx_org_members_org').on(t.orgId),
    index('idx_org_members_user').on(t.userId),
  ],
);

// Org Invites — email-based invitations 

export const OrgInvitesSchema = pgTable(
  'org_invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: orgRoleEnum('role').notNull().default('member'),
    token: text('token').notNull().unique(),   // cryptographically random
    status: inviteStatusEnum('status').notNull().default('pending'),
    invitedBy: uuid('invited_by').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_org_invites_org').on(t.orgId),
    index('idx_org_invites_email').on(t.email),
    index('idx_org_invites_token').on(t.token),
  ],
);

// Org Payout Accounts — bank / UPI details for receiving payouts
// Never store raw bank details — store only gateway-issued references.

export const OrgPayoutAccountsSchema = pgTable(
  'org_payout_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),

    // e.g. 'razorpay' | 'stripe_connect' | 'paypal'
    gateway: text('gateway').notNull(),
    // Gateway-issued account / linked account ID (never raw IFSC/account no.)
    gatewayAccountId: text('gateway_account_id').notNull(),
    // Human label for the organizer's dashboard
    displayName: text('display_name').notNull(),

    currency: currencyEnum('currency').notNull().default('INR'),
    isDefault: boolean('is_default').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at'),

    // Partial data for display (last 4 digits of account, UPI VPA)
    maskedDetails: jsonb('masked_details')
      .$type<{ last4?: string; vpa?: string; bankName?: string }>()
      .default(sql`'{}'::jsonb`),

    createdBy: uuid('created_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    index('idx_payout_accounts_org').on(t.orgId),
    // Only one default payout account per org
    uniqueIndex('idx_payout_accounts_default')
      .on(t.orgId)
      .where(sql`${t.isDefault} = true`),
  ],
);

// Org Subscription History

export const OrgSubscriptionsSchema = pgTable(
  'org_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    plan: orgPlanEnum('plan').notNull(),
    previousPlan: orgPlanEnum('previous_plan'),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at'),
    // Gateway subscription / invoice reference
    gatewaySubscriptionId: text('gateway_subscription_id'),
    amountPaid: text('amount_paid'),        // stored as string to avoid float rounding
    currency: currencyEnum('currency').notNull().default('INR'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_org_subs_org').on(t.orgId)],
);