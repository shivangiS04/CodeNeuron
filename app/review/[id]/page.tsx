"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { useVotes } from "@/hooks/useVotes";
import { CodeAnalysis, ReviewSession } from "@/lib/types";
import CodeEditor from "@/components/CodeEditor";
import AIPanel from "@/components/AIPanel";
import CommentsPanel from "@/components/CommentsPanel";
import PresenceBar from "@/components/PresenceBar";
import ShareDialog from "@/components/ShareDialog";

type Tab = "ai" | "comments";

export default function ReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<ReviewSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("ai");
  const [shareOpen, setShareOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const { users, comments, broadcastCursor, addComment, user, chooseName } =
    useRealtimeSession(id);
  const { onVote, scoreOf } = useVotes(id);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s: ReviewSession) => {
        if (cancelled) return;
        setSession(s);
        setCode(s.code || "");
        setLanguage(s.language || "typescript");
        setAnalysis(s.analysis || null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const commentCounts = useMemo(() => {
    const m: Record<number, number> = {};
    comments.forEach((c) => {
      m[c.line] = (m[c.line] || 0) + 1;
    });
    return m;
  }, [comments]);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, code, language }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
    } finally {
      setAnalyzing(false);
    }
  }, [id, code, language]);

  const handleExport = useCallback(() => {
    const payload = {
      ...session,
      code,
      analysis,
      comments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeneuron-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session, code, analysis, comments, id]);

  const handleCodeChange = useCallback(
    (next: string) => {
      setCode(next);
      // Debounce persisting code back to the session.
      clearTimeout((handleCodeChange as any)._t);
      (handleCodeChange as any)._t = setTimeout(() => {
        fetch(`/api/sessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: next }),
        }).catch(() => {});
      }, 800);
    },
    [id]
  );

  const handleAddComment = useCallback(
    async (line: number, body: string) => {
      await addComment(line, body);
      setTab("comments");
    },
    [addComment]
  );

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <p className="text-sm text-neutral-400">
            This review session doesn&apos;t exist or has expired.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white"
          >
            Create a new session
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-2.5">
        <a href="/" className="text-sm font-bold tracking-tight">
          CodeNeuron
        </a>
        <span className="h-4 w-px bg-neutral-800" />
        <h1 className="truncate text-sm text-neutral-300">
          {session?.title || "Loading…"}
        </h1>
        <div className="flex-1" />
        <PresenceBar users={users} myUserId={user.userId} />
        {editingName ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              chooseName(nameDraft);
              setEditingName(false);
            }}
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => setEditingName(false)}
              className="w-32 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs outline-none"
              placeholder={user.name}
            />
          </form>
        ) : (
          <button
            onClick={() => {
              setNameDraft(user.name);
              setEditingName(true);
            }}
            className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            title="Set your display name"
          >
            {user.name}
          </button>
        )}
        <button
          onClick={() => setShareOpen(true)}
          className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          Share / Export
        </button>
      </header>

      {/* Body: editor + side panel */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            users={users}
            commentCounts={commentCounts}
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            onCursorChange={broadcastCursor}
          />
        </div>

        <aside className="flex w-[380px] shrink-0 flex-col border-l border-neutral-800">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setTab("ai")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                tab === "ai"
                  ? "text-orange-400 border-b-2 border-orange-500"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              AI Analysis
            </button>
            <button
              onClick={() => setTab("comments")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                tab === "comments"
                  ? "text-orange-400 border-b-2 border-orange-500"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Comments
              {comments.length > 0 && (
                <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px]">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex flex-1 min-h-0">
            {tab === "ai" ? (
              <AIPanel
                analysis={analysis}
                analyzing={analyzing}
                onAnalyze={handleAnalyze}
                onVote={onVote}
                scoreOf={scoreOf}
              />
            ) : (
              <CommentsPanel
                comments={comments}
                selectedLine={selectedLine}
                onAddComment={handleAddComment}
              />
            )}
          </div>
        </aside>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        onExport={handleExport}
      />
    </div>
  );
}
