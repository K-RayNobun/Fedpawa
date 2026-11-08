// ==========================================================
// FEDPAWA — SkillsForm (vague D)
// Formulaire d'ajout/modification de skills via l'API
// ==========================================================

"use client";

import React, { useState } from "react";
import { useSkills } from "./SkillsProvider";
import { useToast } from "@/components/dashboard/UI";

export interface SkillsFormProps {
  onSave: (skill: import("./SkillsProvider").Skill) => void;
  onCancel: () => void;
}

export default function SkillsForm({ onSave, onCancel }: SkillsFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lane, setLane] = useState("all");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState("");
  const [enabled, setEnabled] = useState(true);

  const handleSave = () => {
    const skill = {
      name: name.trim(),
      description: description.trim(),
      lane: lane,
      priority: priority as "low" | "medium" | "high" | "critical",
      tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
      enabled,
    };
    onSave(skill);
    toast("Skill ajoutée avec succès", "success");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Nom
        </label>
        <input
          className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la skill"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Lane
          </label>
          <select
            className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
            value={lane}
            onChange={(e) => setLane(e.target.value)}
          >
            <option value="all">Toutes lanes</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Priorité
          </label>
          <select
            className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Tags (séparés par des virgules)
        </label>
        <input
          className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-zinc-700">
          Activée
        </label>
        <select
          className="mt-1 block w-full rounded border-zinc-300 bg-zinc-50 py-2 px-3 placeholder-zinc-400 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500"
          value={enabled ? "true" : "false"}
          onChange={(e) => setEnabled(e.target.value === "true")}
        >
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-zinc-600 text-white px-4 py-2 rounded hover:bg-zinc-500"
        >
          Enregistrer
        </button>
        <button
          onClick={onCancel}
          className="bg-zinc-200 text-zinc-800 px-4 py-2 rounded hover:bg-zinc-300"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
