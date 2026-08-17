"use client";

import { useEffect, useRef, useState } from "react";
import { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function CommentsPanel({
  comments,
  selectedLine,
  onAddComment,
}: {
  comments: Comment[];
  selectedLine: number | null;
  onAddComment: (line: number, body: string) => void;
}) {
  const [body, setBody] = useState("");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Follow a line a user clicks; otherwise fall back to selected line from the editor.
  useEffect(() => {
    if (selectedLine) setActiveLine(selectedLine);
  }, [selectedLine]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [comments.length]);

  const submit = () => {
    const target = activeLine ?? selectedLine;
    if (!target || !body.trim()) return;
    onAddComment(target, body.trim());
    setBody("");
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-500">
            Click a line in the code, then leave a comment below.
          </p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 space-y-1"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: c.authorColor, color: "#000" }}
              >
                {c.author.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs font-medium">{c.author}</span>
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                L{c.line}
              </span>
              <span className="ml-auto text-[10px] text-neutral-500">
                {timeAgo(c.createdAt)}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800 p-3 space-y-2">
        <p className="text-[11px] text-neutral-500">
          Commenting on{" "}
          <span className="text-orange-400 font-medium">
            line {activeLine ?? selectedLine ?? "—"}
          </span>{" "}
          (click a line to change)
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder={`Comment on line ${activeLine ?? selectedLine ?? "…"}`}
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-sm outline-none focus:border-orange-500"
        />
        <button
          onClick={submit}
          disabled={!body.trim() || !(activeLine ?? selectedLine)}
          className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40 transition-colors"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}
