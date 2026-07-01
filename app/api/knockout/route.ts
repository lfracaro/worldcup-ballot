import { NextResponse } from "next/server";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

function isRealTeam(name: string): boolean {
  if (!name) return false;
  if (/^\d/.test(name)) return false;
  if (name.includes("/")) return false;
  if (/\bgroup\b/i.test(name)) return false;
  if (/^[WL]\d+$/.test(name)) return false;
  return /^[A-Z]/.test(name);
}

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
];

interface RawScore {
  ft?: [number, number];
  et?: [number, number];
  p?: [number, number];   // raw field name for penalties
}

interface RawMatch {
  round?: string;
  group?: string;
  num?: number;
  date: string;
  team1: string;
  team2: string;
  score?: RawScore;
}

export interface KOScore {
  ft: [number, number];
  et?: [number, number];
  pen?: [number, number];
}

export interface KOMatch {
  round: string;
  date: string;
  num: number;
  team1: string | null;
  team2: string | null;
  score: KOScore | null;
}

export async function GET() {
  try {
    const res = await fetch(OPENFOOTBALL_URL, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ qualified: [], matches: [] });
    const data = await res.json();

    const allMatches: RawMatch[] = data.matches ?? [];
    const koMatches = allMatches.filter((m) => m.round && !m.group);

    // Build winner/loser maps from scored KO matches so we can resolve
    // bracket placeholders like "W74" → "Paraguay" in later rounds.
    const winnerOf = new Map<number, string>();
    const loserOf = new Map<number, string>();

    for (const m of koMatches) {
      if (!m.num || !m.score?.ft) continue;
      const pen = m.score.p ?? null;
      const et = m.score.et ?? null;
      const decisive = pen ?? et ?? m.score.ft;
      let winner: string | null = null;
      let loser: string | null = null;
      if (decisive[0] > decisive[1]) { winner = m.team1; loser = m.team2; }
      else if (decisive[1] > decisive[0]) { winner = m.team2; loser = m.team1; }
      if (winner && isRealTeam(winner)) winnerOf.set(m.num, winner);
      if (loser && isRealTeam(loser)) loserOf.set(m.num, loser);
    }

    const resolveTeam = (name: string): string | null => {
      if (!name) return null;
      if (isRealTeam(name)) return name;
      const wm = name.match(/^W(\d+)$/);
      if (wm) return winnerOf.get(parseInt(wm[1])) ?? null;
      const lm = name.match(/^L(\d+)$/);
      if (lm) return loserOf.get(parseInt(lm[1])) ?? null;
      return null;
    }

    // Qualified = all real teams that appear (directly or resolved) in any KO fixture
    const qualified = new Set<string>();
    for (const m of koMatches) {
      const t1 = resolveTeam(m.team1);
      const t2 = resolveTeam(m.team2);
      if (t1) qualified.add(t1);
      if (t2) qualified.add(t2);
    }
    const qualifiedList = Array.from(qualified).sort();

    // KnockedOut = teams that have already lost a KO match (resolved names only)
    const knockedOut = new Set<string>();
    for (const loser of loserOf.values()) knockedOut.add(loser);

    const matches: KOMatch[] = koMatches
      .sort(
        (a, b) =>
          ROUND_ORDER.indexOf(a.round!) - ROUND_ORDER.indexOf(b.round!) ||
          a.date.localeCompare(b.date)
      )
      .map((m) => ({
        round: m.round!,
        date: m.date,
        num: m.num ?? 0,
        team1: resolveTeam(m.team1),
        team2: resolveTeam(m.team2),
        score: Array.isArray(m.score?.ft)
          ? {
              ft: m.score!.ft!,
              ...(Array.isArray(m.score!.et) ? { et: m.score!.et } : {}),
              ...(Array.isArray(m.score!.p) ? { pen: m.score!.p } : {}),
            }
          : null,
      }));

    return NextResponse.json({ qualified: qualifiedList, knockedOut: Array.from(knockedOut).sort(), matches });
  } catch {
    return NextResponse.json({ qualified: [], matches: [] });
  }
}
