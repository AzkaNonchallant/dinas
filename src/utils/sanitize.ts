export function sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _password, ...rest } = user;
  return rest;
}