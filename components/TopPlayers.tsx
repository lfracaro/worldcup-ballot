"use client";

import { PARTICIPANTS, ELIMINATED } from "@/lib/ballot";
import { decimalToFractional } from "@/lib/odds";
import clsx from "clsx";

interface TeamOdds {
  team: string;
  odds: number;
}

interface Props {
  oddsData: TeamOdds[] | undefined;
}

function TeamsCell({ teams }: { teams: string[] }) {
  return (
    <td className="px-3 py-2 sm:py-3 text-gray-400 truncate">
      {teams.map((t, i) => (
        <span key={t}>
          {i > 0 && <span className="mx-0.5">&amp;</span>}
          <span className={ELIMINATED.includes(t) ? "line-through text-gray-300" : ""}>
            {t}
          </span>
        </span>
      ))}
    </td>
  );
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

  const ranked = PARTICIPANTS
    // Keep participant only if at least one team is still active
    .filter((p) => p.teams.some((t) => !ELIMINATED.includes(t)))
    .map((p) => {
      // Only non-eliminated teams contribute to combined odds
      const o1 = !ELIMINATED.includes(p.teams[0]) ? (oddsMap.get(p.teams[0]) ?? null) : null;
      const o2 = !ELIMINATED.includes(p.teams[1]) ? (oddsMap.get(p.teams[1]) ?? null) : null;
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

  const top5 = ranked.slice(0, 5);
  const last = ranked.length > 5 ? ranked[ranked.length - 1] : null;
  const lastRank = ranked.length;

  const missingPlayers = PARTICIPANTS.length - ranked.length;

  return (
    <div>
      <div className="rounded-xl overflow-hidden shadow border border-gray-200">
        <table className="w-full table-fixed text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="px-2 py-2 sm:py-3 font-semibold w-8 text-center">Rank</th>
              <th className="px-3 py-2 sm:py-3 font-semibold w-28">Name</th>
              <th className="px-3 py-2 sm:py-3 font-semibold">Teams</th>
              <th className="px-3 py-2 sm:py-3 font-semibold text-right w-16">Odds</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((p, i) => (
              <tr key={p.name} className={clsx(i % 2 === 0 ? "bg-white" : "bg-blue-50")}>
                <td className="px-2 py-2 sm:py-3 font-medium text-gray-500 text-center">{i + 1}</td>
                <td className="px-3 py-2 sm:py-3 font-semibold text-gray-800 truncate">{p.name}</td>
                <TeamsCell teams={p.teams} />
                <td className="px-3 py-2 sm:py-3 text-gray-700 text-right">
                  {decimalToFractional(p.combined as number)}
                </td>
              </tr>
            ))}

            {last && (
              <>
                <tr>
                  <td colSpan={4} className="px-3 py-0.5 text-center text-gray-300 text-xs select-none bg-gray-50 border-y border-gray-100">
                    · · ·
                  </td>
                </tr>
                <tr className="bg-amber-50 border-t-2 border-amber-200">
                  <td className="px-2 py-2 sm:py-3 font-medium text-amber-700 text-center">{lastRank}</td>
                  <td className="px-3 py-2 sm:py-3 font-semibold text-amber-900 truncate">{last.name}</td>
                  <TeamsCell teams={last.teams} />
                  <td className="px-3 py-2 sm:py-3 text-amber-800 font-medium text-right">
                    {decimalToFractional(last.combined as number)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      {missingPlayers > 0 && (
        <p className="mt-1.5 text-xs text-gray-400 px-1">
          * {missingPlayers} participant{missingPlayers !== 1 ? "s have" : " has"} both teams missing odds data and are excluded from rankings.
        </p>
      )}
    </div>
  );
}
