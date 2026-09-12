import type { Page } from "@playwright/test";

export interface MockItem {
  name: string;
  path: string;
  size: number;
  item_type: string;
}

export const SAMPLE_SCAN_ITEMS: MockItem[] = [
  {
    name: "node_modules",
    path: "/mock/workspace/project-alpha/node_modules",
    size: 1024 * 1024 * 450,
    item_type: "node_modules",
  },
  {
    name: "dist",
    path: "/mock/workspace/project-alpha/dist",
    size: 1024 * 1024 * 35,
    item_type: "dist",
  },
  {
    name: "target",
    path: "/mock/workspace/backend-rust/target",
    size: 1024 * 1024 * 1200,
    item_type: "target",
  },
  {
    name: ".next",
    path: "/mock/workspace/web-next/.next",
    size: 1024 * 1024 * 180,
    item_type: ".next",
  },
  {
    name: "app.log",
    path: "/mock/workspace/logs/app.log",
    size: 1024 * 1024 * 12,
    item_type: "logs",
  },
];

export async function installTauriMock(page: Page, items = SAMPLE_SCAN_ITEMS) {
  await page.addInitScript((mockItems) => {
    (
      window as unknown as { __MOCK_SCAN_ITEMS__: typeof mockItems }
    ).__MOCK_SCAN_ITEMS__ = mockItems;

    const callbacks = new Map<number, (data: unknown) => unknown>();
    let nextCallbackId = 1;

    (
      window as unknown as { __TAURI_INTERNALS__: Record<string, unknown> }
    ).__TAURI_INTERNALS__ = {
      transformCallback: (
        callback: (data: unknown) => unknown,
        once = false
      ) => {
        const id = nextCallbackId++;
        callbacks.set(id, (data: unknown) => {
          if (once) callbacks.delete(id);
          return callback && callback(data);
        });
        return id;
      },
      unregisterCallback: (id: number) => {
        callbacks.delete(id);
      },
      runCallback: (id: number, data: unknown) => {
        const cb = callbacks.get(id);
        if (cb) cb(data);
      },
      invoke: async (cmd: string, args: { paths?: string[] } | undefined) => {
        if (cmd === "plugin:dialog|open") {
          return "/mock/workspace";
        }
        if (cmd === "scan_folder") {
          return (
            window as unknown as { __MOCK_SCAN_ITEMS__: typeof mockItems }
          ).__MOCK_SCAN_ITEMS__;
        }
        if (cmd === "move_to_trash") {
          return {
            trashed: args?.paths || [],
            skipped: [],
          };
        }
        if (cmd === "plugin:opener|reveal_item_in_dir") {
          return null;
        }
        if (cmd === "plugin:event|listen") {
          return 1;
        }
        return null;
      },
    };

    (
      window as unknown as {
        __TAURI_EVENT_PLUGIN_INTERNALS__: Record<string, unknown>;
      }
    ).__TAURI_EVENT_PLUGIN_INTERNALS__ = {
      unregisterListener: () => {},
    };
  }, items);
}
