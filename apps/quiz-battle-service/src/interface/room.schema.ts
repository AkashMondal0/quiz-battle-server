import { z } from 'zod';

export const GameModeSchema = z.enum([
  'CLASSIC',
  'SPEED',
  'ELIMINATION',
]);

export const DifficultySchema = z.enum([
  'EASY',
  'MEDIUM',
  'HARD',
]);

export const RoomVisibilitySchema = z.enum([
  'PUBLIC',
  'PRIVATE',
]);

