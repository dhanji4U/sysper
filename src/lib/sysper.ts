export interface FoundItem {
  path: string;
  name: string;
  size: number;
  item_type: string;
}

export interface SkippedItem {
  path: string;
  reason: string;
}

export interface TrashResult {
  trashed: string[];
  skipped: SkippedItem[];
}

export interface HistoryEntry {
  date: string;
  root: string;
  size: number;
  count: number;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const v = bytes / Math.pow(1024, i);
  return `${v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2)} ${units[i]}`;
}

const HISTORY_KEY = "sysper:history";
const TOTAL_KEY = "sysper:totalFreed";
const WHITELIST_KEY = "sysper:whitelist";
const DRAFT_KEY = "sysper:historyDraft";

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory()].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  const total = loadTotalFreed() + entry.size;
  localStorage.setItem(TOTAL_KEY, String(total));
  return next;
}

export function loadDraft(): HistoryEntry | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as HistoryEntry;
    if (!draft || !draft.count) return null;
    return draft;
  } catch {
    return null;
  }
}

/** Record one successfully trashed item immediately (survives closing mid-clean). */
export function addToDraft(root: string, size: number): HistoryEntry {
  let draft: HistoryEntry | null = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    draft = null;
  }
  if (!draft || !draft.date) {
    draft = { date: new Date().toISOString(), root, size: 0, count: 0 };
  }
  draft.size += size > 0 ? size : 0;
  draft.count += 1;
  if (!draft.root) draft.root = root;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

/** Fold an interrupted or finished draft into the last-10 history list. */
export function commitDraft(): HistoryEntry | null {
  const draft = loadDraft();
  localStorage.removeItem(DRAFT_KEY);
  if (!draft || draft.count <= 0) return null;
  pushHistory(draft);
  return draft;
}

export function discardDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function loadTotalFreed(): number {
  return Number(localStorage.getItem(TOTAL_KEY) ?? 0) || 0;
}

export function loadWhitelist(): string[] {
  const raw = localStorage.getItem(WHITELIST_KEY) ?? "";
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function saveWhitelist(raw: string) {
  localStorage.setItem(WHITELIST_KEY, raw);
}

export function loadWhitelistRaw(): string {
  return localStorage.getItem(WHITELIST_KEY) ?? "";
}

export function isWhitelisted(path: string, list: string[]): boolean {
  const norm = path.replace(/\\/g, "/");
  return list.some((token) => {
    if (!token) return false;
    const t = token.replace(/\\/g, "/");
    const idx = norm.indexOf(t);
    if (idx === -1) return false;
    // Require the match to sit on path-segment boundaries (/ or string edge)
    const before = idx === 0 || norm[idx - 1] === "/";
    const after =
      idx + t.length === norm.length || norm[idx + t.length] === "/";
    return before && after;
  });
}
