import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, timestamp, boolean, text,
  index, integer, uniqueIndex, jsonb,
} from 'drizzle-orm/pg-core';
import {
  paymentStatusEnum, paymentMethodTypeEnum, currencyEnum,
  transactionTypeEnum, payoutStatusEnum, refundReasonEnum,
  registrationStatusEnum,
} from './enums';
import { UsersSchema } from './users';
import { EventsSchema, TicketsSchema, PromoCodesSchema } from './events';
import { OrganizationsSchema, OrgPayoutAccountsSchema } from './organizations';

// ORDERS — one order may contain multiple ticket line-items
//
// Flow:  Order (pending) → Payment (processing) → Payment (succeeded)
//        → Registration (confirmed) + Transaction (charge)
//
// On refund: Refund → Transaction (refund) → Registration (refunded)
// On payout: Payout → Transaction (payout) per order batch

export const OrdersSchema = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),   // human-readable: ORD-20240501-XXXXX
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'restrict' }),  // never cascade-delete an order
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'restrict' }),

    // Pricing in minor units (paise for INR, cents for USD) stored as integer
    // Using integer avoids ALL float drift — 1 USD = 100, ₹500 = 50000
    subtotalAmount: integer('subtotal_amount').notNull(),    // pre-discount
    discountAmount: integer('discount_amount').notNull().default(0),
    taxAmount: integer('tax_amount').notNull().default(0),
    platformFeeAmount: integer('platform_fee_amount').notNull().default(0),
    totalAmount: integer('total_amount').notNull(),          // what buyer pays
    currency: currencyEnum('currency').notNull().default('INR'),

    promoCodeId: uuid('promo_code_id')
      .references(() => PromoCodesSchema.id, { onDelete: 'set null' }),
    promoCodeSnapshot: jsonb('promo_code_snapshot')         // what code was at time of use
      .$type<{ code: string; discountType: string; discountValue: string }>()
      .default(sql`'null'::jsonb`),

    status: paymentStatusEnum('status').notNull().default('pending'),

    // Expires at: unpaid orders cancelled after N minutes (prevents inventory lock)
    expiresAt: timestamp('expires_at'),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    notes: text('notes'),                       // buyer notes

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_orders_number').on(t.orderNumber),
    index('idx_orders_user').on(t.userId),
    index('idx_orders_event').on(t.eventId),
    index('idx_orders_status').on(t.status),
    // Dashboard: organizer sees orders for their event, filtered by status + date
    index('idx_orders_event_status_date').on(t.eventId, t.status, t.createdAt),
    // Cron: find and cancel expired unpaid orders
    index('idx_orders_expires').on(t.expiresAt)
      .where(sql`${t.status} = 'pending'`),
    // Cron reconciliation: composite index for batch queries
    index('idx_orders_expires_status_date').on(t.expiresAt, t.status, t.createdAt)
      .where(sql`${t.status} IN ('pending', 'processing')`),
  ],
);

// Order Line Items — one row per ticket type per order 

export const OrderItemsSchema = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull()
      .references(() => OrdersSchema.id, { onDelete: 'cascade' }),
    ticketId: uuid('ticket_id').notNull()
      .references(() => TicketsSchema.id, { onDelete: 'restrict' }),

    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),          // price per ticket at time of order
    totalPrice: integer('total_price').notNull(),        // quantity * unitPrice

    // Snapshot of ticket details at purchase time (immutable audit)
    ticketSnapshot: jsonb('ticket_snapshot')
      .$type<{
        name: string;
        type: string;
        basePrice: string;
        dynamicPricing: boolean;
      }>()
      .notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_order_items_order').on(t.orderId),
    index('idx_order_items_ticket').on(t.ticketId),
  ],
);

// PAYMENTS — gateway interactions
// One order may have multiple payment attempts (retry after failure)

