import { z } from 'zod';

export const CreateStatusSchema = z.object({
  lastWaterIntake: z.string().datetime({
    message: 'lastWaterIntake must be a valid ISO datetime string'
  }),
  altitude: z.number().int().min(1).max(10, {
    message: 'altitude must be between 1 and 10'
  })
});

export const UpdateStatusSchema = z.object({
  lastWaterIntake: z.string().datetime({
    message: 'lastWaterIntake must be a valid ISO datetime string'
  }).optional(),
  altitude: z.number().int().min(1).max(10, {
    message: 'altitude must be between 1 and 10'
  }).optional()
}).refine(
  (data) => data.lastWaterIntake !== undefined || data.altitude !== undefined,
  {
    message: 'At least one field (lastWaterIntake or altitude) must be provided'
  }
);

export const UserIdSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, {
  message: 'userId must contain only alphanumeric characters, hyphens, and underscores'
});

export const LimitSchema = z.number().int().min(1).max(100);

export type CreateStatusInput = z.infer<typeof CreateStatusSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;