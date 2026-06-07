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

    return NextResponse.json({
      ok: true,
      kdfSalt: user.kdfSalt,
      masterKeyVerifier: user.masterKeyVerifier,
      masterKeyVerifierIv: user.masterKeyVerifierIv,
    });
  } catch (error) {
    console.error("Failed to fetch user security settings:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch user security settings",
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

    const kdfSalt = typeof body?.kdfSalt === "string" ? body.kdfSalt.trim() : "";

    if (!kdfSalt) {
      return NextResponse.json(
        {
          ok: false,
          message: "kdfSalt is required",
        },
        { status: 400 }
      );
    }

    const latestUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        kdfSalt: true,
      },
    });

    if (latestUser?.kdfSalt) {
      return NextResponse.json({
        ok: true,
        message: "KDF salt already exists",
        kdfSalt: latestUser.kdfSalt,
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        kdfSalt,
      },
      select: {
        kdfSalt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "KDF salt saved",
      kdfSalt: updatedUser.kdfSalt,
    });
  } catch (error) {
    console.error("Failed to save user security settings:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to save user security settings",
      },
      { status: 500 }
    );
  }
}