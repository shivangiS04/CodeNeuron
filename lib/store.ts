import { Comment, ReviewSession } from "./types";
import { getSupabase } from "./supabase";

/**
 * In-memory store keeps the app working with zero configuration and across
 * restarts of a single server. When Supabase is configured we also upsert so
 * sessions survive cold starts (e.g. on Vercel serverless).
 */
const sessions = new Map<string, ReviewSession>();
const commentsMap = new Map<string, Comment[]>();

function mapSession(row: Record<string, any>): ReviewSession {
  return {
    id: row.id,
    title: row.title ?? "Untitled Review",
    code: row.code ?? "",
    language: row.language ?? "typescript",
    analysis: row.analysis ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

function mapComment(row: Record<string, any>): Comment {
  return {
    id: row.id,
    sessionId: row.session_id ?? row.sessionId,
    line: row.line,
    author: row.author,
    authorColor: row.author_color ?? row.authorColor ?? "#06b6d4",
    body: row.body,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

export async function saveSession(s: ReviewSession): Promise<void> {
  sessions.set(s.id, s);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("sessions").upsert({
        id: s.id,
        title: s.title,
        code: s.code,
        language: s.language,
        analysis: s.analysis ?? null,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      });
    } catch {
      /* table not provisioned yet — memory only */
    }
  }
}

export async function getSession(id: string): Promise<ReviewSession | undefined> {
  const mem = sessions.get(id);
  if (mem) return mem;
  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const s = mapSession(data);
        sessions.set(id, s);
        return s;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export async function addComment(c: Comment): Promise<void> {
  const list = commentsMap.get(c.sessionId) || [];
  list.push(c);
  commentsMap.set(c.sessionId, list);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("comments").insert({
        id: c.id,
        session_id: c.sessionId,
        line: c.line,
        author: c.author,
        author_color: c.authorColor,
        body: c.body,
        created_at: c.createdAt,
      });
    } catch {
      /* ignore */
    }
  }
}

export async function getComments(sessionId: string): Promise<Comment[]> {
  const mem = commentsMap.get(sessionId) || [];
  if (mem.length > 0) return mem;
  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("comments")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at");
      if (data && data.length > 0) {
        commentsMap.set(sessionId, data.map(mapComment));
        return data.map(mapComment);
      }
    } catch {
      /* ignore */
    }
  }
  return mem;
}
