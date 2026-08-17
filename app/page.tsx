"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/languages";
import { SAMPLE_CODE } from "@/lib/sample";

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    f.text().then((t) => {
      setCode(t);
      // best-effort language inference from extension
      const ext = f.name.split(".").pop()?.toLowerCase();
      const byExt: Record<string, string> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        py: "python",
        go: "go",
        rs: "rust",
        java: "java",
        c: "c",
        cpp: "cpp",
        cs: "csharp",
        rb: "ruby",
        php: "php",
        sh: "bash",
        json: "json",
        yml: "yaml",
        yaml: "yaml",
        html: "html",
        css: "css",
        sql: "sql",
      };
      if (ext && byExt[ext]) setLanguage(byExt[ext]);
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, language, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create session");
        return;
      }
      router.push(`/review/${data.id}`);
    } catch {
      setError("Failed to create session. Is the dev server running?");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 mb-4">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-neutral-400">Real-time collaborative review</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            CodeNeuron
          </h1>
          <p className="mt-2 text-neutral-400">
            Paste code, get AI insights, and review together in real time.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session title (optional)"
              className="col-span-2 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-orange-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="Paste your code here…"
            className="h-72 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm outline-none focus:border-orange-500"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 transition-colors"
            >
              Upload file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.c,.cpp,.cs,.rb,.php,.sh,.json,.yaml,.yml,.html,.css,.sql,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => setCode(SAMPLE_CODE)}
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Reset sample
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreate}
              disabled={creating || !code.trim()}
              className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Creating…" : "Create Review Session"}
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600">
          Share the review link to collaborate. AI analysis uses Claude when an API
          key is configured, otherwise runs a built-in heuristic analyzer.
        </p>
      </div>
    </main>
  );
}
