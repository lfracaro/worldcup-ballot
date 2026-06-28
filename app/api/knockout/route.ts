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

    // Qualified = any team appearing with a real name in any KO fixture.
    // This correctly captures 1st, 2nd, AND best-3rd-place teams once
    // the bracket is populated by openfootball.
    const qualified = new Set<string>();
    for (const m of koMatches) {
      if (isRealTeam(m.team1)) qualified.add(m.team1);
      if (isRealTeam(m.team2)) qualified.add(m.team2);
    }
    const qualifiedList = Array.from(qualified).sort();
    console.log("[knockout] confirmed qualified teams:", qualifiedList);

    // All confirmed KO matches (both teams known), scored or upcoming
    const results: KOMatch[] = koMatches
      .filter((m) => isRealTeam(m.team1) && isRealTeam(m.team2))
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
        score: Array.isArray(m.score?.ft) ? m.score!.ft : null,
      }));

    return NextResponse.json({ qualified: qualifiedList, results });
  } catch {
    return NextResponse.json({ qualified: [], results: [] });
  }
}