export const PaymentsSchema = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull()
      .references(() => OrdersSchema.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'restrict' }),

    // Gateway fields — reference IDs for reconciliation
    gateway: text('gateway').notNull(),                    // 'razorpay' | 'stripe' | 'paypal'
    gatewayPaymentId: text('gateway_payment_id').unique(), // gateway's transaction ID
    gatewayOrderId: text('gateway_order_id'),              // gateway's order ID
    gatewaySignature: text('gateway_signature'),           // for webhook verification

    method: paymentMethodTypeEnum('method').notNull().default('card'), // 'card' | 'upi' | 'wallet' | etc.
    status: paymentStatusEnum('status').notNull().default('pending'),

    amount: integer('amount').notNull(),                   // in minor units
    currency: currencyEnum('currency').notNull().default('INR'),

    // Saved payment method reference (never store raw card data — PCI DSS)
    paymentMethodId: uuid('payment_method_id')
      .references(() => SavedPaymentMethodsSchema.id, { onDelete: 'set null' }),

    // Raw gateway response for debugging / reconciliation (no PII in here)
    gatewayResponse: jsonb('gateway_response')
      .$type<Record<string, unknown>>()
      .default(sql`'null'::jsonb`),

    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),

    paidAt: timestamp('paid_at'),
    failedAt: timestamp('failed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    index('idx_payments_order').on(t.orderId),
    index('idx_payments_user').on(t.userId),
    index('idx_payments_gateway_id').on(t.gatewayPaymentId),
    index('idx_payments_status').on(t.status),
    index('idx_payments_created').on(t.createdAt),
  ],
);

// Saved Payment Methods — tokenized (gateway-stored, never raw)

export const SavedPaymentMethodsSchema = pgTable(
  'saved_payment_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    gateway: text('gateway').notNull(),
    // Gateway's token for this saved method (customer + payment_method IDs)
    gatewayCustomerId: text('gateway_customer_id'),
    gatewayMethodToken: text('gateway_method_token').notNull(),
    type: paymentMethodTypeEnum('type').notNull(),
    // Display info only — never raw card numbers
    displayLabel: text('display_label'),    // e.g. "Visa •••• 4242"
    brand: text('brand'),                   // 'visa' | 'mastercard' | 'rupay'
    last4: text('last_4'),
    expiryMonth: text('expiry_month'),
    expiryYear: text('expiry_year'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_saved_pm_user').on(t.userId),
    uniqueIndex('idx_saved_pm_default')
      .on(t.userId)
      .where(sql`${t.isDefault} = true`),
  ],
);

// REGISTRATIONS — one row per attendee per ticket purchased in an order
// Created after payment succeeds (or immediately for free tickets)

export const RegistrationsSchema = pgTable(
  'registrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull()
      .references(() => OrdersSchema.id, { onDelete: 'restrict' }),
    orderItemId: uuid('order_item_id').notNull()
      .references(() => OrderItemsSchema.id, { onDelete: 'restrict' }),
    eventId: uuid('event_id').notNull()
      .references(() => EventsSchema.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'restrict' }),
    ticketId: uuid('ticket_id').notNull()
      .references(() => TicketsSchema.id, { onDelete: 'restrict' }),

    status: registrationStatusEnum('status').notNull().default('pending'),

    // Unique QR code for check-in scanning
    qrCode: text('qr_code').notNull().unique(),
    qrCodeExpiresAt: timestamp('qr_code_expires_at'),  // rotate day-of for security

    // Check-in tracking
    checkedIn: boolean('checked_in').notNull().default(false),
    checkedInAt: timestamp('checked_in_at'),
    checkedInBy: uuid('checked_in_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),

    // Answers to custom registration form
    formAnswers: jsonb('form_answers')
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),

    // For waitlisted registrations: position in queue
    waitlistPosition: integer('waitlist_position'),

    // Ticket transfer tracking
    originalUserId: uuid('original_user_id')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    transferredAt: timestamp('transferred_at'),
    transferredFrom: uuid('transferred_from')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),

    cancelledAt: timestamp('cancelled_at'),
    cancelReason: text('cancel_reason'),

    registeredAt: timestamp('registered_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_regs_order').on(t.orderId),
    index('idx_regs_event').on(t.eventId),
    index('idx_regs_user').on(t.userId),
    index('idx_regs_ticket').on(t.ticketId),
    index('idx_regs_qr').on(t.qrCode),
    // Check-in app: scan by QR — needs to be instant
    uniqueIndex('idx_regs_qr_unique').on(t.qrCode),
    // Organizer dashboard: all confirmed attendees for an event
    index('idx_regs_event_status').on(t.eventId, t.status),
    // Business rule: one confirmed registration per user per event
    index('idx_regs_user_event_confirmed')
      .on(t.userId, t.eventId)
      .where(sql`${t.status} = 'confirmed'`),
    // Waitlist ordering
    index('idx_regs_waitlist')
      .on(t.eventId, t.waitlistPosition)
      .where(sql`${t.status} = 'waitlisted'`),
  ],
);

