"use client";

import { useMemo, useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Cursor, PresenceUser } from "@/lib/types";
import { prismFor } from "@/lib/languages";

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  users: Record<string, PresenceUser>;
  commentCounts: Record<number, number>;
  selectedLine: number | null;
  onSelectLine: (line: number) => void;
  onCursorChange: (cursor: Cursor) => void;
}

const FONT_SIZE = 13;
const LINE_HEIGHT = 22;
const PAD = 12;
const CHAR_W = FONT_SIZE * 0.6;

function lineFromPos(code: string, pos: number): { line: number; col: number } {
  const upTo = code.slice(0, pos);
  const parts = upTo.split("\n");
  return { line: parts.length, col: parts[parts.length - 1].length + 1 };
}

/** A single remote cursor marker positioned over the editor. */
function RemoteCursor({ user }: { user: PresenceUser }) {
  if (!user.cursor) return null;
  const top = PAD + (user.cursor.line - 1) * LINE_HEIGHT;
  const left = PAD + (user.cursor.col - 1) * CHAR_W;
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ top, left }}
      title={`${user.name} — line ${user.cursor.line}`}
    >
      <div className="w-[2px] h-[18px]" style={{ background: user.color }} />
      <span
        className="text-[10px] leading-none font-medium px-1 py-0.5 rounded-sm whitespace-nowrap"
        style={{ background: user.color, color: "#000" }}
      >
        {user.name}
      </span>
    </div>
  );
}

export default function CodeEditor({
  code,
  language,
  onChange,
  users,
  commentCounts,
  selectedLine,
  onSelectLine,
  onCursorChange,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const remoteUsers = useMemo(
    () => Object.values(users).filter((u) => u.userId && u.cursor),
    [users]
  );

  const syncCursorFromSelection = (pos: number) => {
    onCursorChange(lineFromPos(code, pos));
  };

  return (
    <div className="flex h-full min-h-0 font-mono text-[13px]">
      {/* Gutter with line numbers + comment badges */}
      <div
        className="w-14 shrink-0 select-none overflow-hidden border-r border-neutral-800 bg-neutral-950 text-right pr-3 text-neutral-600"
        style={{ paddingTop: PAD }}
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const line = i + 1;
          const n = commentCounts[line] || 0;
          const active = selectedLine === line;
          return (
            <div
              key={i}
              className={`relative leading-none h-[22px] ${
                active ? "text-orange-400" : ""
              }`}
              style={{ lineHeight: `${LINE_HEIGHT}px` }}
            >
              <span className="mr-1">{line}</span>
              {n > 0 && (
                <button
                  onClick={() => onSelectLine(line)}
                  title={`${n} comment${n > 1 ? "s" : ""} on line ${line}`}
                  className="absolute left-1 top-1/2 -translate-y-1/2 inline-flex h-4 min-w-4 items-center justify-center rounded bg-orange-600/20 px-1 text-[10px] leading-none text-orange-400 hover:bg-orange-600/40"
                >
                  {n}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Code surface: highlighted pre behind a transparent textarea + cursors */}
      <div className="relative flex-1 overflow-auto bg-neutral-950">
        <Highlight
          code={code}
          language={prismFor(language)}
          theme={themes.vsDark}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              aria-hidden
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-3"
              style={{ ...style, fontSize: FONT_SIZE, lineHeight: `${LINE_HEIGHT}px` }}
            >
              {tokens.map((line, i) => {
                const props = getLineProps({ line });
                const isSelected = selectedLine === i + 1;
                return (
                  <div
                    key={i}
                    {...props}
                    className={isSelected ? "bg-white/5" : props.className}
                  >
                    {line.map((token, j) => (
                      <span key={j} {...getTokenProps({ token })} />
                    ))}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onMouseUp={(e) => syncCursorFromSelection((e.target as HTMLTextAreaElement).selectionStart)}
          onKeyUp={(e) => syncCursorFromSelection((e.target as HTMLTextAreaElement).selectionStart)}
          onClick={(e) => syncCursorFromSelection((e.target as HTMLTextAreaElement).selectionStart)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-3 text-transparent caret-neutral-100 outline-none whitespace-pre"
          style={{ fontSize: FONT_SIZE, lineHeight: `${LINE_HEIGHT}px` }}
        />

        {remoteUsers.map((u) => (
          <RemoteCursor key={u.userId} user={u} />
        ))}
      </div>
    </div>
  );
}
