import { NextResponse } from "next/server";

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "FINISHED" | "IN_PLAY" | "PAUSED";
  minute?: number;
}

// TODO: replace with live data once FOOTBALL_DATA_API_KEY is set in .env.local
// Get a free key at https://www.football-data.org/
export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json([]);
  }

  try {
    // Competition code for FIFA World Cup 2026 — update if football-data.org uses a different code
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED,IN_PLAY,PAUSED",
      {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[results] fetch failed — status: ${res.status}, body:`, text);
      return NextResponse.json([]);
    }

    const data = await res.json();

    const matches: MatchResult[] = (data.matches ?? []).map((m: any) => ({
      homeTeam: m.homeTeam.shortName ?? m.homeTeam.name,
      awayTeam: m.awayTeam.shortName ?? m.awayTeam.name,
      homeScore: m.score.fullTime.home ?? m.score.halfTime.home ?? 0,
      awayScore: m.score.fullTime.away ?? m.score.halfTime.away ?? 0,
      status: m.status,
      minute: m.minute ?? undefined,
    }));

    return NextResponse.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[results] error:", message);
    return NextResponse.json([]);
  }
}
