export enum SecurityLevel {
  PUBLIC = 0,
  INTERNAL = 1,
  CONFIDENTIAL = 2,
  TOP_SECRET = 3,
}

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  AUDITOR = 'AUDITOR',
}

export enum Department {
  IT = 'IT',
  HR = 'HR',
  FINANCE = 'FINANCE',
  SALES = 'SALES',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role; // RBAC
  department: Department; // ABAC
  clearanceLevel: SecurityLevel; // MAC
  passwordHash: string; // Hashed
  mfaEnabled: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  biometricsEnabled: boolean;
}

export interface Resource {
  id: string;
  name: string;
  type: 'CONTACT' | 'DOCUMENT' | 'REPORT';
  content: string; // The sensitive data
  ownerId: string; // DAC
  classification: SecurityLevel; // MAC
  department: Department; // ABAC
  sharedWith: string[]; // DAC (User IDs)
}

export interface LogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceId?: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  details: string;
  ipAddress: string;
}

export interface SystemConfig {
  enableMAC: boolean;
  enableDAC: boolean;
  enableRBAC: boolean;
  enableRuBAC: boolean; // Time/Location rules
  enableABAC: boolean;
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
}

export type AccessDecision = {
  allowed: boolean;
  reason: string;
};
