"use client";

import { PARTICIPANTS } from "@/lib/ballot";
import { decimalToFractional } from "@/lib/odds";
import clsx from "clsx";

interface TeamOdds {
  team: string;
  odds: number;
}

interface Props {
  oddsData: TeamOdds[] | undefined;
}

export default function TopPlayers({ oddsData }: Props) {
  console.log("[TopPlayers] raw oddsData:", oddsData);

  if (!oddsData) {
    return (
      <p className="text-center text-gray-500 py-6">
        Loading odds to rank participants…
      </p>
    );
  }

  if (!Array.isArray(oddsData)) {
    return (
      <p className="text-center text-red-600 py-6">
        Failed to load odds. Check the console for details.
      </p>
    );
  }

  const oddsMap = new Map(oddsData.map((e) => [e.team, e.odds]));

  const ranked = PARTICIPANTS.map((p) => {
    const o1 = oddsMap.get(p.teams[0]) ?? null;
    const o2 = oddsMap.get(p.teams[1]) ?? null;
    // Combined chance: probability of either team winning = 1/o1 + 1/o2
    // Convert back to decimal odds = 1 / combinedProbability
    let combined: number | null = null;
    if (o1 !== null && o2 !== null) {
      combined = 1 / (1 / o1 + 1 / o2);
    } else if (o1 !== null) {
      combined = o1;
    } else if (o2 !== null) {
      combined = o2;
    }
    return { ...p, combined };
  })
    .filter((p) => p.combined !== null)
    .sort((a, b) => (a.combined as number) - (b.combined as number));

  return (
    <div className="rounded-xl overflow-hidden shadow border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold w-12 sm:w-16">Rank</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold">Name</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold">Teams</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold whitespace-nowrap">Odds</th>
            </tr>
          </thead>
          <tbody>
            {ranked.slice(0, 5).map((p, i) => (
              <tr
                key={p.name}
                className={clsx(i % 2 === 0 ? "bg-white" : "bg-blue-50")}
              >
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-500">{i + 1}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-800 whitespace-nowrap">{p.name}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{p.teams.join(" & ")}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">
                  {decimalToFractional(p.combined as number)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
