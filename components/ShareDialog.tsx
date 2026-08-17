"use client";

import { useState } from "react";

export default function ShareDialog({
  open,
  url,
  onClose,
  onExport,
}: {
  open: boolean;
  url: string;
  onClose: () => void;
  onExport: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Share review session</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          Share this link. Anyone with it can join and review in real time.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={copy}
            className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-500"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button
          onClick={onExport}
          className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Export review session (.json)
        </button>
      </div>
    </div>
  );
}
