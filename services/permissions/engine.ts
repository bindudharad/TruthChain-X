import { ApiPlan, PlatformRole } from "@/lib/types";

export type PermissionAction =
  | "UPLOAD"
  | "SEARCH_SIMILARITY"
  | "REPORT_CONTENT"
  | "VIEW_INTELLIGENCE"
  | "MANAGE_USERS"
  | "TAKEDOWN"
  | "VIEW_ANALYTICS";

const rolePermissions: Record<PlatformRole, PermissionAction[]> = {
  user: ["UPLOAD", "SEARCH_SIMILARITY", "REPORT_CONTENT"],
  moderator: ["UPLOAD", "SEARCH_SIMILARITY", "REPORT_CONTENT", "TAKEDOWN"],
  admin: ["UPLOAD", "SEARCH_SIMILARITY", "REPORT_CONTENT", "TAKEDOWN", "MANAGE_USERS", "VIEW_ANALYTICS"],
  enterprise: ["UPLOAD", "SEARCH_SIMILARITY", "REPORT_CONTENT", "TAKEDOWN", "MANAGE_USERS", "VIEW_ANALYTICS", "VIEW_INTELLIGENCE"]
};

export function canPerform(user: { role: PlatformRole; trustScore: number; plan?: ApiPlan }, action: PermissionAction) {
  if (action === "UPLOAD" && user.trustScore < 40) return false;
  if (action === "SEARCH_SIMILARITY" && user.trustScore < 30) return false;
  if (action === "VIEW_INTELLIGENCE" && !(user.plan === "enterprise" || user.plan === "internal" || user.role === "enterprise")) return false;
  return rolePermissions[user.role].includes(action);
}

export function listAllowedActions(user: { role: PlatformRole; trustScore: number; plan?: ApiPlan }) {
  return rolePermissions[user.role].filter((action) => canPerform(user, action));
}
