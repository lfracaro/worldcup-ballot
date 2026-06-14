"use client";

import clsx from "clsx";
import { decimalToFractional } from "@/lib/odds";
import { PARTICIPANTS } from "@/lib/ballot";

interface TeamOdds {
  team: string;
  odds: number;
}

interface Props {
  oddsData: TeamOdds[] | undefined;
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className={clsx(index % 2 === 0 ? "bg-white" : "bg-green-50")}>
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

const ownerMap = new Map<string, string>(
  PARTICIPANTS.flatMap((p) => p.teams.map((t) => [t, p.name]))
);

export default function TopTeams({ oddsData }: Props) {
  console.log("[TopTeams] raw oddsData:", oddsData);

  const teams: TeamOdds[] = Array.isArray(oddsData) ? oddsData : [];
  const hasError = oddsData != null && !Array.isArray(oddsData);

  return (
    <div className="rounded-xl overflow-hidden shadow border border-gray-200">
        <table className="w-full table-fixed text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-green-900 text-white">
              <th className="px-3 py-2 sm:py-3 font-semibold w-10">Rank</th>
              <th className="px-3 py-2 sm:py-3 font-semibold">Team</th>
              <th className="px-3 py-2 sm:py-3 font-semibold">Name</th>
              <th className="px-3 py-2 sm:py-3 font-semibold text-right w-20">Odds</th>
            </tr>
          </thead>
          <tbody>
            {!oddsData && !hasError &&
              [...Array(5)].map((_, i) => <SkeletonRow key={i} index={i} />)}

            {hasError && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-red-600 text-xs sm:text-sm">
                  Failed to load odds. Check the console for details.
                </td>
              </tr>
            )}

            {teams.length > 0 &&
              teams.slice(0, 5).map((entry, i) => (
                <tr
                  key={entry.team}
                  className={clsx(i % 2 === 0 ? "bg-white" : "bg-green-50")}
                >
                  <td className="px-3 py-2 sm:py-3 font-medium text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2 sm:py-3 font-semibold text-gray-800 truncate">{entry.team}</td>
                  <td className="px-3 py-2 sm:py-3 text-gray-400 truncate">{ownerMap.get(entry.team)}</td>
                  <td className="px-3 py-2 sm:py-3 text-gray-700 text-right">{decimalToFractional(entry.odds)}</td>
                </tr>
              ))}
          </tbody>
        </table>
    </div>
  );
}
