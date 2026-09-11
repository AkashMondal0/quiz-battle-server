import { z } from 'zod';

export const RoomHostSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, 'userId is required'),

  username: z
    .string()
    .trim()
    .min(1, 'username is required')
    .max(100),

  profilePicture: z
    .string()
    .nullable()
    .optional(),

  avatarId: z
    .string()
    .nullable()
    .optional(),
});

export const CreateRoomSchema = z.object({
  host: RoomHostSchema,

  topic: z
    .string()
    .trim()
    .min(1, 'topic is required')
    .max(200),

  prompt: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default(''),

  aiId: z
    .string()
    .trim()
    .min(1, 'aiId is required'),

  mode: z
    .string()
    .trim()
    .min(1, 'mode is required'),

  difficulty: z
    .string()
    .trim()
    .min(1, 'difficulty is required'),

  visibility: z
    .string()
    .trim()
    .min(1, 'visibility is required'),

  maxPlayers: z
    .number()
    .int()
    .min(2)
    .max(100),

  numberOfQuestions: z
    .number()
    .int()
    .min(1)
    .max(100),

  totalTimeSeconds: z
    .number()
    .int()
    .min(10)
    .max(3600),
});

export type CreateRoomInput =
  z.infer<typeof CreateRoomSchema>;