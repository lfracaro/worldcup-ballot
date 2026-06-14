import { NextResponse } from "next/server";
import { GROUPS } from "@/lib/ballot";

export interface TeamStanding {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  teams: TeamStanding[];
}

function emptyStandings(): GroupStanding[] {
  return Object.entries(GROUPS).map(([letter, teams]) => ({
    group: letter,
    teams: teams.map((name) => ({
      name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })),
  }));
}

// Maps football-data.org team names → names used in lib/ballot.ts
const NAME_ALIASES: Record<string, string> = {
  "Korea Republic": "South Korea",
  "Bosnia and Herzegovina": "Bosnia",
  "Bosnia-H.": "Bosnia",
  "IR Iran": "Iran",
  "Türkiye": "Turkiye",
  "Turkey": "Turkiye",
  "Czech Republic": "Czechia",
  "Côte d'Ivoire": "Ivory Coast",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Curaçao": "Curacao",
  "USA": "USA",
  "United States": "USA",
};

function normalise(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(emptyStandings());
  }

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/standings",
      {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[standings] fetch failed — status: ${res.status}, body:`, text);
      return NextResponse.json(emptyStandings());
    }

    const data = await res.json();

    const standings: GroupStanding[] = (data.standings ?? [])
      .filter((s: any) => s.type === "TOTAL")
      .map((s: any) => ({
        group: s.group?.replace("GROUP_", "") ?? "?",
        teams: (s.table ?? []).map((row: any) => ({
          name: normalise(row.team?.shortName ?? row.team?.name ?? ""),
          played: row.playedGames ?? 0,
          won: row.won ?? 0,
          drawn: row.draw ?? 0,
          lost: row.lost ?? 0,
          goalsFor: row.goalsFor ?? 0,
          goalsAgainst: row.goalsAgainst ?? 0,
          goalDifference: row.goalDifference ?? 0,
          points: row.points ?? 0,
        })),
      }));

    return NextResponse.json(standings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[standings] error:", message);
    return NextResponse.json(emptyStandings());
  }
}
