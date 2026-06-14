"use client";

import useSWR from "swr";

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ResultsTicker() {
  const { data: matches } = useSWR<MatchResult[]>("/api/results", fetcher, {
    refreshInterval: 60_000,
  });

  if (!Array.isArray(matches) || matches.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly
  const items = [...matches, ...matches];

  return (
    <div className="bg-yellow-400 border-b-2 border-yellow-600 h-9 flex items-center overflow-hidden">
      <span className="shrink-0 bg-yellow-600 text-white text-xs font-bold uppercase tracking-widest px-3 h-full flex items-center z-10">
        ⚽ Results
      </span>
      <div className="flex animate-marquee">
        {items.map((m, i) => (
          <span key={i} className="inline-flex items-center whitespace-nowrap px-4 text-xs sm:text-sm font-semibold text-yellow-950">
            {m.homeTeam}
            <span className="mx-2 font-bold tabular-nums text-yellow-800">
              {m.homeScore}–{m.awayScore}
            </span>
            {m.awayTeam}
            <span className="ml-4 text-yellow-600 select-none">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
