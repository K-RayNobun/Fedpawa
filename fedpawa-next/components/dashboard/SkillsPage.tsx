// ==========================================================
// FEDPAWA — Dashboard Skills Page (vague D)
// Page de gestion des skills avec formulaire et lane selector
// Le sélecteur de lane est stocké en localStorage et filtre
// toutes les requêtes API du dashboard automatiquement
// ==========================================================

"use client";

import { useEffect } from "react";
import { useSkills, LaneSelector, SkillsForm } from "@/components/skills/SkillsProvider";
import { useToast } from "@/components/dashboard/UI";
import { fpLayout, fpSection, fpSettingsBlock, fpButton } from "@/lib/dashboard-format";
import Link from "next/link";

export default function DashboardSkillsPage() {
  const {
    skills,
    loading,
    error,
    lanes,
    selectedLane,
    setSelectedLane,
    refreshSkills,
    toggleSkill,
    saveSkill,
    setLane,
  } = useSkills();
  const { toast } = useToast();

  // Charger les skills au montage
  useEffect(() => {
    void refreshSkills();
  }, [refreshSkills]);

  if (loading) {
    return (
      <fpSection title="Gestion des Skills">
        <fpSettingsBlock>
          <p>Chargement des skills…</p>
        </fpSettingsBlock>
      </fpSection>
    );
  }

  if (error) {
    return (
      <fpSection title="Gestion des Skills">
        <fpSettingsBlock>
          <p className="fp-settings-error" role="alert">
            {error}
          </p>
        </fpSettingsBlock>
      </fpSection>
    );
  }

  return (
    <fpLayout>
      <fpSection title="Gestion des Skills">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Colonne gauche : Liste des skills */}
          <div>
            <h3 className="fp-settings-h3">Skills actuelles</h3>
            {skills.length === 0 ? (
              <p className="fp-settings-muted">Aucune skill chargée.</p>
            ) : (
              <ul className="space-y-3">
                {skills.map((skill) => (
                  <li key={skill.id} className="fp-settings-row pb-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs text-zinc-400 ml-auto">
                        Lane: {skill.lane || "tout"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {skill.description || "Pas de description"}
                    </p>
                    <p className="text-xs">
                      Priorité: {skill.priority || "medium"} | Tags:{" "}
                      {skill.tags?.length > 0
                        ? skill.tags.join(", ")
                        : "Aucun"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Colonne droite : Formulaire + Sélecteur de lane */}
          <div>
            <LaneSelector
              selectedLane={selectedLane}
              lanes={lanes}
              onChange={(lane: string) => setLane(lane)}
            />
            
            <hr className="my-4 border-zinc-700" />
            
            <SkillsForm
              onSave={(skill) => {
                toast("Skill ajoutée avec succès", "success");
                void refreshSkills();
              }}
              onCancel={() => {}}
            />
          </div>
        </div>
      </fpSection>
    </fpLayout>
  );
}
