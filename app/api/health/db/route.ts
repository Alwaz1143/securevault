import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();

    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

    const dbUser = await prisma.user.upsert({
      where: {
        clerkUserId: userId,
      },
      update: {
        email,
      },
      create: {
        clerkUserId: userId,
        email,
      },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Database connected successfully",
      user: dbUser,
    });
  } catch (error) {
    console.error("DB health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}