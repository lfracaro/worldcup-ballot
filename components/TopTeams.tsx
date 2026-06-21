"use client";

import clsx from "clsx";
import { decimalToFractional } from "@/lib/odds";
import { PARTICIPANTS, ELIMINATED, GROUPS } from "@/lib/ballot";

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
        <td key={i} className="px-3 py-2 sm:py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

const ownerMap = new Map<string, string>(
  PARTICIPANTS.flatMap((p) => p.teams.map((t) => [t, p.name]))
);

function TeamRow({ entry, rank, striped, isLast = false }: { entry: TeamOdds; rank: number; striped: boolean; isLast?: boolean }) {
  return (
    <tr className={isLast ? "bg-amber-50 border-t-2 border-amber-200" : striped ? "bg-green-50" : "bg-white"}>
      <td className={clsx("px-2 py-2 sm:py-3 font-medium text-center", isLast ? "text-amber-700" : "text-gray-500")}>{rank}</td>
      <td className={clsx("px-3 py-2 sm:py-3 font-semibold truncate", isLast ? "text-amber-900" : "text-gray-800")}>{entry.team}</td>
      <td className={clsx("px-3 py-2 sm:py-3 truncate", isLast ? "text-amber-600" : "text-gray-400")}>{ownerMap.get(entry.team)}</td>
      <td className={clsx("px-3 py-2 sm:py-3 text-right", isLast ? "text-amber-800 font-medium" : "text-gray-700")}>{decimalToFractional(entry.odds)}</td>
    </tr>
  );
}

const TOTAL_BALLOT_TEAMS = Object.values(GROUPS).flat().length;

export default function TopTeams({ oddsData }: Props) {
  const allTeams: TeamOdds[] = Array.isArray(oddsData) ? oddsData : [];
  const hasError = oddsData != null && !Array.isArray(oddsData);

  // Active = not eliminated; already sorted best→worst odds by the API
  const active = allTeams.filter((e) => !ELIMINATED.includes(e.team));
  const top5 = active.slice(0, 5);
  const last = active.length > 5 ? active[active.length - 1] : null;
  const lastRank = active.length;

  const missingOdds = oddsData ? TOTAL_BALLOT_TEAMS - allTeams.length : 0;

  return (
    <div>
      <div className="rounded-xl overflow-hidden shadow border border-gray-200">
        <table className="w-full table-fixed text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-green-900 text-white">
              <th className="px-2 py-2 sm:py-3 font-semibold w-8 text-center">Rank</th>
              <th className="px-3 py-2 sm:py-3 font-semibold w-28">Team</th>
              <th className="px-3 py-2 sm:py-3 font-semibold">Name</th>
              <th className="px-3 py-2 sm:py-3 font-semibold text-right w-16">Odds</th>
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

            {top5.map((entry, i) => (
              <TeamRow key={entry.team} entry={entry} rank={i + 1} striped={i % 2 !== 0} />
            ))}

            {last && (
              <>
                <tr>
                  <td colSpan={4} className="px-3 py-0.5 text-center text-gray-300 text-xs select-none bg-gray-50 border-y border-gray-100">
                    · · ·
                  </td>
                </tr>
                <TeamRow entry={last} rank={lastRank} striped={false} isLast />
              </>
            )}
          </tbody>
        </table>
      </div>
      {missingOdds > 0 && (
        <p className="mt-1.5 text-xs text-gray-400 px-1">
          * {missingOdds} ballot team{missingOdds !== 1 ? "s have" : " has"} no published odds yet — rankings reflect only teams with available data.
        </p>
      )}
    </div>
  );
}
