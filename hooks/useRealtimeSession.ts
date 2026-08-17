"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Comment, Cursor, PresenceUser } from "@/lib/types";
import { randomId } from "@/lib/utils";
import { useUser } from "./useUser";

export function useRealtimeSession(sessionId: string) {
  const { user, setUser, chooseName } = useUser();
  const [users, setUsers] = useState<Record<string, PresenceUser>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load persisted comments on mount.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/sessions/${sessionId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Comment[]) => {
        if (!cancelled) setComments(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Set up the realtime channel (presence + broadcast) when configured.
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured || !user.userId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel(`session:${sessionId}`, {
      config: { presence: { key: user.userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const next: Record<string, PresenceUser> = {};
        for (const key of Object.keys(state)) {
          const metas = state[key];
          if (metas && metas.length) next[key] = metas[metas.length - 1];
        }
        setUsers(next);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        const c = payload as { userId: string; cursor: Cursor };
        setUsers((prev) => {
          const existing = prev[c.userId];
          if (!existing) return prev;
          return { ...prev, [c.userId]: { ...existing, cursor: c.cursor } };
        });
      })
      .on("broadcast", { event: "comment" }, ({ payload }) => {
        const c = payload as { comment: Comment };
        setComments((prev) => {
          if (prev.some((x) => x.id === c.comment.id)) return prev;
          return [...prev, c.comment];
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.userId,
            name: user.name,
            color: user.color,
            updatedAt: Date.now(),
          });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, user.userId, user.name, user.color]);

  /** Broadcast this user's cursor position to others. */
  const broadcastCursor = useCallback(
    (cursor: Cursor) => {
      if (!user.userId) return;
      // Reflect locally immediately.
      setUsers((prev) => {
        const existing = prev[user.userId] || {
          userId: user.userId,
          name: user.name,
          color: user.color,
          updatedAt: Date.now(),
        };
        return { ...prev, [user.userId]: { ...existing, cursor, updatedAt: Date.now() } };
      });
      if (channelRef.current && isSupabaseConfigured) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor",
          payload: { userId: user.userId, cursor },
        });
      }
    },
    [user.userId, user.name, user.color]
  );

  /** Persist + broadcast a new line comment. */
  const addComment = useCallback(
    async (line: number, body: string) => {
      if (!user.userId) return null;
      const comment: Comment = {
        id: randomId(),
        sessionId,
        line,
        body,
        author: user.name,
        authorColor: user.color,
        createdAt: new Date().toISOString(),
      };
      // Reflect locally.
      setComments((prev) => [...prev, comment]);
      // Persist via server (idempotent on duplicate id).
      fetch(`/api/sessions/${sessionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      }).catch(() => {});
      // Broadcast to peers.
      if (channelRef.current && isSupabaseConfigured) {
        channelRef.current.send({
          type: "broadcast",
          event: "comment",
          payload: { comment },
        });
      }
      return comment;
    },
    [sessionId, user.userId, user.name, user.color]
  );

  return { users, comments, broadcastCursor, addComment, user, setUser, chooseName };
}
