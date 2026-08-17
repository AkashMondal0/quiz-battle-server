// Domain Structure:
//   enums.ts        → all pgEnum declarations
//   users.ts        → users, accounts, auth, sessions, settings
//   organizations.ts→ orgs, members, invites, payout accounts, subscriptions
//   events.ts       → locations, categories, tags, events, tickets, promos
//   payments.ts     → orders, payments, registrations, transactions,
//                     refunds, payouts, fee config, tax rules
//   analytics.ts    → reviews, follows, bookmarks, analytics aggregates,
//                     notifications, webhooks, audit logs

// Enums 
export * from './enums';

// Users / Auth 
export * from './users';
export type User                = typeof import('./users').UsersSchema.$inferSelect;
export type NewUser             = typeof import('./users').UsersSchema.$inferInsert;
export type Account             = typeof import('./users').AccountsSchema.$inferSelect;
export type AuthProvider        = typeof import('./users').AuthProvidersSchema.$inferSelect;
export type Session             = typeof import('./users').SessionsSchema.$inferSelect;
export type UserSettings        = typeof import('./users').UserSettingsSchema.$inferSelect;

// Organizations 
export * from './organizations';
export type Organization        = typeof import('./organizations').OrganizationsSchema.$inferSelect;
export type NewOrganization     = typeof import('./organizations').OrganizationsSchema.$inferInsert;
export type OrgMember           = typeof import('./organizations').OrgMembersSchema.$inferSelect;
export type OrgInvite           = typeof import('./organizations').OrgInvitesSchema.$inferSelect;
export type OrgPayoutAccount    = typeof import('./organizations').OrgPayoutAccountsSchema.$inferSelect;
export type OrgSubscription     = typeof import('./organizations').OrgSubscriptionsSchema.$inferSelect;

// Events 
export * from './events';
export type Event               = typeof import('./events').EventsSchema.$inferSelect;
export type NewEvent            = typeof import('./events').EventsSchema.$inferInsert;
export type EventLocation       = typeof import('./events').EventLocationsSchema.$inferSelect;
export type Category            = typeof import('./events').CategoriesSchema.$inferSelect;
export type Tag                 = typeof import('./events').TagsSchema.$inferSelect;
export type Ticket              = typeof import('./events').TicketsSchema.$inferSelect;
export type NewTicket           = typeof import('./events').TicketsSchema.$inferInsert;
export type PromoCode           = typeof import('./events').PromoCodesSchema.$inferSelect;
export type EventStaff          = typeof import('./events').EventStaffSchema.$inferSelect;

// Payments
export * from './payments';
export type Order               = typeof import('./payments').OrdersSchema.$inferSelect;
export type NewOrder            = typeof import('./payments').OrdersSchema.$inferInsert;
export type OrderItem           = typeof import('./payments').OrderItemsSchema.$inferSelect;
export type Payment             = typeof import('./payments').PaymentsSchema.$inferSelect;
export type Registration        = typeof import('./payments').RegistrationsSchema.$inferSelect;
export type NewRegistration     = typeof import('./payments').RegistrationsSchema.$inferInsert;
export type TicketTransfer      = typeof import('./payments').TicketTransfersSchema.$inferSelect;
export type Transaction         = typeof import('./payments').TransactionsSchema.$inferSelect;
export type Refund              = typeof import('./payments').RefundsSchema.$inferSelect;
export type Payout              = typeof import('./payments').PayoutsSchema.$inferSelect;
export type SavedPaymentMethod  = typeof import('./payments').SavedPaymentMethodsSchema.$inferSelect;
export type TaxRule             = typeof import('./payments').TaxRulesSchema.$inferSelect;

// Analytics / Social / Comms 
export * from './analytics';
export type Review              = typeof import('./analytics').ReviewsSchema.$inferSelect;
export type Follow              = typeof import('./analytics').FollowsSchema.$inferSelect;
export type Bookmark            = typeof import('./analytics').BookmarksSchema.$inferSelect;
export type Notification        = typeof import('./analytics').NotificationsSchema.$inferSelect;
export type AuditLog            = typeof import('./analytics').AuditLogsSchema.$inferSelect;
export type EventAnalyticsDaily = typeof import('./analytics').EventAnalyticsDailySchema.$inferSelect;
export type OrgAnalyticsMonthly = typeof import('./analytics').OrgAnalyticsMonthlySchema.$inferSelect;
export type OrgRevenueSummary   = typeof import('./analytics').OrgRevenueSummarySchema.$inferSelect;
export type WebhookEndpoint     = typeof import('./analytics').WebhookEndpointsSchema.$inferSelect;
export type ContentReport       = typeof import('./analytics').ContentReportsSchema.$inferSelect;