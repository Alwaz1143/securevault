import prisma from "./prisma";

export type AuditAction =
  | "VAULT_ITEM_CREATED"
  | "VAULT_ITEM_VIEWED"
  | "VAULT_ITEM_UPDATED"
  | "VAULT_ITEM_DELETED"
  | "PASSWORD_GENERATED"
  | "BREACH_CHECK_PERFORMED"
  | "SETTINGS_UPDATED";

export async function createAuditLog(params: {
  action: AuditAction;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.userId ?? "anonymous",
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
