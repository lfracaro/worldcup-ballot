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

// Maps worldcupjson.net country names → names used in lib/ballot.ts
const NAME_ALIASES: Record<string, string> = {
  "Korea Republic": "South Korea",
  "South Korea": "South Korea",
  "Bosnia and Herzegovina": "Bosnia",
  "Bosnia-Herzegovina": "Bosnia",
  "IR Iran": "Iran",
  "Türkiye": "Turkiye",
  "Turkey": "Turkiye",
  "Czech Republic": "Czechia",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Democratic Republic of the Congo": "DR Congo",
  "Curaçao": "Curacao",
  "United States": "USA",
  "USA": "USA",
  "New Zealand": "New Zealand",
  "Cape Verde": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia",
  "South Africa": "South Africa",
};

function normalise(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

// Build a map of ballot team name → group letter for quick lookup
function buildTeamGroupMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [letter, teams] of Object.entries(GROUPS)) {
    for (const team of teams) {
      map[team] = letter;
    }
  }
  return map;
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

function sortTeams(teams: TeamStanding[]): TeamStanding[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

export async function GET() {
  try {
    const res = await fetch("https://worldcupjson.net/matches", {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[standings] worldcupjson fetch failed — status: ${res.status}`);
      return NextResponse.json(emptyStandings());
    }

    const matches: any[] = await res.json();

    // Initialise standings map: ballotTeamName → TeamStanding
    const standingsMap: Record<string, TeamStanding> = {};
    for (const teams of Object.values(GROUPS)) {
      for (const name of teams) {
        standingsMap[name] = {
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

    const teamGroupMap = buildTeamGroupMap();

    for (const match of matches) {
      // Only process completed group-stage matches with valid scores
      const stage: string = match.stage_name ?? match.stage ?? "";
      if (!stage.toLowerCase().includes("group")) continue;

      const homeGoals: number | null = match.home_team?.goals ?? match.home_score ?? null;
      const awayGoals: number | null = match.away_team?.goals ?? match.away_score ?? null;
      if (homeGoals === null || awayGoals === null) continue;
      if (typeof homeGoals !== "number" || typeof awayGoals !== "number") continue;

      const homeRaw: string = match.home_team?.country ?? match.home_team_country ?? "";
      const awayRaw: string = match.away_team?.country ?? match.away_team_country ?? "";
      const home = normalise(homeRaw);
      const away = normalise(awayRaw);

      if (!standingsMap[home] || !standingsMap[away]) continue;
      // Sanity check: both teams must be in the same group
      if (teamGroupMap[home] !== teamGroupMap[away]) continue;

      const h = standingsMap[home];
      const a = standingsMap[away];

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

    // Compute goal difference
    for (const t of Object.values(standingsMap)) {
      t.goalDifference = t.goalsFor - t.goalsAgainst;
    }

    const standings: GroupStanding[] = Object.entries(GROUPS).map(([letter, teams]) => ({
      group: letter,
      teams: sortTeams(teams.map((name) => standingsMap[name])),
    }));

    return NextResponse.json(standings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[standings] error:", message);
    return NextResponse.json(emptyStandings());
  }
}
