import prisma from "./prisma";

export type AuditAction =
  | "VAULT_UNLOCKED"
  | "VAULT_LOCKED"
  | "VAULT_ITEM_CREATED"
  | "VAULT_ITEM_UPDATED"
  | "VAULT_ITEM_DELETED"
  | "BREACH_CHECK_PERFORMED";

type CreateAuditLogInput = {
  userId: string;
  action: AuditAction;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function createAuditLog({
  userId,
  action,
  metadata,
}: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      metadata: metadata ?? undefined,
    },
  });
}