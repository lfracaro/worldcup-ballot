"use client";

import useSWR from "swr";

interface TeamStanding {
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

interface GroupStanding {
  group: string;
  teams: TeamStanding[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonGroup() {
  return (
    <div className="rounded-xl overflow-hidden shadow border border-gray-200">
      <div className="h-9 bg-gray-300 animate-pulse" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-2 px-3 py-2 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          {[...Array(8)].map((__, j) => (
            <div key={j} className="h-4 w-5 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function GroupTable({ group, teams }: GroupStanding) {
  return (
    <div className="rounded-xl overflow-hidden shadow border border-gray-200">
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-3 py-2 font-semibold" colSpan={9}>
              {group.startsWith("Group ") ? group : `Group ${group}`}
            </th>
          </tr>
          <tr className="bg-gray-700 text-gray-200 text-center">
            <th className="px-3 py-1 font-medium text-left">Team</th>
            <th className="px-1 py-1 font-medium">P</th>
            <th className="px-1 py-1 font-medium">W</th>
            <th className="px-1 py-1 font-medium">D</th>
            <th className="px-1 py-1 font-medium">L</th>
            <th className="px-1 py-1 font-medium">GF</th>
            <th className="px-1 py-1 font-medium">GA</th>
            <th className="px-1 py-1 font-medium">GD</th>
            <th className="px-1 py-1 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr
              key={team.name}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                {team.name}
              </td>
              <td className="px-1 py-2 text-center text-gray-600">{team.played}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.won}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.drawn}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.lost}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.goalsFor}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.goalsAgainst}</td>
              <td className="px-1 py-2 text-center text-gray-600">{team.goalDifference}</td>
              <td className="px-1 py-2 text-center font-semibold text-gray-800">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GroupStandings() {
  const { data, error, isLoading } = useSWR<GroupStanding[]>(
    "/api/standings",
    fetcher
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading &&
        [...Array(12)].map((_, i) => <SkeletonGroup key={i} />)}

      {error && (
        <p className="col-span-full text-center text-red-600 py-6">
          Failed to load standings. Please try again later.
        </p>
      )}

      {data &&
        data.map((g) => (
          <GroupTable key={g.group} group={g.group} teams={g.teams} />
        ))}
    </div>
  );
}
