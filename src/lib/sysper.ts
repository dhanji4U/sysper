export interface FoundItem {
  path: string;
  name: string;
  size: number;
  item_type: string;
  /** Project-root mtime as secs since UNIX epoch. Absent/null = unknown. */
  last_modified?: number | null;
}

/** Projects touched within this window are considered active (default preserve). */
export const ACTIVE_THRESHOLD_DAYS = 14;

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
const PRESERVE_ACTIVE_KEY = "sysper:preserveActive";

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

/** Filter found items by name, path, or item type substring (case-insensitive). */
export function filterFoundItems(
  items: FoundItem[],
  query: string
): FoundItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(trimmed) ||
      item.path.toLowerCase().includes(trimmed) ||
      item.item_type.toLowerCase().includes(trimmed)
  );
}

/** Human-readable relative age for a project-root mtime (secs since epoch). */
export function formatRelativeAge(
  lastModified: number | null | undefined,
  nowMs: number = Date.now()
): string {
  if (
    lastModified == null ||
    !Number.isFinite(lastModified) ||
    lastModified <= 0
  )
    return "age unknown";
  const diffMs = nowMs - lastModified * 1000;
  if (diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "active 1 day ago";
  if (days < 14) return `active ${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `untouched for ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `untouched for ${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  return `untouched for ${years} year${years === 1 ? "" : "s"}`;
}

/** True when the project was modified within `thresholdDays` (default 14). */
export function isActiveProject(
  lastModified: number | null | undefined,
  nowMs: number = Date.now(),
  thresholdDays: number = ACTIVE_THRESHOLD_DAYS
): boolean {
  if (
    lastModified == null ||
    !Number.isFinite(lastModified) ||
    lastModified <= 0
  )
    return false;
  const diffMs = nowMs - lastModified * 1000;
  if (diffMs < 0) return true;
  return diffMs < thresholdDays * 24 * 60 * 60 * 1000;
}

export function loadPreserveActive(): boolean {
  try {
    const raw = localStorage.getItem(PRESERVE_ACTIVE_KEY);
    if (raw == null) return true;
    return raw !== "0" && raw.toLowerCase() !== "false";
  } catch {
    return true;
  }
}

export function savePreserveActive(enabled: boolean) {
  try {
    localStorage.setItem(PRESERVE_ACTIVE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode); filter simply won't persist.
  }
}
