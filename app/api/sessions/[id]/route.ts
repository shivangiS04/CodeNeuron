import { NextRequest, NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.title === "string") session.title = body.title;
  if (typeof body.code === "string") session.code = body.code;
  if (typeof body.language === "string") session.language = body.language;
  session.updatedAt = new Date().toISOString();
  await saveSession(session);
  return NextResponse.json(session);
}
