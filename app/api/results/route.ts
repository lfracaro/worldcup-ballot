import { NextResponse } from "next/server";

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      console.error(`[results] openfootball fetch failed — status: ${res.status}`);
      return NextResponse.json([]);
    }

    const data = await res.json();
    const matches: any[] = data.matches ?? [];

    const results: MatchResult[] = matches
      .filter((m) => Array.isArray(m.score?.ft))
      .map((m) => ({
        homeTeam: m.team1,
        awayTeam: m.team2,
        homeScore: m.score.ft[0],
        awayScore: m.score.ft[1],
      }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("[results] error:", err instanceof Error ? err.message : err);
    return NextResponse.json([]);
  }
}
