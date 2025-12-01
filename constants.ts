import { User, Role, Department, SecurityLevel, Resource, SystemConfig } from './types';

export const INITIAL_CONFIG: SystemConfig = {
  enableMAC: true,
  enableDAC: true,
  enableRBAC: true,
  enableRuBAC: false, // Disabled by default for demo usability
  enableABAC: true,
  workingHoursStart: 9,
  workingHoursEnd: 17,
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    fullName: 'System Administrator',
    email: 'admin@secureguard.com',
    role: Role.ADMIN,
    department: Department.IT,
    clearanceLevel: SecurityLevel.TOP_SECRET,
    passwordHash: 'hashed_admin123', // Simulated hash
    mfaEnabled: true,
    isLocked: false,
    failedLoginAttempts: 0,
    biometricsEnabled: true,
  },
  {
    id: 'u2',
    username: 'alice_manager',
    fullName: 'Alice HR Manager',
    email: 'alice@secureguard.com',
    role: Role.MANAGER,
    department: Department.HR,
    clearanceLevel: SecurityLevel.CONFIDENTIAL,
    passwordHash: 'hashed_alice123',
    mfaEnabled: true,
    isLocked: false,
    failedLoginAttempts: 0,
    biometricsEnabled: false,
  },
  {
    id: 'u3',
    username: 'bob_staff',
    fullName: 'Bob Finance Staff',
    email: 'bob@secureguard.com',
    role: Role.STAFF,
    department: Department.FINANCE,
    clearanceLevel: SecurityLevel.INTERNAL,
    passwordHash: 'hashed_bob123',
    mfaEnabled: false,
    isLocked: false,
    failedLoginAttempts: 0,
    biometricsEnabled: false,
  },
  {
    id: 'u4',
    username: 'charlie_sales',
    fullName: 'Charlie Sales',
    email: 'charlie@secureguard.com',
    role: Role.STAFF,
    department: Department.SALES,
    clearanceLevel: SecurityLevel.PUBLIC,
    passwordHash: 'hashed_charlie123',
    mfaEnabled: false,
    isLocked: false,
    failedLoginAttempts: 0,
    biometricsEnabled: false,
  }
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    name: 'CEO Salary Report',
    type: 'REPORT',
    content: 'Annual Salary: $5,000,000 + Stock Options',
    ownerId: 'u1',
    classification: SecurityLevel.TOP_SECRET,
    department: Department.HR,
    sharedWith: [],
  },
  {
    id: 'r2',
    name: 'Q3 Finance Overview',
    type: 'DOCUMENT',
    content: 'Revenue: $12M, Net Profit: $2.4M',
    ownerId: 'u3', // Bob owns this
    classification: SecurityLevel.CONFIDENTIAL,
    department: Department.FINANCE,
    sharedWith: ['u2'], // Shared with Alice
  },
  {
    id: 'r3',
    name: 'Employee Handbook',
    type: 'DOCUMENT',
    content: 'Standard operating procedures and code of conduct.',
    ownerId: 'u2',
    classification: SecurityLevel.PUBLIC,
    department: Department.HR,
    sharedWith: [],
  },
  {
    id: 'r4',
    name: 'Client List - North America',
    type: 'CONTACT',
    content: 'TechCorp, MegaSystems, FutureAI',
    ownerId: 'u4',
    classification: SecurityLevel.INTERNAL,
    department: Department.SALES,
    sharedWith: ['u2'],
  },
];
