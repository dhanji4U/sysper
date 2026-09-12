import { useMemo, useState } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { filterFoundItems, formatBytes, type FoundItem } from "../lib/sysper";

interface Props {
  items: FoundItem[];
  cleaning: boolean;
  onClean: (selectedPaths: string[], selectedSize: number) => void;
}

const TYPE_HINT: Record<string, string> = {
  node_modules: "JS dependencies",
  dist: "Build output",
  build: "Build output",
  out: "Build output",
  ".next": "Next.js cache",
  ".nuxt": "Nuxt cache",
  ".output": "Nitro output",
  ".turbo": "Turborepo cache",
  ".parcel-cache": "Parcel cache",
  ".vite": "Vite cache",
  __pycache__: "Python bytecode",
  ".pytest_cache": "Pytest cache",
  target: "Rust build",
  ".gradle": "Gradle cache",
  logs: "Log folders",
  log: "Log files",
  coverage: "Coverage reports",
  ".DS_Store": "macOS junk",
  "Thumbs.db": "Windows thumbs",
};

export default function ResultsList({ items, cleaning, onClean }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((i) => i.path))
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const filteredItems = useMemo(
    () => filterFoundItems(items, query),
    [items, query]
  );

  const groups = useMemo(() => {
    const map = new Map<string, FoundItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.item_type) ?? [];
      list.push(item);
      map.set(item.item_type, list);
    }
    return [...map.entries()].sort((a, b) => {
      const sa = a[1].reduce((n, i) => n + i.size, 0);
      const sb = b[1].reduce((n, i) => n + i.size, 0);
      return sb - sa;
    });
  }, [filteredItems]);

  const allFilteredPaths = useMemo(
    () => filteredItems.map((i) => i.path),
    [filteredItems]
  );
  const allSelected =
    allFilteredPaths.length > 0 &&
    allFilteredPaths.every((p) => selected.has(p));

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleGroup(paths: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of paths) {
        if (checked) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  }

  function selectAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of allFilteredPaths) {
        if (checked) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  }

  function toggleOpen(type: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const selectedItems = items.filter((i) => selected.has(i.path));
  const selectedSize = selectedItems.reduce((n, i) => n + i.size, 0);
  const hasTarget = selectedItems.some((i) => i.item_type === "target");
  const totalSize = items.reduce((n, i) => n + i.size, 0);
  const filteredSize = filteredItems.reduce((n, i) => n + i.size, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
        <p className="text-lg font-medium">
          Sparkling clean — no dev junk found.
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Try scanning a different folder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 px-6 py-7 dark:border-neutral-800">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Quick wins
        </p>
        <p className="mt-1 font-mono text-5xl font-semibold tabular-nums tracking-tight text-pretty">
          {formatBytes(totalSize)}
        </p>
        <p className="mt-2 text-neutral-500">
          in {items.length} folders/files · {groups.length} types
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => selectAll(e.target.checked)}
            className="h-4 w-4 accent-black dark:accent-white"
          />
          Select all
        </label>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by folder name, project, or type..."
            aria-label="Filter found items"
            className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2.5 pl-10 text-sm outline-none transition-colors focus:border-black dark:border-neutral-700 dark:focus:border-white"
          />
          <svg
            className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-3 top-2.5 rounded px-1.5 py-0.5 text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        {query.trim() && (
          <p className="text-xs text-neutral-500">
            Showing {filteredItems.length} of {items.length} items (
            {formatBytes(filteredSize)})
          </p>
        )}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="font-medium">No items match "{query}"</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:hover:text-white"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map(([type, list]) => {
          const paths = list.map((i) => i.path);
          const groupChecked = paths.every((p) => selected.has(p));
          const groupSize = list.reduce((n, i) => n + i.size, 0);
          const share =
            totalSize > 0 ? Math.round((groupSize / totalSize) * 100) : 0;
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleGroup(paths, !groupChecked)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                groupChecked
                  ? "border-black bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{type}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {TYPE_HINT[type] ?? "Dev junk"} · {list.length}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-lg font-semibold tabular-nums">
                  {formatBytes(groupSize)}
                </p>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-full bg-black dark:bg-white"
                  style={{
                    width: `${Math.max(share, groupSize > 0 ? 2 : 0)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                {share}% of junk
              </p>
            </button>
          );
        })}
      </div>

      {groups.map(([type, list]) => {
        const paths = list.map((i) => i.path);
        const groupChecked = paths.every((p) => selected.has(p));
        const groupSize = list.reduce((n, i) => n + i.size, 0);
        const isOpen = open.has(type);
        return (
          <div
            key={`list-${type}`}
            className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between bg-neutral-100 px-4 py-2 dark:bg-neutral-900">
              <label className="flex min-w-0 cursor-pointer items-center gap-2 font-mono text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={groupChecked}
                  onChange={(e) => toggleGroup(paths, e.target.checked)}
                  className="h-4 w-4 accent-black dark:accent-white"
                />
                {type}
                <span className="text-neutral-500">· {list.length}</span>
              </label>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {formatBytes(groupSize)}
                </span>
                <button
                  type="button"
                  onClick={() => toggleOpen(type)}
                  aria-expanded={isOpen}
                  className="text-xs font-medium underline"
                >
                  {isOpen ? "Hide paths" : "Show paths"}
                </button>
              </div>
            </div>
            {isOpen && (
              <ul className="max-h-56 divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-900">
                {list.map((item) => (
                  <li
                    key={item.path}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.path)}
                      onChange={() => toggle(item.path)}
                      className="h-4 w-4 shrink-0 accent-black dark:accent-white"
                    />
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-xs"
                      title={item.path}
                    >
                      {item.path}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await revealItemInDir(item.path);
                        } catch {
                          // Silently handle if environment lacks opener support
                        }
                      }}
                      title="Show in file manager"
                      aria-label={`Show ${item.path} in file manager`}
                      className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatBytes(item.size)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {hasTarget && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Selection includes Rust <code>target/</code> folders. Rebuilds can
          take a long time — only continue if you really want them in Trash.
        </div>
      )}

      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white/95 p-4 dark:border-neutral-800 dark:bg-black/95">
        <div>
          <p className="text-xs text-neutral-500">Selected</p>
          <p className="font-mono text-xl font-semibold tabular-nums">
            {formatBytes(selectedSize)}
            <span className="ml-2 text-sm font-medium text-neutral-500">
              · {selectedItems.length} items
            </span>
          </p>
        </div>
        <button
          disabled={selectedItems.length === 0 || cleaning}
          onClick={() =>
            onClean(
              selectedItems.map((i) => i.path),
              selectedSize
            )
          }
          className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {cleaning ? "Moving to Trash…" : "Clean to Trash"}
        </button>
      </div>
    </div>
  );
}
