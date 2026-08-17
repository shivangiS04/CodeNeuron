import { NextRequest, NextResponse } from "next/server";
import { addComment, getComments } from "@/lib/store";
import { Comment } from "@/lib/types";
import { randomId } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const comments = await getComments(params.id);
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: Partial<Comment> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const line = typeof body.line === "number" ? body.line : NaN;
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!Number.isFinite(line) || line < 1) {
    return NextResponse.json({ error: "A valid line is required" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }
  const comment: Comment = {
    id: body.id || randomId(),
    sessionId: params.id,
    line,
    author: body.author || "Anonymous",
    authorColor: body.authorColor || "#06b6d4",
    body: text,
    createdAt: body.createdAt || new Date().toISOString(),
  };
  await addComment(comment);
  return NextResponse.json(comment, { status: 201 });
}