// Ticket Transfers — attendee-to-attendee 

export const TicketTransfersSchema = pgTable(
  'ticket_transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    registrationId: uuid('registration_id').notNull()
      .references(() => RegistrationsSchema.id, { onDelete: 'cascade' }),
    fromUserId: uuid('from_user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'restrict' }),
    toUserId: uuid('to_user_id')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    toEmail: text('to_email'),              // if recipient not yet on platform
    token: text('token').notNull().unique(), // secure link token
    status: text('status').notNull().default('pending'), // ticketTransferStatusEnum
    message: text('message'),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_transfers_registration').on(t.registrationId),
    index('idx_transfers_from').on(t.fromUserId),
    index('idx_transfers_to').on(t.toUserId),
  ],
);

// TRANSACTIONS — immutable double-entry ledger
//
// Every money movement creates one or more transaction rows.
// This is the source of truth for finance reporting.

export const TransactionsSchema = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Reference to source entity
    paymentId: uuid('payment_id')
      .references(() => PaymentsSchema.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id')
      .references(() => OrdersSchema.id, { onDelete: 'restrict' }),
    refundId: uuid('refund_id'),             // forward ref to RefundsSchema
    payoutId: uuid('payout_id'),             // forward ref to PayoutsSchema

    type: transactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),     // always positive; type encodes direction
    currency: currencyEnum('currency').notNull().default('INR'),

    // Parties
    userId: uuid('user_id')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    orgId: uuid('org_id')
      .references(() => OrganizationsSchema.id, { onDelete: 'set null' }),
    eventId: uuid('event_id')
      .references(() => EventsSchema.id, { onDelete: 'set null' }),

    // Metadata for reconciliation
    description: text('description'),
    externalRef: text('external_ref'),       // gateway transaction ID for reconciliation
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_txn_payment').on(t.paymentId),
    index('idx_txn_order').on(t.orderId),
    index('idx_txn_type').on(t.type),
    index('idx_txn_user').on(t.userId),
    index('idx_txn_org').on(t.orgId),
    index('idx_txn_event').on(t.eventId),
    // Finance reports: date-range scans
    index('idx_txn_created').on(t.createdAt),
    // Org revenue dashboard: all transactions for an org in a period
    index('idx_txn_org_date').on(t.orgId, t.createdAt),
  ],
);

// Refunds

export const RefundsSchema = pgTable(
  'refunds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull()
      .references(() => OrdersSchema.id, { onDelete: 'restrict' }),
    paymentId: uuid('payment_id').notNull()
      .references(() => PaymentsSchema.id, { onDelete: 'restrict' }),
    initiatedBy: uuid('initiated_by').notNull()
      .references(() => UsersSchema.id, { onDelete: 'restrict' }),

    reason: refundReasonEnum('reason').notNull(),
    notes: text('notes'),

    amount: integer('amount').notNull(),             // may be partial
    currency: currencyEnum('currency').notNull().default('INR'),

    // Gateway refund reference
    gateway: text('gateway').notNull(),
    gatewayRefundId: text('gateway_refund_id').unique(),

    status: paymentStatusEnum('status').notNull().default('pending'),

    // If a specific registration is being refunded (partial)
    registrationId: uuid('registration_id')
      .references(() => RegistrationsSchema.id, { onDelete: 'restrict' }),

    processedAt: timestamp('processed_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_refunds_order').on(t.orderId),
    index('idx_refunds_payment').on(t.paymentId),
    index('idx_refunds_status').on(t.status),
    index('idx_refunds_created').on(t.createdAt),
  ],
);

