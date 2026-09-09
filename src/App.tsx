import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ScanButton from "./components/ScanButton";
import ResultsList from "./components/ResultsList";
import SuccessPage from "./components/SuccessPage";
import HistoryPage from "./components/HistoryPage";
import SponsorPage from "./components/SponsorPage";
import SettingsPage from "./components/SettingsPage";
import {
  addToDraft,
  commitDraft,
  discardDraft,
  formatBytes,
  isWhitelisted,
  loadTotalFreed,
  loadWhitelist,
  pushHistory,
  type FoundItem,
  type SkippedItem,
  type TrashResult,
} from "./lib/sysper";

type Phase = "idle" | "scanning" | "results" | "cleaning" | "success";
type Tab = "cleaner" | "history" | "sponsor" | "settings";

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [tab, setTab] = useState<Tab>("cleaner");
  const [root, setRoot] = useState("");
  const [items, setItems] = useState<FoundItem[]>([]);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  // Confirm modal state
  const [pending, setPending] = useState<{
    paths: string[];
    size: number;
  } | null>(null);
  const [lastFreed, setLastFreed] = useState(0);
  const [lastCount, setLastCount] = useState(0);
  const [lastSkipped, setLastSkipped] = useState<SkippedItem[]>([]);
  const [skipAll, setSkipAll] = useState(true);
  const [totalFreed, setTotalFreed] = useState(0);
  const [historyTick, setHistoryTick] = useState(0);
  const [cleanProgress, setCleanProgress] = useState({
    trashed: 0,
    skipped: 0,
    total: 0,
  });
  const [scanProgress, setScanProgress] = useState({
    projects: 0,
    found: 0,
    current: "",
    stage: "walk",
  });
  const sizeByPathRef = useRef<Map<string, number>>(new Map());
  const rootRef = useRef("");
  const phaseRef = useRef(phase);
  sizeByPathRef.current = new Map(items.map((i) => [i.path, i.size]));
  rootRef.current = root;
  phaseRef.current = phase;

  useEffect(() => {
    const saved = localStorage.getItem("sysper:theme");
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = saved ? saved === "dark" : !!prefersDark;
    setDark(isDark);
    if (commitDraft()) setHistoryTick((n) => n + 1);
    setTotalFreed(loadTotalFreed());
  }, []);

  useEffect(() => {
    const offs: Array<() => void> = [];
    listen<{ path: string; status: string }>("trash-progress", (event) => {
      if (phaseRef.current !== "cleaning") return;
      if (event.payload.status === "trashed") {
        const size = sizeByPathRef.current.get(event.payload.path) ?? 0;
        addToDraft(rootRef.current, size);
        setCleanProgress((p) => ({ ...p, trashed: p.trashed + 1 }));
        setHistoryTick((n) => n + 1);
      } else {
        setCleanProgress((p) => ({ ...p, skipped: p.skipped + 1 }));
      }
    }).then((fn) => offs.push(fn));
    listen<{ projects: number; found: number; current: string; stage: string }>(
      "scan-progress",
      (event) => {
        if (phaseRef.current !== "scanning") return;
        setScanProgress(event.payload);
      }
    ).then((fn) => offs.push(fn));
    return () => {
      offs.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sysper:theme", dark ? "dark" : "light");
  }, [dark]);

  function reset() {
    setPhase("idle");
    setItems([]);
    setRoot("");
    setError("");
    setPending(null);
    setLastSkipped([]);
  }

  async function confirmClean() {
    if (!pending) return;
    const whitelist = loadWhitelist();
    const filtered = pending.paths.filter((p) => !isWhitelisted(p, whitelist));
    if (filtered.length === 0) {
      setError("All selected items are whitelisted — nothing to clean.");
      setPending(null);
      return;
    }
    phaseRef.current = "cleaning";
    setPhase("cleaning");
    setPending(null);
    setCleanProgress({ trashed: 0, skipped: 0, total: filtered.length });
    discardDraft();
    try {
      const result = await invoke<TrashResult>("move_to_trash", {
        paths: filtered,
        skipAll,
      });
      const byPath = new Map(items.map((i) => [i.path, i.size]));
      const freed = result.trashed.reduce(
        (n, p) => n + (byPath.get(p) ?? 0),
        0
      );
      setLastFreed(freed);
      setLastCount(result.trashed.length);
      setLastSkipped(result.skipped);

      if (result.trashed.length === 0) {
        discardDraft();
        const summary = result.skipped
          .map((s) => `${s.path} — ${s.reason}`)
          .join("\n");
        setError(
          result.skipped.length
            ? `Nothing moved to Trash. Skipped ${result.skipped.length} item(s):\n${summary}`
            : "Nothing moved to Trash."
        );
        setPhase("results");
        return;
      }

      phaseRef.current = "success";
      discardDraft();
      pushHistory({
        date: new Date().toISOString(),
        root,
        size: freed,
        count: result.trashed.length,
      });
      setHistoryTick((n) => n + 1);
      setTotalFreed(loadTotalFreed());
      setPhase("success");
      setItems([]);
    } catch (e) {
      phaseRef.current = "results";
      commitDraft();
      setHistoryTick((n) => n + 1);
      setTotalFreed(loadTotalFreed());
      setError(String(e));
      setPhase("results");
    }
  }

  return (
    <div className="min-h-full bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">Emiote Sysper</h1>
            <p className="text-xs text-neutral-500">
              System Sweeper · 100% offline · Trash only
            </p>
          </div>
          <nav className="flex gap-1 text-sm">
            {(["cleaner", "history", "sponsor", "settings"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 font-medium capitalize ${
                    tab === t
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`}
                >
                  {t === "cleaner"
                    ? "Cleaner"
                    : t === "history"
                      ? "History"
                      : t === "sponsor"
                        ? "Sponsor"
                        : "Settings"}
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">Something went wrong</p>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">
              {error}
            </pre>
            <button onClick={() => setError("")} className="mt-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {tab === "history" && <HistoryPage key={historyTick} />}
        {tab === "sponsor" && <SponsorPage />}
        {tab === "settings" && (
          <SettingsPage dark={dark} onToggleTheme={() => setDark((d) => !d)} />
        )}

        {tab === "cleaner" && (
          <>
            {phase === "idle" && (
              <div className="rounded-2xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
                <p className="text-5xl">Clean</p>
                <h2 className="mt-3 text-2xl font-bold">
                  Find the dust eating your memory
                </h2>
                <p className="mx-auto mt-2 max-w-md text-neutral-500">
                  Free up to 50GB of dev junk in 10 seconds. One click moves
                  node_modules, dist, build & logs to Trash — safely, offline,
                  no signup.
                </p>
                <div className="mt-6">
                  <ScanButton
                    scanning={false}
                    onStart={(dir) => {
                      setError("");
                      setRoot(dir);
                      setScanProgress({
                        projects: 0,
                        found: 0,
                        current: dir,
                        stage: "walk",
                      });
                      phaseRef.current = "scanning";
                      setPhase("scanning");
                    }}
                    onDone={(_dir, found) => {
                      setItems(found);
                      setPhase("results");
                    }}
                    onError={(msg) => {
                      setError(msg);
                      setPhase("idle");
                    }}
                  />
                </div>
                <p className="mt-4 text-xs text-neutral-500">
                  ⭐️ 47GB avg freed · 100% offline · Moves to Trash · Open
                  Source
                </p>
              </div>
            )}

            {phase === "scanning" && (
              <div className="rounded-2xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
                <div className="sysper-spinner mx-auto h-10 w-10 rounded-full border-4 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
                <h2 className="mt-4 text-xl font-bold">
                  {scanProgress.stage === "size"
                    ? `Sizing ${scanProgress.found} folders…`
                    : scanProgress.projects > 0
                      ? `Scanning ${scanProgress.projects} projects…`
                      : "Scanning projects…"}
                </h2>
                <p className="mt-2 font-mono text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                  {scanProgress.found} junk items found
                </p>
                <p
                  className="mt-1 truncate font-mono text-xs text-neutral-500"
                  title={scanProgress.current || root}
                >
                  {scanProgress.current || root}
                </p>
              </div>
            )}

            {phase === "results" && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="min-w-0 truncate font-mono text-xs text-neutral-500"
                    title={root}
                  >
                    {root}
                  </p>
                  <button
                    onClick={reset}
                    className="shrink-0 text-sm font-medium underline"
                  >
                    Scan Again
                  </button>
                </div>
                <ResultsList
                  items={items}
                  cleaning={false}
                  onClean={(paths, size) => setPending({ paths, size })}
                />
              </>
            )}

            {phase === "cleaning" && (
              <div className="rounded-2xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
                <div className="sysper-spinner mx-auto h-10 w-10 rounded-full border-4 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
                <h2 className="mt-4 text-xl font-bold">Moving to Trash…</h2>
                <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    role="progressbar"
                    aria-valuenow={
                      cleanProgress.total
                        ? Math.round(
                            ((cleanProgress.trashed + cleanProgress.skipped) /
                              cleanProgress.total) *
                              100
                          )
                        : 0
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-full rounded-full bg-black transition-[width] duration-200 dark:bg-white"
                    style={{
                      width: `${
                        cleanProgress.total
                          ? Math.min(
                              100,
                              ((cleanProgress.trashed + cleanProgress.skipped) /
                                cleanProgress.total) *
                                100
                            )
                          : 8
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 font-mono text-sm tabular-nums text-neutral-500">
                  {cleanProgress.trashed + cleanProgress.skipped}/
                  {cleanProgress.total || "…"} · {cleanProgress.trashed} moved ·{" "}
                  {cleanProgress.skipped} skipped
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Restorable from OS Trash.
                </p>
              </div>
            )}

            {phase === "success" && (
              <SuccessPage
                freed={lastFreed}
                totalFreed={totalFreed}
                count={lastCount}
                skipped={lastSkipped}
                onScanAgain={reset}
                onViewHistory={() => setTab("history")}
              />
            )}
          </>
        )}
      </main>

      {/* Confirm modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-950">
            <h3 className="text-lg font-bold">Move to Trash?</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Move {pending.paths.length} folders/files (
              {formatBytes(pending.size)}) to Trash? You can restore from Trash.
              We never delete permanently.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipAll}
                onChange={(e) => setSkipAll(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-black dark:accent-white"
              />
              <span>
                Skip all failures
                <span className="mt-0.5 block text-xs text-neutral-500">
                  If a folder is locked, missing, or refused, skip it and keep
                  going. Uncheck to stop at the first trash error.
                </span>
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setPending(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmClean}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500 dark:border-neutral-800">
        Part of Emiote Tools · Privacy-first offline dev tools · Built with
        Tauri + Rust
      </footer>
    </div>
  );
}
