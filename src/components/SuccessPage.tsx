import { useMemo } from "react";
import { formatBytes, type SkippedItem } from "../lib/sysper";

interface Props {
  freed: number;
  totalFreed: number;
  count: number;
  skipped: SkippedItem[];
  onScanAgain: () => void;
  onViewHistory: () => void;
}

const CONFETTI_COLORS = [
  "#000000",
  "#22c55e",
  "#eab308",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
];

export default function SuccessPage({
  freed,
  totalFreed,
  count,
  skipped,
  onScanAgain,
  onViewHistory,
}: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: (i * 97) % 100,
        delay: ((i * 37) % 30) / 10,
        duration: 2.4 + ((i * 53) % 20) / 10,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + ((i * 29) % 8),
      })),
    []
  );

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I just freed ${formatBytes(freed)} of dev junk with Emiote Sysper — free, offline, moves to Trash.`
  )}`;
  const reddit = `https://www.reddit.com/submit?${new URLSearchParams({
    title: `I built a free tool that freed ${formatBytes(freed)} — Emiote Sysper`,
    text: "Free offline dev-junk cleaner (Tauri + Rust). Moves to Trash, never deletes permanently.",
  }).toString()}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            className="sysper-confetti-piece"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <p className="text-5xl">Done</p>
      <h2 className="mt-3 text-3xl font-bold">Freed {formatBytes(freed)}!</h2>
      <p className="mt-2 text-neutral-500">
        {count} items moved to Trash (restorable). Total freed:{" "}
        {formatBytes(totalFreed)}
      </p>

      {skipped.length > 0 && (
        <div className="relative z-10 mx-auto mt-5 max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">
            Skipped {skipped.length} item{skipped.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
            Locked, missing, or refused paths were skipped so the rest could
            still go to Trash.
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
            {skipped.map((s) => (
              <li
                key={s.path}
                className="truncate"
                title={`${s.path} — ${s.reason}`}
              >
                {s.path} — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={tweet}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Share on X
        </a>
        <a
          href={reddit}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Share on Reddit
        </a>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onScanAgain}
          className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Scan Again
        </button>
        <button
          onClick={onViewHistory}
          className="rounded-xl border border-neutral-300 px-6 py-3 font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          View History
        </button>
      </div>
    </div>
  );
}
