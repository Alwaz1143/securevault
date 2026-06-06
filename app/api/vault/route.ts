import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Vault API" });
}

export async function POST() {
  return NextResponse.json({ message: "Vault API" });
}
