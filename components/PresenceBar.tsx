"use client";

import { PresenceUser } from "@/lib/types";
import { initials } from "@/lib/utils";

export default function PresenceBar({
  users,
  myUserId,
}: {
  users: Record<string, PresenceUser>;
  myUserId: string;
}) {
  const list = Object.values(users);
  if (list.length === 0) {
    return (
      <span className="text-xs text-neutral-500">
        No other reviewers connected
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      {list.map((u) => {
        const me = u.userId === myUserId;
        return (
          <div
            key={u.userId}
            title={`${u.name}${me ? " (you)" : ""}${u.cursor ? ` — line ${u.cursor.line}` : ""}`}
            className="group relative"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-neutral-950"
              style={{ background: u.color, color: "#000", opacity: me ? 1 : 0.85 }}
            >
              {initials(u.name)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
