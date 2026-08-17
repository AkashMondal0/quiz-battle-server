export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';

export const RABBITMQ_EVENTS = {
  USER_CREATED: 'user.created',

  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',

  NOTIFICATION_SEND: 'notification.send',

  EVENT_REMINDER: 'event.reminder',
} as const;