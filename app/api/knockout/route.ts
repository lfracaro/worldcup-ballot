import { NextResponse } from "next/server";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Real team name = starts with an uppercase letter followed by a lowercase letter.
// Placeholders look like "1A", "3C/D/F", "2I", "Winner Group A" etc.
function isRealTeam(name: string): boolean {
  return /^[A-Z][a-z]/.test(name);
}

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
];

interface RawMatch {
  round?: string;
  group?: string;
  num?: number;
  date: string;
  team1: string;
  team2: string;
  score?: { ft: [number, number] };
}

export interface KOMatch {
  round: string;
  date: string;
  team1: string;
  team2: string;
  score: [number, number] | null;
}

export async function GET() {
  try {
    const res = await fetch(OPENFOOTBALL_URL, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ qualified: [], results: [] });
    const data = await res.json();

    const allMatches: RawMatch[] = data.matches ?? [];

    // Knockout = has a round field but no group field
    const koMatches = allMatches.filter((m) => m.round && !m.group);

    console.log("[knockout] raw KO matches:", JSON.stringify(koMatches, null, 2));

    // Scored KO matches where both teams are real names (not bracket placeholders)
    const results: KOMatch[] = koMatches
      .filter((m) => isRealTeam(m.team1) && isRealTeam(m.team2) && Array.isArray(m.score?.ft))
      .sort(
        (a, b) =>
          ROUND_ORDER.indexOf(a.round!) - ROUND_ORDER.indexOf(b.round!) ||
          a.date.localeCompare(b.date)
      )
      .map((m) => ({
        round: m.round!,
        date: m.date,
        team1: m.team1,
        team2: m.team2,
        score: m.score!.ft,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ qualified: [], results: [] });
  }
}
