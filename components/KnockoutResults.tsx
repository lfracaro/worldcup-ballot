"use client";

import useSWR from "swr";

interface KOMatch {
  round: string;
  date: string;
  team1: string;
  team2: string;
  score: [number, number];
}

interface KOData {
  results: KOMatch[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function highlightsUrl(team1: string, team2: string): string {
  const q = encodeURIComponent(`${team1} v ${team2} highlights bbc iplayer`);
  return `https://www.google.com/search?q=${q}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const ROUND_ORDER = [
  "Final",
  "Match for third place",
  "Semi-final",
  "Quarter-final",
  "Round of 16",
  "Round of 32",
];

export default function KnockoutResults() {
  const { data } = useSWR<KOData>("/api/knockout", fetcher, {
    refreshInterval: 60_000,
  });

  if (!data || data.results.length === 0) return null;
  const displayResults = data.results;

  // Group by round preserving tournament order
  const byRound = new Map<string, KOMatch[]>();
  for (const m of displayResults) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }
  const rounds = ROUND_ORDER.filter((r) => byRound.has(r));

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-widest mb-4">
        Knockout Stage Results
      </h2>
      <div className="space-y-6">
        {rounds.map((round) => (
          <div key={round}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {round}
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-700">
              {byRound.get(round)!.map((m, i) => (
                <div
                  key={`${m.date}-${m.team1}-${m.team2}`}
                  className={`grid items-center text-xs sm:text-sm border-b border-slate-700/50 last:border-0 px-3 py-3 gap-x-2 ${
                    i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"
                  }`}
                  style={{ gridTemplateColumns: "48px 1fr 52px 1fr auto" }}
                >
                  <span className="text-slate-500 whitespace-nowrap text-[11px] sm:text-xs">
                    {formatDate(m.date)}
                  </span>
                  <span className="font-semibold text-white text-right truncate">{m.team1}</span>
                  <span className="font-bold tabular-nums text-yellow-400 text-xs sm:text-sm text-center whitespace-nowrap">
                    {m.score[0]}–{m.score[1]}
                  </span>
                  <span className="font-semibold text-white truncate">{m.team2}</span>
                  <div className="text-right">
                    <a
                      href={highlightsUrl(m.team1, m.team2)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded bg-red-700 text-white font-semibold hover:bg-red-600 transition-colors text-xs px-1.5 py-1 sm:px-2.5"
                      title={`${m.team1} v ${m.team2} highlights`}
                    >
                      <span className="sm:hidden">▶</span>
                      <span className="hidden sm:inline">Highlights</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
