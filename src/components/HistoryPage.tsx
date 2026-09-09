import { formatBytes, loadDraft, loadHistory } from "../lib/sysper";

export default function HistoryPage() {
  const history = loadHistory();
  const draft = loadDraft();

  if (history.length === 0 && !draft) {
    return (
      <div className="rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
        <p className="font-medium">No cleans yet.</p>
        <p className="mt-1 text-sm text-neutral-500">
          Your last 10 cleans appear here after items actually move to Trash.
          Closing mid-clean still keeps whatever already made it to Trash.
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
      {draft && (
        <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs" title={draft.root}>{draft.root}</p>
            <p className="text-neutral-500">
              In progress · {new Date(draft.date).toLocaleString()} · {draft.count} items
            </p>
          </div>
          <span className="shrink-0 font-semibold">{formatBytes(draft.size)}</span>
        </li>
      )}
      {history.map((h, i) => (
        <li key={`${h.date}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs" title={h.root}>{h.root}</p>
            <p className="text-neutral-500">{new Date(h.date).toLocaleString()} · {h.count} items</p>
          </div>
          <span className="shrink-0 font-semibold">{formatBytes(h.size)}</span>
        </li>
      ))}
    </ul>
  );
}
