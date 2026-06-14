"use client";

import useSWR from "swr";

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "FINISHED" | "IN_PLAY" | "PAUSED";
  minute?: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function MatchChip({ match }: { match: MatchResult }) {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  return (
    <span className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
      {isLive && (
        <span className="text-xs font-bold text-red-400 animate-pulse uppercase">
          {match.minute ? `${match.minute}'` : "Live"}
        </span>
      )}
      <span className="font-semibold text-white">{match.homeTeam}</span>
      <span className="tabular-nums font-bold text-yellow-300 text-base">
        {match.homeScore} – {match.awayScore}
      </span>
      <span className="font-semibold text-white">{match.awayTeam}</span>
      <span className="text-slate-600 select-none mx-2">|</span>
    </span>
  );
}

export default function ResultsTicker() {
  const { data: matches } = useSWR<MatchResult[]>("/api/results", fetcher, {
    refreshInterval: 60_000,
  });

  const hasResults = Array.isArray(matches) && matches.length > 0;
  const noKey = Array.isArray(matches) && matches.length === 0;

  return (
    <div className="bg-slate-800 border-b-2 border-yellow-500 text-sm overflow-hidden h-10 flex items-center">
      {noKey && (
        <p className="px-6 text-yellow-400 text-xs font-semibold tracking-wide">
          ⚽ RESULTS TICKER — Add FOOTBALL_DATA_API_KEY to .env.local to enable live scores
        </p>
      )}
      {!matches && (
        <p className="px-6 text-slate-400 text-xs">Loading results…</p>
      )}
      {hasResults && (
        <div className="flex animate-marquee">
          {[...matches, ...matches].map((m, i) => (
            <MatchChip key={i} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
