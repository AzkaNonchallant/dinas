import { UserRole } from '@prisma/client';

export const APPROVAL_LEVEL_ROLES: { level: number; role: UserRole }[] = [
  { level: 1, role: UserRole.MANAGER },
  { level: 2, role: UserRole.DEPARTMENT_HEAD },
  { level: 3, role: UserRole.HRD },
];

export const MAX_APPROVAL_LEVEL = Math.max(...APPROVAL_LEVEL_ROLES.map((item) => item.level));