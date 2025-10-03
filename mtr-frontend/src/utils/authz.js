import { ROLE_IDS } from "../constants/rules";

export const normalizeRoles = (roles) =>
  (roles || []).map((r) => Number(r)).filter((n) => !Number.isNaN(n));

export const hasRole = (userRoles, roleId) =>
  normalizeRoles(userRoles).includes(Number(roleId));

export const hasAnyRole = (userRoles, requiredRoles = []) => {
  const normUser = normalizeRoles(userRoles);
  return requiredRoles.some((r) => normUser.includes(Number(r)));
};

export const hasAllRoles = (userRoles, requiredRoles = []) => {
  const normUser = normalizeRoles(userRoles);
  return requiredRoles.every((r) => normUser.includes(Number(r)));
};

export const isAdmin = (userRoles) => hasRole(userRoles, ROLE_IDS.ADMIN);
