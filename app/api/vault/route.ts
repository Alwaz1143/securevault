import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { createAuditLog } from "@/lib/audit";

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

    const vaultItems = await prisma.vaultItem.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        encryptedData: true,
        iv: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      items: vaultItems,
    });
  } catch (error) {
    console.error("Failed to fetch vault items:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch vault items",
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

    const encryptedData =
      typeof body?.encryptedData === "string" ? body.encryptedData.trim() : "";

    const iv = typeof body?.iv === "string" ? body.iv.trim() : "";

    if (!encryptedData || !iv) {
      return NextResponse.json(
        {
          ok: false,
          message: "encryptedData and iv are required",
        },
        { status: 400 }
      );
    }

    const vaultItem = await prisma.vaultItem.create({
      data: {
        userId: user.id,
        encryptedData,
        iv,
      },
      select: {
        id: true,
        encryptedData: true,
        iv: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "VAULT_ITEM_CREATED",
      metadata: {
        vaultItemId: vaultItem.id,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Vault item created",
        item: vaultItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create vault item:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to create vault item",
      },
      { status: 500 }
    );
  }
}