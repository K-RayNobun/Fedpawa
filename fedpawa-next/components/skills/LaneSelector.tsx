// ==========================================================
// FEDPAWA — LaneSelector (vague D)
// Composant permettant de sélectionner une lane dans le dashboard skills
// ==========================================================

"use client";

import React from "react";
import { useSkills } from "./SkillsProvider";

export interface LaneSelectorProps {
  onChange: (lane: string) => void;
  selectedLane: string;
  lanes: string[];
}

export default function LaneSelector({ onChange, selectedLane, lanes }: LaneSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">
        Lane
      </label>
      <select
        className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
        value={selectedLane}
        onChange={(e) => onChange(e.target.value)}
      >
        {lanes.map((lane) => (
          <option key={lane} value={lane}>
            {lane === "all" ? "Toutes lanes" : "Lane " + lane}
          </option>
        ))}
      </select>
    </div>
  );
}
