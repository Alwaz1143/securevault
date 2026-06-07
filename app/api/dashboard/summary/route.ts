import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

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

    const [vaultItemCount, auditLogCount, recentAuditLogs] =
      await Promise.all([
        prisma.vaultItem.count({
          where: {
            userId: user.id,
          },
        }),

        prisma.auditLog.count({
          where: {
            userId: user.id,
          },
        }),

        prisma.auditLog.findMany({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            action: true,
            metadata: true,
            createdAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,
      summary: {
        vaultItemCount,
        auditLogCount,
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("Failed to load dashboard summary:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to load dashboard summary",
      },
      { status: 500 }
    );
  }
}