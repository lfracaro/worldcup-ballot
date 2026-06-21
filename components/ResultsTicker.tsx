"use client";

import useSWR from "swr";
import { useEffect, useRef } from "react";

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ResultsTicker() {
  const { data: matches } = useSWR<MatchResult[]>("/api/results", fetcher, {
    refreshInterval: 60_000,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !Array.isArray(matches) || matches.length === 0) return;

    // Slower on desktop (wider screens) for readability.
    // Using translate3d keeps the element on a GPU compositing layer so
    // text is rasterised once at integer pixels and moved as a texture —
    // no sub-pixel blurring during animation.
    const pxPerFrame = window.innerWidth >= 768 ? 0.35 : 0.75;

    posRef.current = 0;

    function tick() {
      if (!track) return;
      // Half the track width because we duplicate the item list for seamless looping
      const halfWidth = track.scrollWidth / 2;
      posRef.current -= pxPerFrame;
      if (posRef.current <= -halfWidth) posRef.current = 0;
      // Round to nearest integer to keep text on pixel boundaries
      track.style.transform = `translate3d(${Math.round(posRef.current)}px, 0, 0)`;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [matches]);

  if (!Array.isArray(matches) || matches.length === 0) return null;

  const items = [...matches, ...matches];

  return (
    <div className="bg-yellow-400 border-b-2 border-yellow-600 h-9 flex items-center overflow-hidden">
      <span className="shrink-0 bg-yellow-600 text-white text-xs font-bold uppercase tracking-widest px-3 h-full flex items-center z-10">
        ⚽ Results
      </span>
      <div
        ref={trackRef}
        className="flex"
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {items.map((m, i) => (
          <span
            key={i}
            className="inline-flex items-center whitespace-nowrap px-4 text-xs sm:text-sm font-semibold text-yellow-950"
          >
            {m.homeTeam}
            <span className="mx-2 font-bold tabular-nums text-yellow-800">
              {m.homeScore}–{m.awayScore}
            </span>
            {m.awayTeam}
            <span className="ml-4 text-yellow-600 select-none">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
