import { useEffect, useState } from "react";
import { loadWhitelistRaw, saveWhitelist } from "../lib/sysper";

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
}

export default function SettingsPage({ dark, onToggleTheme }: Props) {
  const [raw, setRaw] = useState("");

  useEffect(() => {
    setRaw(loadWhitelistRaw());
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="font-semibold">Appearance</h3>
        <button
          onClick={onToggleTheme}
          className="mt-3 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Switch to {dark ? "Light" : "Dark"} mode
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="font-semibold">Whitelist</h3>
        <p className="mt-1 text-sm text-neutral-500">
          One path fragment per line (or comma-separated). Matching items are
          never selected for Trash. Example:{" "}
          <code>my-important-project, company-monorepo</code>
        </p>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            saveWhitelist(e.target.value);
          }}
          rows={4}
          placeholder={"my-important-project\ncompany-monorepo"}
          className="mt-3 w-full rounded-lg border border-neutral-300 bg-transparent p-3 font-mono text-sm dark:border-neutral-700"
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm dark:border-neutral-800 dark:bg-neutral-950">
        🛡️ <strong>Safety:</strong> Sysper only moves items to your OS Trash —
        nothing is ever permanently deleted. You can always restore from Trash.
      </div>
    </div>
  );
}
