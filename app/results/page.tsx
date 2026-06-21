import Link from "next/link";
import TopScorers from "@/components/TopScorers";

interface Goal {
  name: string;
  minute: string;
  penalty?: boolean;
  owngoal?: boolean;
}

interface Match {
  round: string;
  date: string;
  team1: string;
  team2: string;
  score?: { ft: [number, number] };
  goals1?: Goal[];
  goals2?: Goal[];
  group?: string;
}

async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.matches ?? [];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function highlightsUrl(home: string, away: string): string {
  const q = encodeURIComponent(`${home} v ${away} highlights bbc iplayer`);
  return `https://www.google.com/search?q=${q}`;
}

export default async function ResultsPage() {
  const allMatches = await fetchMatches();
  const completed = allMatches.filter((m) => Array.isArray(m.score?.ft));

  // Group completed matches by group label, preserving insertion order
  const grouped = new Map<string, Match[]>();
  for (const match of completed) {
    const key = match.group ?? match.round ?? "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(match);
  }

  // Top scorers — exclude own goals, aggregate per player+team
  const scorerMap = new Map<string, { team: string; goals: number }>();
  for (const match of completed) {
    for (const goal of match.goals1 ?? []) {
      if (goal.owngoal) continue;
      const key = `${goal.name}|||${match.team1}`;
      const prev = scorerMap.get(key) ?? { team: match.team1, goals: 0 };
      scorerMap.set(key, { team: match.team1, goals: prev.goals + 1 });
    }
    for (const goal of match.goals2 ?? []) {
      if (goal.owngoal) continue;
      const key = `${goal.name}|||${match.team2}`;
      const prev = scorerMap.get(key) ?? { team: match.team2, goals: 0 };
      scorerMap.set(key, { team: match.team2, goals: prev.goals + 1 });
    }
  }

  const topScorers = [...scorerMap.entries()]
    .map(([key, val]) => ({ name: key.split("|||")[0], ...val }))
    .sort((a, b) => b.goals - a.goals);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              All Results
            </h1>
            <p className="mt-1 text-slate-400 text-xs sm:text-sm">
              World Cup 2026 · completed matches
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-600 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">

        {/* Top Scorers */}
        {topScorers.length > 0 && <TopScorers scorers={topScorers} />}

        {/* Match results grouped by stage */}
        {completed.length === 0 && (
          <p className="text-slate-400 text-center py-12">No completed matches yet.</p>
        )}

        {[...grouped.entries()].map(([groupName, matches]) => (
          <section key={groupName}>
            <h2 className="text-base font-semibold text-slate-300 uppercase tracking-widest mb-4">
              {groupName}
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-700">
              {matches.map((m, i) => (
                <div
                  key={`${m.date}-${m.team1}-${m.team2}`}
                  className={`grid items-center text-xs sm:text-sm border-b border-slate-700/50 last:border-0 px-3 py-3 gap-x-2 ${i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}`}
                  style={{ gridTemplateColumns: "48px 1fr 52px 1fr auto" }}
                >
                  {/* Date */}
                  <span className="text-slate-500 whitespace-nowrap text-[11px] sm:text-xs">{formatDate(m.date)}</span>
                  {/* Home team */}
                  <span className="font-semibold text-white text-right truncate">{m.team1}</span>
                  {/* Score */}
                  <span className="font-bold tabular-nums text-yellow-400 text-xs sm:text-sm text-center whitespace-nowrap">
                    {m.score!.ft[0]}–{m.score!.ft[1]}
                  </span>
                  {/* Away team */}
                  <span className="font-semibold text-white truncate">{m.team2}</span>
                  {/* Highlights — icon on mobile, full label on sm+ */}
                  <div className="text-right">
                    <a
                      href={highlightsUrl(m.team1, m.team2)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded bg-red-700 text-white font-semibold hover:bg-red-600 transition-colors text-xs px-1.5 py-1 sm:px-2.5 sm:w-auto"
                      title={`${m.team1} v ${m.team2} highlights`}
                    >
                      <span className="sm:hidden">▶</span>
                      <span className="hidden sm:inline">Highlights</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