// Payouts — organizer receives their share after the event

export const PayoutsSchema = pgTable(
  'payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull()
      .references(() => OrganizationsSchema.id, { onDelete: 'restrict' }),
    eventId: uuid('event_id')
      .references(() => EventsSchema.id, { onDelete: 'restrict' }),
    payoutAccountId: uuid('payout_account_id').notNull()
      .references(() => OrgPayoutAccountsSchema.id, { onDelete: 'restrict' }),

    grossAmount: integer('gross_amount').notNull(),        // total ticket revenue
    platformFee: integer('platform_fee').notNull(),        // platform's cut
    refundsDeducted: integer('refunds_deducted').notNull().default(0),
    taxDeducted: integer('tax_deducted').notNull().default(0),
    netAmount: integer('net_amount').notNull(),            // what organizer receives

    currency: currencyEnum('currency').notNull().default('INR'),

    status: payoutStatusEnum('status').notNull().default('scheduled'),

    gateway: text('gateway').notNull(),
    gatewayPayoutId: text('gateway_payout_id').unique(),
    gatewayResponse: jsonb('gateway_response')
      .$type<Record<string, unknown>>()
      .default(sql`'null'::jsonb`),

    scheduledAt: timestamp('scheduled_at').notNull(),
    processedAt: timestamp('processed_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),

    // If payout is reversed (chargeback, fraud)
    reversedAt: timestamp('reversed_at'),
    reversalReason: text('reversal_reason'),

    initiatedBy: uuid('initiated_by')
      .references(() => UsersSchema.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_payouts_org').on(t.orgId),
    index('idx_payouts_event').on(t.eventId),
    index('idx_payouts_status').on(t.status),
    index('idx_payouts_scheduled').on(t.scheduledAt),
    index('idx_payouts_created').on(t.createdAt),
  ],
);

// Platform Fee Config — revenue share rules 
// Allows different fee structures per org plan or negotiated contracts.

export const PlatformFeeConfigSchema = pgTable(
  'platform_fee_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // If orgId is null, this is the default config
    orgId: uuid('org_id')
      .references(() => OrganizationsSchema.id, { onDelete: 'cascade' }),
    // Percentage of gross revenue: stored as integer basis points (500 = 5.00%)
    feeRateBps: integer('fee_rate_bps').notNull().default(500),
    // Per-ticket fixed fee in minor units (e.g. 200 = ₹2)
    feeFixedAmount: integer('fee_fixed_amount').notNull().default(0),
    // Maximum fee cap in minor units (null = no cap)
    feeCap: integer('fee_cap'),
    validFrom: timestamp('valid_from').notNull().defaultNow(),
    validUntil: timestamp('valid_until'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_fee_config_org').on(t.orgId),
    // Only one active config per org at a time
    index('idx_fee_config_valid').on(t.orgId, t.validFrom),
  ],
);

// Tax Rules

export const TaxRulesSchema = pgTable(
  'tax_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    country: text('country').notNull(),
    state: text('state'),
    // 'GST' | 'VAT' | 'SALES_TAX'
    taxType: text('tax_type').notNull(),
    // Rate in basis points (1800 = 18%)
    rateBps: integer('rate_bps').notNull(),
    appliesTo: text('applies_to').notNull().default('paid'),  // 'paid' | 'all'
    isActive: boolean('is_active').notNull().default(true),
    effectiveFrom: timestamp('effective_from').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_tax_country_state').on(t.country, t.state),
  ],
);