export const GLOBAL_ROLES = {
  SUPER_ADMIN: "super_admin",
} as const;

export const TENANT_ROLES = {
  BARBERSHOP_OWNER: "barbershop_owner",
  BARBERSHOP_MANAGER: "barbershop_manager",
  BARBER: "barber",
  CUSTOMER: "customer",
} as const;

export type GlobalRole = typeof GLOBAL_ROLES[keyof typeof GLOBAL_ROLES];
export type TenantRole = typeof TENANT_ROLES[keyof typeof TENANT_ROLES];

export function isTenantManagementRole(role: string | null | undefined) {
  return role === TENANT_ROLES.BARBERSHOP_OWNER || role === TENANT_ROLES.BARBERSHOP_MANAGER;
}

export function isBarberRole(role: string | null | undefined) {
  return role === TENANT_ROLES.BARBER;
}

export function isCustomerRole(role: string | null | undefined) {
  return role === TENANT_ROLES.CUSTOMER;
}
