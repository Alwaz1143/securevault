"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { VaultProvider } from "@/contexts/VaultContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <VaultProvider>{children}</VaultProvider>
    </ClerkProvider>
  );
}