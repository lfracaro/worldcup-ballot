"use client";

import useSWR from "swr";
import Link from "next/link";
import TopTeams from "@/components/TopTeams";
import TopPlayers from "@/components/TopPlayers";
import GroupStandings from "@/components/GroupStandings";
import ResultsTicker from "@/components/ResultsTicker";

interface TeamOdds {
  team: string;
  odds: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-widest mb-4">
      {children}
    </h2>
  );
}

export default function Home() {
  const { data: oddsData } = useSWR<TeamOdds[]>("/api/odds", fetcher, {
    refreshInterval: 300_000,
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <ResultsTicker />
      {/* Header */}
      <header className="border-b border-slate-700 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                World Cup 2026 Ballot Dashboard
              </h1>
              <p className="mt-1 sm:mt-2 text-slate-400 text-xs sm:text-sm">
                24 participants · 48 teams · one winner
              </p>
            </div>
            <Link
              href="/results"
              className="shrink-0 mt-1 px-3 py-1.5 rounded-lg bg-yellow-400 text-yellow-950 text-xs sm:text-sm font-bold hover:bg-yellow-300 transition-colors"
            >
              All Results
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Top odds panels */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <SectionTitle>Top 5 &amp; Last Teams by Odds</SectionTitle>
              <TopTeams oddsData={oddsData} />
            </div>
            <div>
              <SectionTitle>Top 5 &amp; Last Players by Odds</SectionTitle>
              <TopPlayers oddsData={oddsData} />
            </div>
          </div>
        </section>

        {/* Group standings */}
        <section>
          <SectionTitle>Group Stage Standings</SectionTitle>
          <GroupStandings />
        </section>
      </main>
    </div>
  );
}
