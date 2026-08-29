"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "swarm-command-history";
const MAX_HISTORY = 100;

export interface HistoryEntry {
 id: string;
 command: string;
 timestamp: number;
 count: number;
}

export function useCommandHistory() {
 const [history, setHistory] = useState<HistoryEntry[]>(() => {
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
 });

 const save = (entries: HistoryEntry[]) => {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
 };

 const push = (command: string) => {
 if (!command.trim()) return;
 setHistory((prev) => {
 const existing = prev.find((e) => e.command === command.trim());
 const next = existing
 ? [{ ...existing, timestamp: Date.now(), count: existing.count + 1 }, ...prev.filter((e) => e.id !== existing.id)]
 : [{ id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, command: command.trim(), timestamp: Date.now(), count: 1 }, ...prev];
 save(next);
 return next;
 });
 };

 const clear = () => {
 setHistory([]);
 localStorage.removeItem(STORAGE_KEY);
 };

 const recent = history.slice(0, 20);

 return { history, recent, push, clear };
}
