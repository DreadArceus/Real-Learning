import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required')
});

export const CreateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, hyphens, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'viewer']).default('viewer')
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;