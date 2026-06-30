"use client";

import useSWR from "swr";
import { PARTICIPANTS } from "@/lib/ballot";

const ELIMINATION_QUIPS = [
  "time to just enjoy the football! 🍿",
  "both teams packed their bags! 🧳",
  "heading home early! ✈️",
  "the dream is officially over! 😭",
  "officially a neutral now! 😐",
  "see you in 2030! 👀",
  "knocked clean out of the sweepstake! 💥",
  "guess it's just vibes from here! 🌊",
  "rooting for anyone but the others now! 🙃",
  "not this year… or this World Cup! 😅",
  "time to pick a new team to support! 🤔",
  "the bracket has spoken! 📋",
];

function quip(index: number): string {
  return ELIMINATION_QUIPS[index % ELIMINATION_QUIPS.length];
}

interface KOData {
  qualified: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EliminatedPlayers() {
  const { data } = useSWR<KOData>("/api/knockout", fetcher, {
    refreshInterval: 60_000,
  });

  // Only show once the bracket is populated (group stage complete)
  if (!data || data.qualified.length === 0) return null;

  const qualified = new Set(data.qualified);
  const eliminated = PARTICIPANTS.filter(
    (p) => !qualified.has(p.teams[0]) && !qualified.has(p.teams[1])
  );

  if (eliminated.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 mt-4">
      <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2">
        💀 Already Out
      </p>
      <ul className="space-y-1">
        {eliminated.map((p, i) => (
          <li key={p.name} className="text-xs sm:text-sm text-slate-400">
            <span className="font-semibold text-slate-300">{p.name}</span>
            {" — "}
            <s className="text-slate-500">{p.teams[0]}</s>
            {" & "}
            <s className="text-slate-500">{p.teams[1]}</s>
            {" — "}{quip(i)}
          </li>
        ))}
      </ul>
    </div>
  );
}
