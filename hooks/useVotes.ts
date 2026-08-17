"use client";

import { useCallback, useEffect, useState } from "react";
import { VoteMap } from "@/lib/types";

const keyFor = (sessionId: string) => `codeneuron.votes.${sessionId}`;

export function useVotes(sessionId: string) {
  const [votes, setVotes] = useState<VoteMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(sessionId));
      if (raw) setVotes(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const persist = useCallback((v: VoteMap) => {
    try {
      localStorage.setItem(keyFor(sessionId), JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  /** Toggle an up/down vote (pass 1 or -1). Voting the same direction again removes it. */
  const onVote = useCallback(
    (findingId: string, dir: 1 | -1) => {
      setVotes((prev) => {
        const cur = prev[findingId] || 0;
        const next = cur === dir ? 0 : dir;
        const updated = { ...prev, [findingId]: next };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const scoreOf = useCallback((findingId: string) => votes[findingId] || 0, [votes]);

  return { votes, onVote, scoreOf };
}
