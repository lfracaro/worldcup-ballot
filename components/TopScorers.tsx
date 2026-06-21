"use client";

import { useState } from "react";

interface Scorer {
  name: string;
  team: string;
  goals: number;
}

const DEFAULT_SHOW = 10;

export default function TopScorers({ scorers }: { scorers: Scorer[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? scorers : scorers.slice(0, DEFAULT_SHOW);

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-300 uppercase tracking-widest mb-3">
        Top Scorers
      </h2>
      <div className="rounded-xl overflow-hidden border border-slate-700">
        <table className="w-full table-fixed text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-slate-700 text-slate-200">
              <th className="px-2 py-2 font-semibold w-8 text-center">#</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 font-semibold text-center w-16">Goals</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr
                key={`${s.name}-${s.team}`}
                className={i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}
              >
                <td className="px-2 py-1.5 text-slate-500 text-center">{i + 1}</td>
                <td className="px-3 py-1.5 font-semibold text-white truncate">{s.name}</td>
                <td className="px-3 py-1.5 text-slate-400 truncate">{s.team}</td>
                <td className="px-3 py-1.5 text-center font-bold text-yellow-400">{s.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {scorers.length > DEFAULT_SHOW && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {expanded ? "Show less ▲" : `Show all ${scorers.length} scorers ▼`}
        </button>
      )}
    </section>
  );
}
