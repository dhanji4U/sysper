import { describe, it, expect, beforeEach } from "vitest";
import {
  formatBytes,
  isWhitelisted,
  filterFoundItems,
  loadHistory,
  pushHistory,
  addToDraft,
  commitDraft,
  discardDraft,
  loadDraft,
  loadTotalFreed,
  loadWhitelist,
  saveWhitelist,
  loadWhitelistRaw,
  type FoundItem,
} from "./sysper";

// ---------- formatBytes ----------

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("returns '0 B' for negative values", () => {
    expect(formatBytes(-100)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(10 * 1024 * 1024)).toBe("10.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(47.3 * 1024 * 1024 * 1024)).toBe("47.3 GB");
  });

  it("formats large gigabytes without decimals", () => {
    expect(formatBytes(127 * 1024 * 1024 * 1024)).toBe("127 GB");
  });
});

// ---------- isWhitelisted (path-segment matching) ----------

describe("isWhitelisted", () => {
  it("matches exact segment", () => {
    expect(isWhitelisted("/code/app/node_modules", ["app"])).toBe(true);
  });

  it("does not match partial segment", () => {
    expect(isWhitelisted("/code/my-app/node_modules", ["app"])).toBe(false);
  });

  it("matches multi-segment token", () => {
    expect(isWhitelisted("/code/my-project/dist", ["my-project"])).toBe(true);
  });

  it("matches at the start of the path", () => {
    expect(isWhitelisted("app/node_modules", ["app"])).toBe(true);
  });

  it("matches at the end of the path", () => {
    expect(isWhitelisted("/code/app", ["app"])).toBe(true);
  });

  it("handles backslash paths (Windows)", () => {
    expect(isWhitelisted("C:\\code\\app\\node_modules", ["app"])).toBe(true);
  });

  it("rejects partial match on Windows paths", () => {
    expect(isWhitelisted("C:\\code\\my-app\\node_modules", ["app"])).toBe(
      false
    );
  });

  it("returns false for empty list", () => {
    expect(isWhitelisted("/code/app/dist", [])).toBe(false);
  });

  it("skips empty tokens", () => {
    expect(isWhitelisted("/code/app/dist", ["", "  "])).toBe(false);
  });
});

// ---------- localStorage: history & draft lifecycle ----------

describe("history and draft lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with empty history", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("pushHistory adds an entry and updates totalFreed", () => {
    pushHistory({ date: "2025-01-01", root: "/code", size: 1000, count: 5 });
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].size).toBe(1000);
    expect(loadTotalFreed()).toBe(1000);
  });

  it("pushHistory caps at 10 entries", () => {
    for (let i = 0; i < 12; i++) {
      pushHistory({
        date: `2025-01-${i + 1}`,
        root: "/code",
        size: 100,
        count: 1,
      });
    }
    expect(loadHistory()).toHaveLength(10);
  });

  it("draft lifecycle: add, load, commit", () => {
    addToDraft("/code", 500);
    addToDraft("/code", 300);
    const draft = loadDraft();
    expect(draft).not.toBeNull();
    expect(draft!.count).toBe(2);
    expect(draft!.size).toBe(800);

    const committed = commitDraft();
    expect(committed).not.toBeNull();
    expect(committed!.size).toBe(800);
    expect(loadDraft()).toBeNull();
    expect(loadHistory()).toHaveLength(1);
    expect(loadTotalFreed()).toBe(800);
  });

  it("discardDraft clears the draft", () => {
    addToDraft("/code", 100);
    discardDraft();
    expect(loadDraft()).toBeNull();
  });

  it("commitDraft returns null when no draft exists", () => {
    expect(commitDraft()).toBeNull();
  });
});

// ---------- whitelist storage ----------

describe("whitelist storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads empty whitelist by default", () => {
    expect(loadWhitelist()).toEqual([]);
  });

  it("saves and loads whitelist tokens", () => {
    saveWhitelist("vendor\nmy-project,legacy");
    const list = loadWhitelist();
    expect(list).toEqual(["vendor", "my-project", "legacy"]);
  });

  it("loadWhitelistRaw returns raw string", () => {
    saveWhitelist("foo\nbar");
    expect(loadWhitelistRaw()).toBe("foo\nbar");
  });
});

// ---------- filterFoundItems ----------

describe("filterFoundItems", () => {
  const sampleItems: FoundItem[] = [
    {
      name: "node_modules",
      path: "/users/dev/project-alpha/node_modules",
      item_type: "node_modules",
      size: 500,
    },
    {
      name: "dist",
      path: "/users/dev/project-alpha/dist",
      item_type: "dist",
      size: 100,
    },
    {
      name: "target",
      path: "/users/dev/project-beta/target",
      item_type: "target",
      size: 2000,
    },
    {
      name: ".next",
      path: "C:\\code\\gamma\\.next",
      item_type: ".next",
      size: 800,
    },
    {
      name: "app.log",
      path: "/users/dev/service/logs/app.log",
      item_type: "logs",
      size: 50,
    },
  ];

  it("returns all items when query is empty or whitespace", () => {
    expect(filterFoundItems(sampleItems, "")).toHaveLength(5);
    expect(filterFoundItems(sampleItems, "   ")).toHaveLength(5);
  });

  it("filters by name substring case-insensitively", () => {
    const results = filterFoundItems(sampleItems, "APP.LOG");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("app.log");
  });

  it("filters by path substring case-insensitively", () => {
    const results = filterFoundItems(sampleItems, "alpha");
    expect(results).toHaveLength(2);
    expect(results.map((i) => i.path)).toEqual([
      "/users/dev/project-alpha/node_modules",
      "/users/dev/project-alpha/dist",
    ]);
  });

  it("filters by Windows path substring", () => {
    const results = filterFoundItems(sampleItems, "gamma");
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("C:\\code\\gamma\\.next");
  });

  it("filters by item_type substring case-insensitively", () => {
    const results = filterFoundItems(sampleItems, "TARGET");
    expect(results).toHaveLength(1);
    expect(results[0].item_type).toBe("target");
  });

  it("returns empty array when no match is found", () => {
    expect(
      filterFoundItems(sampleItems, "nonexistent-query-string")
    ).toHaveLength(0);
  });
});
