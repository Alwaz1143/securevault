import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getCurrentDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  const primaryEmail =
    clerkUser?.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;

  const dbUser = await prisma.user.upsert({
    where: {
      clerkUserId: userId,
    },
    update: {
      email: primaryEmail,
    },
    create: {
      clerkUserId: userId,
      email: primaryEmail,
    },
  });

  return dbUser;
}