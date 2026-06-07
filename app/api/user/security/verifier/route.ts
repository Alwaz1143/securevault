import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

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

    const masterKeyVerifier =
      typeof body?.masterKeyVerifier === "string"
        ? body.masterKeyVerifier.trim()
        : "";

    const masterKeyVerifierIv =
      typeof body?.masterKeyVerifierIv === "string"
        ? body.masterKeyVerifierIv.trim()
        : "";

    if (!masterKeyVerifier || !masterKeyVerifierIv) {
      return NextResponse.json(
        {
          ok: false,
          message: "masterKeyVerifier and masterKeyVerifierIv are required",
        },
        { status: 400 }
      );
    }

    const latestUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        masterKeyVerifier: true,
        masterKeyVerifierIv: true,
      },
    });

    if (latestUser?.masterKeyVerifier && latestUser.masterKeyVerifierIv) {
      return NextResponse.json({
        ok: true,
        message: "Master key verifier already exists",
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        masterKeyVerifier,
        masterKeyVerifierIv,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Master key verifier saved",
    });
  } catch (error) {
    console.error("Failed to save master key verifier:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to save master key verifier",
      },
      { status: 500 }
    );
  }
}