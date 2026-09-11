import z from "zod";

export const JoinRoomSchema = z.object({
  roomId: z
    .string()
    .trim()
    .min(1)
    .max(100),
});

export type JoinRoomInput =
  z.infer<typeof JoinRoomSchema>;

  export const AnswerQuestionSchema = z.object({
  roomId: z
    .string()
    .trim()
    .min(1),

  questionId: z
    .string()
    .trim()
    .min(1),

  answerIndex: z
    .number()
    .int()
    .min(0)
    .max(20),
});

export type AnswerQuestionInput =
  z.infer<typeof AnswerQuestionSchema>;

  export const SendChatSchema = z.object({
  roomId: z
    .string()
    .trim()
    .min(1),

  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(300, 'Message cannot exceed 300 characters'),
});

export type SendChatInput =
  z.infer<typeof SendChatSchema>;