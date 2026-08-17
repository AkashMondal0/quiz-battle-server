import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, timestamp, boolean, text,
  index, uniqueIndex, jsonb,
} from 'drizzle-orm/pg-core';
import {
  accountRoleEnum, userThemeEnum, authProviderEnum,
  twoFactorMethodEnum, currencyEnum,
} from './enums';

// USERS — public-facing profile

export const UsersSchema = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    profilePicture: text('profile_picture'),
    coverImage: text('cover_image'),
    bio: text('bio'),
    website: text('website').array().notNull().default(sql`'{}'::text[]`),
    // Public ECDH key for end-to-end encrypted messaging (future)
    publicKey: text('public_key'),
    publicKeyFingerprint: text('public_key_fingerprint'),
    isPrivate: boolean('is_private').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),    // blue-tick organizers
    isBanned: boolean('is_banned').notNull().default(false),
    bannedAt: timestamp('banned_at'),
    bannedReason: text('banned_reason'),
    // Soft-delete: GDPR right-to-erasure flow
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('idx_users_username').on(t.username),
    uniqueIndex('idx_users_email').on(t.email),
    // GIN trigram for fast username / name search
    index('idx_users_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`),
    index('idx_users_username_trgm').using('gin', sql`${t.username} gin_trgm_ops`),
    index('idx_users_active').on(t.createdAt).where(
      sql`${t.deletedAt} IS NULL AND ${t.isBanned} = false`,
    ),
  ],
);

// Accounts — private operational data

export const AccountsSchema = pgTable('accounts', {
  userId: uuid('user_id').notNull().primaryKey()
    .references(() => UsersSchema.id, { onDelete: 'cascade' }),
  roles: accountRoleEnum('roles').array().notNull()
    .default(sql`ARRAY['user']::account_role[]`),
  // Last-known location for geo-personalization (not exposed publicly)
  latitude: text('latitude'),   // stored as text to avoid float precision bugs in eq checks
  longitude: text('longitude'),
  city: text('city'),
  country: text('country'),
  locale: text('locale').notNull().default('en'),
  timeZone: text('time_zone').notNull().default('UTC'),  // IANA tz
  phone: text('phone'),
  phoneCountryCode: text('phone_cc'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  // Encrypted private key (ECDH, for E2E messaging — future)
  privateKey: text('private_key'),
  locked: boolean('locked').notNull().default(false),
  lockedReason: text('locked_reason'),
  lastLoginAt: timestamp('last_login_at'),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Auth Providers — OAuth + email/password

export const AuthProvidersSchema = pgTable(
  'auth_providers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),   // external UID
    providerEmail: text('provider_email'),
    accessToken: text('access_token'),                    // encrypted at rest
    refreshToken: text('refresh_token'),                  // encrypted at rest
    tokenExpiresAt: timestamp('token_expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_auth_provider_unique').on(t.provider, t.providerUserId),
    index('idx_auth_providers_user').on(t.userId),
  ],
);

// User Credentials — hashed passwords

export const UserCredentialsSchema = pgTable('user_credentials', {
  userId: uuid('user_id').notNull().primaryKey()
    .references(() => UsersSchema.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  algorithm: text('algorithm').notNull().default('argon2id'),
  lastChangedAt: timestamp('last_changed_at').notNull().defaultNow(),
  mustReset: boolean('must_reset').notNull().default(false),
});

// Two-Factor Auth

export const TwoFactorAuthSchema = pgTable(
  'two_factor_auth',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    method: twoFactorMethodEnum('method').notNull(),
    secret: text('secret'),           // TOTP secret (encrypted)
    isEnabled: boolean('is_enabled').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_2fa_user').on(t.userId),
    uniqueIndex('idx_2fa_user_method').on(t.userId, t.method),
  ],
);

// Backup Codes (for 2FA recovery) 

export const BackupCodesSchema = pgTable(
  'backup_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),  // bcrypt hash of 8-char code
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_backup_codes_user').on(t.userId)],
);

// Sessions — multi-device

export const SessionsSchema = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    sessionToken: text('session_token').notNull().unique(),
    refreshToken: text('refresh_token').unique(),
    deviceName: text('device_name'),
    deviceType: text('device_type'),    // 'mobile' | 'desktop' | 'tablet'
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    country: text('country'),           // geo from IP at login
    isTrusted: boolean('is_trusted').notNull().default(false),
    expiresAt: timestamp('expires_at').notNull(),
    lastUsedAt: timestamp('last_used_at').defaultNow(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_sessions_user').on(t.userId),
    index('idx_sessions_expires').on(t.expiresAt),
    // Clean-up query: all active (non-revoked) sessions for a user
    index('idx_sessions_user_active')
      .on(t.userId)
      .where(sql`${t.revokedAt} IS NULL`),
  ],
);

// Password Reset / Email Verification Tokens 

export const VerificationTokensSchema = pgTable(
  'verification_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull()
      .references(() => UsersSchema.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),  // SHA-256 of raw token
    type: text('type').notNull(),  // 'email_verify' | 'password_reset' | 'phone_verify'
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_vtokens_user').on(t.userId),
    index('idx_vtokens_expires').on(t.expiresAt),
  ],
);

// User Settings 

export const UserSettingsSchema = pgTable('user_settings', {
  userId: uuid('user_id').notNull().primaryKey()
    .references(() => UsersSchema.id, { onDelete: 'cascade' }),
  theme: userThemeEnum('theme').notNull().default('system'),
  language: text('language').notNull().default('en'),
  currency: currencyEnum('currency').notNull().default('INR'),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(false),
  marketingEmails: boolean('marketing_emails').notNull().default(false),
  // Granular per-channel overrides: { 'event_reminder_24h': { email: false, push: true } }
  notifPreferences: jsonb('notif_preferences')
    .$type<Record<string, Record<string, boolean>>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
});