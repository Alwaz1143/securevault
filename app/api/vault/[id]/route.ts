import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { createAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

    const { id } = await context.params;

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

    const updateResult = await prisma.vaultItem.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        encryptedData,
        iv,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Vault item not found",
        },
        { status: 404 }
      );
    }

    const updatedItem = await prisma.vaultItem.findFirst({
      where: {
        id,
        userId: user.id,
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
      action: "VAULT_ITEM_UPDATED",
      metadata: {
        vaultItemId: id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Vault item updated",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Failed to update vault item:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to update vault item",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const { id } = await context.params;

    const deleteResult = await prisma.vaultItem.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Vault item not found",
        },
        { status: 404 }
      );
    }

    await createAuditLog({
      userId: user.id,
      action: "VAULT_ITEM_DELETED",
      metadata: {
        vaultItemId: id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Vault item deleted",
    });
  } catch (error) {
    console.error("Failed to delete vault item:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to delete vault item",
      },
      { status: 500 }
    );
  }
}