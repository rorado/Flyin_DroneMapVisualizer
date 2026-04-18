"use client";

import { motion } from "framer-motion";

export function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${accent} p-[1px] shadow-lg shadow-slate-950/40`}
    >
      <div className="rounded-2xl bg-slate-950/90 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

export function LegendCard() {
  const items = [
    {
      label: "Start hub",
      tone: "from-emerald-400 to-emerald-600",
      text: "Green pulse",
    },
    {
      label: "Goal hub",
      tone: "from-amber-300 to-yellow-500",
      text: "Gold glow",
    },
    {
      label: "Restricted",
      tone: "from-rose-400 to-orange-500",
      text: "Dashed warning",
    },
    {
      label: "Priority",
      tone: "from-violet-400 to-emerald-400",
      text: "Star badge",
    },
    {
      label: "Blocked",
      tone: "from-slate-400 to-slate-700",
      text: "X overlay",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-slate-900/80 p-4"
    >
      <h3 className="font-semibold text-white">Legend</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
          >
            <span
              className={`h-4 w-4 rounded-full bg-gradient-to-br ${item.tone} shadow-lg`}
            />
            <div>
              <div className="text-sm font-medium text-slate-100">
                {item.label}
              </div>
              <div className="text-xs text-slate-400">{item.text}</div>
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Capacity labels appear on links with values greater than 1.
        </div>
      </div>
    </motion.div>
  );
}

export function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
}
