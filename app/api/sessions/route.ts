import { NextRequest, NextResponse } from "next/server";
import { saveSession } from "@/lib/store";
import { ReviewSession } from "@/lib/types";
import { randomId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let body: Partial<ReviewSession> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const session: ReviewSession = {
    id: randomId(),
    title: body.title || "Untitled Review",
    code,
    language: body.language || "typescript",
    analysis: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveSession(session);
  return NextResponse.json(session, { status: 201 });
}
