"use client";

import useSWR from "swr";

interface KOScore {
  ft: [number, number];
  et?: [number, number];
  pen?: [number, number];
}

interface KOMatch {
  round: string;
  date: string;
  num: number;
  team1: string | null;
  team2: string | null;
  score: KOScore | null;
}

interface KOData {
  qualified: string[];
  matches: KOMatch[];
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

// 1 = team1 wins, 2 = team2 wins, 0 = no result yet
function getWinner(score: KOScore | null): 0 | 1 | 2 {
  if (!score) return 0;
  const decisive = score.pen ?? score.et ?? score.ft;
  if (decisive[0] > decisive[1]) return 1;
  if (decisive[1] > decisive[0]) return 2;
  return 0;
}

const ROUND_DISPLAY_ORDER = [
  "Final",
  "Match for third place",
  "Semi-final",
  "Quarter-final",
  "Round of 16",
  "Round of 32",
];

function ScoreCell({ score }: { score: KOScore }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
      <span className="font-bold tabular-nums text-yellow-400 text-xs sm:text-sm whitespace-nowrap">
        {score.ft[0]}–{score.ft[1]}
      </span>
      {score.et && (
        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          AET {score.et[0]}–{score.et[1]}
        </span>
      )}
      {score.pen && (
        <span className="text-[10px] text-green-400 whitespace-nowrap">
          PSO {score.pen[0]}–{score.pen[1]}
        </span>
      )}
    </div>
  );
}

function MatchRow({ m, index }: { m: KOMatch; index: number }) {
  const winner = getWinner(m.score);
  const isPlayed = m.score !== null;
  const isUpcoming = !isPlayed;
  const hasBothTeams = m.team1 !== null && m.team2 !== null;

  const rowBg = isUpcoming
    ? index % 2 === 0 ? "bg-slate-800/40" : "bg-slate-800/20"
    : index % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50";

  const team1Class = isUpcoming
    ? "font-medium text-slate-500"
    : winner === 1
    ? "font-bold text-white"
    : "font-semibold text-slate-300";

  const team2Class = isUpcoming
    ? "font-medium text-slate-500"
    : winner === 2
    ? "font-bold text-white"
    : "font-semibold text-slate-300";

  return (
    <div
      className={`grid items-center text-xs sm:text-sm border-b border-slate-700/50 last:border-0 px-3 py-2.5 gap-x-2 ${rowBg}`}
      style={{ gridTemplateColumns: "48px 1fr auto 1fr auto" }}
    >
      <span className="text-slate-500 whitespace-nowrap text-[11px] sm:text-xs">
        {formatDate(m.date)}
      </span>

      <span className={`${team1Class} text-right truncate`}>
        {m.team1 ?? "TBD"}
      </span>

      {isPlayed ? (
        <ScoreCell score={m.score!} />
      ) : (
        <span className="text-slate-600 text-xs text-center whitespace-nowrap min-w-[52px]">
          {hasBothTeams ? "vs" : "–"}
        </span>
      )}

      <span className={`${team2Class} truncate`}>
        {m.team2 ?? "TBD"}
      </span>

      <div className="text-right">
        {isPlayed && hasBothTeams && (
          <a
            href={highlightsUrl(m.team1!, m.team2!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded bg-red-700 text-white font-semibold hover:bg-red-600 transition-colors text-xs px-1.5 py-1 sm:px-2.5"
            title={`${m.team1} v ${m.team2} highlights`}
          >
            <span className="sm:hidden">▶</span>
            <span className="hidden sm:inline">Highlights</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default function KnockoutResults() {
  const { data } = useSWR<KOData>("/api/knockout", fetcher, {
    refreshInterval: 60_000,
  });

  // Hide until we have confirmed qualified teams (i.e. group stage done)
  if (!data || data.qualified.length === 0) return null;

  const byRound = new Map<string, KOMatch[]>();
  for (const m of data.matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }
  const rounds = ROUND_DISPLAY_ORDER.filter((r) => byRound.has(r));

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-widest mb-4">
        Knockout Stage
      </h2>
      <div className="space-y-6">
        {rounds.map((round) => (
          <div key={round}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {round}
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-700">
              {byRound.get(round)!.map((m, i) => (
                <MatchRow key={`${m.num}-${m.date}`} m={m} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
