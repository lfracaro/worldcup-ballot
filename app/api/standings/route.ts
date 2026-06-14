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

// Maps API team names → names used in lib/ballot.ts
const NAME_ALIASES: Record<string, string> = {
  "Czech Republic": "Czechia",
  "Bosnia & Herzegovina": "Bosnia",
  "Bosnia and Herzegovina": "Bosnia",
  "Turkey": "Turkiye",
  "Türkiye": "Turkiye",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "United States": "USA",
  "Democratic Republic of the Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Curaçao": "Curacao",
};

function normalise(name: string): string {
  return NAME_ALIASES[name] ?? name;
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

function initStandingsMap(): Record<string, TeamStanding> {
  const map: Record<string, TeamStanding> = {};
  for (const teams of Object.values(GROUPS)) {
    for (const name of teams) {
      map[name] = {
        name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }
  }
  return map;
}

function applyResult(
  map: Record<string, TeamStanding>,
  homeName: string,
  awayName: string,
  homeGoals: number,
  awayGoals: number
) {
  const h = map[homeName];
  const a = map[awayName];
  if (!h || !a) return;

  h.played++;
  a.played++;
  h.goalsFor += homeGoals;
  h.goalsAgainst += awayGoals;
  a.goalsFor += awayGoals;
  a.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    h.won++;
    h.points += 3;
    a.lost++;
  } else if (homeGoals < awayGoals) {
    a.won++;
    a.points += 3;
    h.lost++;
  } else {
    h.drawn++;
    h.points++;
    a.drawn++;
    a.points++;
  }
}

function finaliseAndSort(map: Record<string, TeamStanding>): GroupStanding[] {
  for (const t of Object.values(map)) {
    t.goalDifference = t.goalsFor - t.goalsAgainst;
  }
  return Object.entries(GROUPS).map(([letter, teams]) => ({
    group: letter,
    teams: [...teams.map((name) => map[name])].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    }),
  }));
}

async function fromOpenfootball(): Promise<GroupStanding[] | null> {
  const res = await fetch(
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) {
    console.error(`[standings] openfootball fetch failed — status: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const matches: any[] = data.matches ?? [];

  const map = initStandingsMap();
  let completedCount = 0;

  for (const match of matches) {
    // A match is complete when score.ft is present
    const ft: [number, number] | undefined = match.score?.ft;
    if (!ft) continue;

    const home = normalise(match.team1 ?? "");
    const away = normalise(match.team2 ?? "");
    applyResult(map, home, away, ft[0], ft[1]);
    completedCount++;
  }

  if (completedCount === 0) {
    console.log("[standings] openfootball returned 0 completed matches");
    return null;
  }

  console.log(`[standings] openfootball: parsed ${completedCount} completed matches`);
  return finaliseAndSort(map);
}

async function fromWorldcupJson(): Promise<GroupStanding[] | null> {
  const res = await fetch("https://worldcupjson.net/matches", {
    next: { revalidate: 60 },
  });

  let raw: any;
  try {
    raw = await res.json();
  } catch {
    const text = await res.text().catch(() => "(unreadable)");
    console.log("[standings] worldcupjson raw response (non-JSON):", text);
    return null;
  }

  console.log("[standings] worldcupjson raw response:", JSON.stringify(raw));

  if (!res.ok) {
    console.error(`[standings] worldcupjson fetch failed — status: ${res.status}`);
    return null;
  }

  const matches: any[] = Array.isArray(raw) ? raw : (raw.matches ?? raw.data ?? []);
  const map = initStandingsMap();
  let completedCount = 0;

  for (const match of matches) {
    const stage: string = match.stage_name ?? match.stage ?? match.round ?? "";
    if (!stage.toLowerCase().includes("group")) continue;

    const homeGoals: number | null =
      match.home_team?.goals ?? match.home_score ?? match.score?.home ?? null;
    const awayGoals: number | null =
      match.away_team?.goals ?? match.away_score ?? match.score?.away ?? null;
    if (homeGoals === null || awayGoals === null) continue;
    if (typeof homeGoals !== "number" || typeof awayGoals !== "number") continue;

    const home = normalise(
      match.home_team?.country ?? match.home_team?.name ?? match.home_team_country ?? ""
    );
    const away = normalise(
      match.away_team?.country ?? match.away_team?.name ?? match.away_team_country ?? ""
    );

    applyResult(map, home, away, homeGoals, awayGoals);
    completedCount++;
  }

  if (completedCount === 0) {
    console.log("[standings] worldcupjson returned 0 completed group matches");
    return null;
  }

  console.log(`[standings] worldcupjson: parsed ${completedCount} completed matches`);
  return finaliseAndSort(map);
}

export async function GET() {
  try {
    const standings =
      (await fromOpenfootball()) ??
      (await fromWorldcupJson()) ??
      emptyStandings();

    return NextResponse.json(standings);
  } catch (err) {
    console.error("[standings] unexpected error:", err instanceof Error ? err.message : err);
    return NextResponse.json(emptyStandings());
  }
}
