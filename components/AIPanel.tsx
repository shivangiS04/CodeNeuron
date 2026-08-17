"use client";

import { CodeAnalysis, FindingCategory, Severity } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import VoteButton from "./VoteButton";

const CATEGORY_LABEL: Record<FindingCategory, string> = {
  security: "Security",
  performance: "Performance",
  "best-practice": "Best Practice",
  refactoring: "Refactoring",
};

const CATEGORY_STYLE: Record<FindingCategory, string> = {
  security: "bg-red-500/15 text-red-400 border-red-500/40",
  performance: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  "best-practice": "bg-sky-500/15 text-sky-400 border-sky-500/40",
  refactoring: "bg-violet-500/15 text-violet-400 border-violet-500/40",
};

const SEVERITY_STYLE: Record<Severity, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-sky-400",
};

export default function AIPanel({
  analysis,
  analyzing,
  onAnalyze,
  onVote,
  scoreOf,
}: {
  analysis: CodeAnalysis | null;
  analyzing: boolean;
  onAnalyze: () => void;
  onVote: (findingId: string, dir: 1 | -1) => void;
  scoreOf: (findingId: string) => number;
}) {
  if (!analysis) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl">
          ✦
        </div>
        <p className="text-sm text-neutral-400 max-w-xs">
          Run the AI analyzer to get security, performance, and refactoring insights
          for this code.
        </p>
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
        >
          {analyzing ? "Analyzing…" : "Analyze with AI"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-neutral-300">Summary</span>
          <span className="text-[10px] text-neutral-500">
            {timeAgo(analysis.generatedAt)}
          </span>
        </div>
        <p className="text-sm text-neutral-300">{analysis.summary}</p>
      </div>

      <button
        onClick={onAnalyze}
        disabled={analyzing}
        className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
      >
        {analyzing ? "Re-analyzing…" : "Re-run analysis"}
      </button>

      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-sm font-semibold">Findings</h2>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
          {analysis.findings.length}
        </span>
      </div>

      {analysis.findings.length === 0 && (
        <p className="text-sm text-neutral-500">No findings. Looks clean!</p>
      )}

      {analysis.findings.map((f) => (
        <div
          key={f.id}
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLE[f.category]}`}
            >
              {CATEGORY_LABEL[f.category]}
            </span>
            <span className={`text-[10px] font-medium uppercase ${SEVERITY_STYLE[f.severity]}`}>
              {f.severity}
            </span>
          </div>
          <h3 className="text-sm font-medium">{f.title}</h3>
          <p className="text-xs text-neutral-400">{f.description}</p>
          {f.lines.length > 0 && (
            <p className="text-[10px] text-neutral-500">Lines: {f.lines.join(", ")}</p>
          )}
          <div className="rounded-md bg-neutral-950 border border-neutral-800 p-2 text-xs text-neutral-300">
            <span className="text-neutral-500">Suggestion: </span>
            {f.suggestion}
          </div>
          <div className="flex items-center gap-2">
            <VoteButton
              direction={1}
              active={scoreOf(f.id) === 1}
              onClick={() => onVote(f.id, 1)}
            />
            <span className="text-sm font-semibold tabular-nums">{scoreOf(f.id)}</span>
            <VoteButton
              direction={-1}
              active={scoreOf(f.id) === -1}
              onClick={() => onVote(f.id, -1)}
            />
            <span className="ml-auto text-[10px] text-neutral-500">Team vote</span>
          </div>
        </div>
      ))}
    </div>
  );
}
