import { NextResponse } from "next/server";

// Maps API team names → names used in lib/ballot.ts
const NAME_ALIASES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia",
  "Czech Republic": "Czechia",
  "Turkey": "Turkiye",
  "Curaçao": "Curacao",
  // Handle potential encoding corruption of Curaçao
  "CuraÃ§ao": "Curacao",
};

function normalise(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

export async function GET() {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing ODDS_API_KEY" }, { status: 500 });
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${apiKey}&regions=uk&markets=outrights&oddsFormat=decimal`;
    console.log("[odds] fetching:", url.replace(apiKey, "REDACTED"));

    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[odds] fetch failed — status: ${res.status}, body:`, text);
      return NextResponse.json(
        { error: `Odds API error: ${res.status}`, detail: text },
        { status: 500 }
      );
    }

    const data = await res.json();

    // data is an array of events; each event has bookmakers -> markets -> outcomes
    const oddsMap = new Map<string, number[]>();

    for (const event of data) {
      for (const bookmaker of event.bookmakers ?? []) {
        for (const market of bookmaker.markets ?? []) {
          if (market.key !== "outrights") continue;
          for (const outcome of market.outcomes ?? []) {
            const team: string = normalise(outcome.name);
            const price: number = outcome.price;
            if (!oddsMap.has(team)) oddsMap.set(team, []);
            oddsMap.get(team)!.push(price);
          }
        }
      }
    }

    // Average odds across bookmakers for each team
    const result = Array.from(oddsMap.entries())
      .map(([team, prices]) => ({
        team,
        odds: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
      }))
      .sort((a, b) => a.odds - b.odds);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
