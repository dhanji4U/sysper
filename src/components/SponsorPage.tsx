import { open } from "@tauri-apps/plugin-shell";

const GOAL = 184;
const RAISED = 112;

const LINKS = {
  5: "https://emiote.lemonsqueezy.com/checkout/buy/sysper-sponsor-5",
  10: "https://emiote.lemonsqueezy.com/checkout/buy/sysper-sponsor-10",
  25: "https://emiote.lemonsqueezy.com/checkout/buy/sysper-sponsor-25",
} as const;

export default function SponsorPage() {
  const pct = Math.round((RAISED / GOAL) * 100);
  return (
    <div className="rounded-2xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
      <p className="text-4xl">Support</p>
      <h2 className="mt-2 text-2xl font-bold">Help get Verified Publisher</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
        Code-signing certs cost ${GOAL}/year (Windows + Apple). Sponsors get Envault
        FREE + their name on emiote.com/sysper#sponsors. 100% offline tool — no ads, no tracking.
      </p>
      <div className="mx-auto mt-5 max-w-md">
        <div className="flex justify-between text-sm font-semibold">
          <span>${RAISED} raised</span>
          <span>${GOAL} goal</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% of $${GOAL} funding goal reached`}
            className="h-full rounded-full bg-black dark:bg-white"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">{pct}% funded</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {([5, 10, 25] as const).map((amount) => (
          <button
            key={amount}
            onClick={() => open(LINKS[amount])}
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Sponsor ${amount}
          </button>
        ))}
      </div>
    </div>
  );
}
