"use client";

import { useCallback, useEffect, useState } from "react";
import { colorFor, randomId } from "@/lib/utils";

export interface LocalUser {
  userId: string;
  name: string;
  color: string;
}

const STORAGE_KEY = "codeneuron.user";

const DEFAULT_USER: LocalUser = {
  userId: "",
  name: "Guest",
  color: "#f97316",
};

function load(): LocalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === "string" && parsed.userId) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function createUser(): LocalUser {
  const userId = randomId().slice(0, 8);
  return {
    userId,
    name: `Guest ${userId.slice(0, 4)}`,
    color: colorFor(userId),
  };
}

export function useUser() {
  const [user, setUser] = useState<LocalUser>(DEFAULT_USER);

  useEffect(() => {
    const stored = load();
    setUser(stored ?? createUser());
  }, []);

  // persist whenever identity changes
  useEffect(() => {
    if (!user.userId) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }, [user]);

  const chooseName = useCallback((name: string) => {
    setUser((u) => ({ ...u, name: name.trim() || u.name }));
  }, []);

  const getUser = useCallback(() => user, [user]);

  return { user, setUser, chooseName, getUser };
}
