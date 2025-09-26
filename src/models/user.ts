import { z } from 'zod';

export const UserSchema = z.object({
  name: z.string().min(1, 'User name is required'),
  emailAddress: z.string().email('Valid email address is required'),
  displayName: z.string().min(1, 'Display name is required'),
});

export type User = z.infer<typeof UserSchema>;
