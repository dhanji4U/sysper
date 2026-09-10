import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { FoundItem } from "../lib/sysper";

interface Props {
  scanning: boolean;
  onStart: (root: string) => void;
  onDone: (root: string, items: FoundItem[]) => void;
  onError: (msg: string) => void;
}

export default function ScanButton({
  scanning,
  onStart,
  onDone,
  onError,
}: Props) {
  async function pickAndScan() {
    const dir = await open({ directory: true, multiple: false });
    if (!dir || typeof dir !== "string") return;
    onStart(dir);
    try {
      const items = await invoke<FoundItem[]>("scan_folder", { root: dir });
      onDone(dir, items);
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <button
      onClick={pickAndScan}
      disabled={scanning}
      className="rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
    >
      {scanning ? "Scanning…" : "Select Folder & Scan"}
    </button>
  );
}
