import { NextRequest, NextResponse } from "next/server";
import { analyzeCode } from "@/lib/claude";
import { getSession, saveSession } from "@/lib/store";

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; code?: string; language?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const analysis = await analyzeCode(code, body.language || "");

  if (body.sessionId) {
    const session = await getSession(body.sessionId);
    if (session) {
      session.analysis = analysis;
      session.updatedAt = new Date().toISOString();
      await saveSession(session);
    }
  }

  return NextResponse.json({ analysis });
}
