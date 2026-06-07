import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { createAuditLog } from "@/lib/audit";

const allowedActions = [
  "VAULT_UNLOCKED",
  "VAULT_LOCKED",
  "VAULT_ITEM_CREATED",
  "VAULT_ITEM_UPDATED",
  "VAULT_ITEM_DELETED",
  "BREACH_CHECK_PERFORMED",
] as const;

type AuditAction = (typeof allowedActions)[number];

function isValidAuditAction(action: unknown): action is AuditAction {
  return (
    typeof action === "string" &&
    allowedActions.includes(action as AuditAction)
  );
}

function isSafeMetadata(metadata: unknown): metadata is Record<string, unknown> {
  if (metadata === undefined || metadata === null) {
    return true;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      logs,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch audit logs",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const action = body?.action;
    const metadata = body?.metadata;

    if (!isValidAuditAction(action)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid audit action",
        },
        { status: 400 }
      );
    }

    if (!isSafeMetadata(metadata)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid metadata",
        },
        { status: 400 }
      );
    }

    const log = await createAuditLog({
      userId: user.id,
      action,
      metadata: metadata as Record<string, string | number | boolean | null>,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Audit log created",
        log,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create audit log:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to create audit log",
      },
      { status: 500 }
    );
  }
}