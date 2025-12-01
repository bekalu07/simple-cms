import { User, Resource, SystemConfig, AccessDecision, Role, SecurityLevel } from '../types';

export const checkAccess = (
  user: User,
  resource: Resource,
  config: SystemConfig
): AccessDecision => {
  // 1. MAC (Mandatory Access Control)
  // Logic: User Clearance >= Resource Classification
  if (config.enableMAC) {
    if (user.clearanceLevel < resource.classification) {
      return { allowed: false, reason: `MAC: Clearance Level ${user.clearanceLevel} is insufficient for ${resource.classification} data.` };
    }
  }

  // 2. ABAC (Attribute-Based Access Control)
  // Logic: User Dept must match Resource Dept OR User is Admin
  if (config.enableABAC) {
    if (user.role !== Role.ADMIN && user.department !== resource.department) {
       // Exception: If resource is PUBLIC, ABAC might be lenient, but let's be strict for demo
       if (resource.classification > SecurityLevel.PUBLIC) {
         return { allowed: false, reason: `ABAC: User department (${user.department}) does not match resource department (${resource.department}).` };
       }
    }
  }

  // 3. RBAC (Role-Based Access Control)
  // Logic: Only Managers/Admins can see Confidential/Top Secret
  if (config.enableRBAC) {
    if (resource.classification === SecurityLevel.TOP_SECRET && user.role !== Role.ADMIN) {
      return { allowed: false, reason: "RBAC: Only ADMIN role can access TOP_SECRET resources." };
    }
    if (resource.classification === SecurityLevel.CONFIDENTIAL && user.role === Role.STAFF) {
        return { allowed: false, reason: "RBAC: STAFF role cannot access CONFIDENTIAL resources." };
    }
  }

  // 4. RuBAC (Rule-Based Access Control)
  // Logic: Time of day restrictions.
  if (config.enableRuBAC) {
    const currentHour = new Date().getHours();
    if (currentHour < config.workingHoursStart || currentHour >= config.workingHoursEnd) {
      // Admins bypass RuBAC
      if (user.role !== Role.ADMIN) {
        return { allowed: false, reason: `RuBAC: Access denied outside working hours (${config.workingHoursStart}:00 - ${config.workingHoursEnd}:00).` };
      }
    }
  }

  // 5. DAC (Discretionary Access Control)
  // Logic: User owns it OR is in sharedWith list OR is Admin
  if (config.enableDAC) {
    const isOwner = resource.ownerId === user.id;
    const isShared = resource.sharedWith.includes(user.id);
    const isAdmin = user.role === Role.ADMIN;
    
    if (!isOwner && !isShared && !isAdmin && resource.classification > SecurityLevel.PUBLIC) {
      return { allowed: false, reason: "DAC: You do not own this resource and it has not been shared with you." };
    }
  }

  return { allowed: true, reason: "Access Granted" };
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const validatePasswordStrength = (password: string): string | null => {
  const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
  if (!strongRegex.test(password)) {
    return "Password must be 8+ chars, include uppercase, number, and symbol.";
  }
  return null;
};

export const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  return {
    question: `${num1} + ${num2}`,
    answer: num1 + num2
  };
};