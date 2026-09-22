import type { User } from '@prisma/client';

export type SanitizedUser = Omit<User, 'password'>;

export type AuthResponse = {
  user: SanitizedUser;
  token: string;
};