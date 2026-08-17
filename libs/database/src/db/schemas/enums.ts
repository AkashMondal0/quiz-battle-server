import { pgEnum } from 'drizzle-orm/pg-core';

// All enums in one export for easy import

// User / Auth

export const _userThemeEnum = [
  'light',
  'dark',
  'system',
] as const;

export const _accountRoleEnum = [
  'superadmin',
  'admin',
  'user',
  'guest',
] as const;

export const _authProviderEnum = [
  'email',
  'google',
  'github',
  'apple',
  'facebook',
] as const;

export const _twoFactorMethodEnum = [
  'totp',
  'sms',
  'email',
  'backup_code',
] as const;

// Organization

export const _orgRoleEnum = [
  'owner',
  'admin',
  'manager',
  'member',
] as const;

export const _orgPlanEnum = [
  'free',
  'starter',
  'pro',
  'enterprise',
] as const;

export const _inviteStatusEnum = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const;

// Event

export const _eventTypeEnum = [
  'class', 'conference', 'festival', 'party', 'appearance',
  'attraction', 'convention', 'expo', 'gala', 'game',
  'networking', 'performance', 'race', 'rally', 'retreat',
  'screening', 'seminar', 'tournament', 'tour',
  'hackathon', 'workshop', 'meetup', 'webinar', 'other',
] as const;

export const _eventStatusEnum = [
  'draft',
  'review',
  'published',
  'cancelled',
  'postponed',
  'completed',
  'archived',
] as const;

export const _eventVisibilityEnum = [
  'public',
  'unlisted',
  'private',
] as const;

export const _eventFormatEnum = [
  'in_person',
  'online',
  'hybrid',
] as const;

// Tickets

export const _ticketTypeEnum = [
  'free',
  'paid',
  'donation',
  'comp',
] as const;

export const _ticketTransferStatusEnum = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled',
] as const;

// Registrations

export const _registrationStatusEnum = [
  'pending',
  'confirmed',
  'waitlisted',
  'cancelled',
  'refunded',
  'no_show',
  'transferred',
] as const;

// Payments & Finance

export const _paymentStatusEnum = [
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
  'disputed',
  'chargeback',
] as const;

export const _paymentMethodTypeEnum = [
  'card',
  'upi',
  'net_banking',
  'wallet',
  'bank_transfer',
  'crypto',
  'cash',
] as const;

export const _currencyEnum = [
  'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED',
] as const;

export const _transactionTypeEnum = [
  'charge',
  'refund',
  'payout',
  'payout_reversal',
  'platform_fee',
  'tax',
  'adjustment',
] as const;

export const _payoutStatusEnum = [
  'scheduled',
  'processing',
  'paid',
  'failed',
  'on_hold',
  'cancelled',
] as const;

export const _refundReasonEnum = [
  'event_cancelled',
  'event_postponed',
  'buyer_request',
  'duplicate_purchase',
  'fraud',
  'chargeback',
  'organizer_issued',
  'other',
] as const;

export const _discountTypeEnum = [
  'percentage',
  'fixed_amount',
] as const;

export const _promoCodeStatusEnum = [
  'active',
  'inactive',
  'expired',
  'exhausted',
] as const;

// Organizer / Analytics

export const _payoutScheduleEnum = [
  'immediate',
  'weekly',
  'monthly',
  'manual',
] as const;

// Reviews / Social

export const _reviewStatusEnum = [
  'published',
  'hidden',
  'flagged',
  'deleted',
] as const;

export const _reportReasonEnum = [
  'spam',
  'inappropriate_content',
  'false_information',
  'hate_speech',
  'scam',
  'other',
] as const;

export const _followEntityEnum = [
  'user',
  'organization',
  'category',
  'tag',
] as const;

// Notifications

export const _notificationTypeEnum = [
  'event_published',
  'event_update',
  'event_cancelled',
  'event_reminder_24h',
  'event_reminder_1h',
  'registration_confirmed',
  'registration_cancelled',
  'registration_waitlist_promoted',
  'ticket_transfer_received',
  'review_request',
  'review_response',
  'payment_succeeded',
  'payment_failed',
  'refund_issued',
  'payout_sent',
  'org_invite',
  'org_role_changed',
  'follow_new',
  'system',
] as const;

export const _notificationChannelEnum = [
  'in_app',
  'email',
  'push',
  'sms',
  'webhook',
] as const;

// Audit

export const _auditActionEnum = [
  'create', 'update', 'delete', 'publish', 'cancel', 'postpone',
  'check_in', 'role_change', 'transfer', 'refund', 'payout',
  'ban', 'unban', 'flag', 'unflag',
] as const;


// User / Auth 

export const userThemeEnum = pgEnum('user_theme', _userThemeEnum);
export const accountRoleEnum = pgEnum('account_role', _accountRoleEnum);
export const authProviderEnum = pgEnum('auth_provider', _authProviderEnum);
export const twoFactorMethodEnum = pgEnum('two_factor_method', _twoFactorMethodEnum);

export const orgRoleEnum = pgEnum('org_role', _orgRoleEnum);
export const orgPlanEnum = pgEnum('org_plan', _orgPlanEnum);
export const inviteStatusEnum = pgEnum('invite_status', _inviteStatusEnum);

export const eventTypeEnum = pgEnum('event_type', _eventTypeEnum);
export const eventStatusEnum = pgEnum('event_status', _eventStatusEnum);
export const eventVisibilityEnum = pgEnum('event_visibility', _eventVisibilityEnum);
export const eventFormatEnum = pgEnum('event_format', _eventFormatEnum);

export const ticketTypeEnum = pgEnum('ticket_type', _ticketTypeEnum);
export const ticketTransferStatusEnum = pgEnum('ticket_transfer_status', _ticketTransferStatusEnum);

export const registrationStatusEnum = pgEnum('registration_status', _registrationStatusEnum);

export const paymentStatusEnum = pgEnum('payment_status', _paymentStatusEnum);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', _paymentMethodTypeEnum);
export const currencyEnum = pgEnum('currency', _currencyEnum);
export const transactionTypeEnum = pgEnum('transaction_type', _transactionTypeEnum);
export const payoutStatusEnum = pgEnum('payout_status', _payoutStatusEnum);
export const refundReasonEnum = pgEnum('refund_reason', _refundReasonEnum);
export const discountTypeEnum = pgEnum('discount_type', _discountTypeEnum);
export const promoCodeStatusEnum = pgEnum('promo_code_status', _promoCodeStatusEnum);

export const payoutScheduleEnum = pgEnum('payout_schedule', _payoutScheduleEnum);

export const reviewStatusEnum = pgEnum('review_status', _reviewStatusEnum);
export const reportReasonEnum = pgEnum('report_reason', _reportReasonEnum);
export const followEntityEnum = pgEnum('follow_entity', _followEntityEnum);

export const notificationTypeEnum = pgEnum('notification_type', _notificationTypeEnum);
export const notificationChannelEnum = pgEnum('notification_channel', _notificationChannelEnum);

export const auditActionEnum = pgEnum('audit_action', _auditActionEnum);