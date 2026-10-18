# PROTOCOLE DES LANES FEDPAWA
À lire par TOUT agent (session principale) ou sub-agent avant de travailler sur une lane.

## Vue d'ensemble
- Le tableau vit sur disque : `state/board.json` (état de chaque lane) + `state/lanes/<ID>.md` (journal append-only par lane).
- CLI : `python3 /root/Fedpawa/state/lane.py <commande>` (aucune dépendance).
- Le contexte projet compartimenté vit dans `state/PROJECT.md` — une nouvelle session le lit + `lane.py status` et sait TOUT sans relire la base de code.
- Les procédures détaillées et pièges vivent dans la skill `fedpawa` (references/). Ce fichier ne décrit que la mécanique des lanes.

## Cycle de vie d'une lane
```
backlog  --claim-->  in_progress  --done-->  done
                        |    ^-------log (chaque avancée)------^
                        +--fail--> failed  (journal = position d'arrêt exacte)
```

## Pour l'orchestrateur (session principale)
1. **Créer** : `python3 state/lane.py new --title "..." --priority P0|P1|P2|P3 --mandate "..." --ctx /chemin/du/contexte.md` → imprime l'ID. Le contexte long (environnement, API, comptes, pièges) s'écrit dans un fichier passé via `--ctx`, JAMAIS inline dans le payload de délégation (piège delegate_task : les gros payloads JSON inline explosent en sous-tâches).
2. **Déléguer** : N lanes = **UN SEUL appel delegate_task** avec N entrées tasks[]. Contexte de chaque enfant : « Lis /root/Fedpawa/state/PROTOCOL.md en entier, puis ta lane /root/Fedpawa/state/lanes/<ID>.md. Travaille selon le protocole. »
3. **Surveiller** : `lane.py status` à chaque nouveau tour — une lane `in_progress` sans mise à jour depuis > stale-min est signalée [STALE] : lire son journal (`lane.py show <ID>`) pour voir où elle s'est arrêtée, puis steer/stop/re-dispatcher avec « reprends depuis la dernière entrée du journal ».
4. **Vérifier avant de rapporter** : le résultat d'un sub-agent n'est pas un fait. `git diff` + `php -l`/`node --check` + mini-E2E ciblé par lane (détail dans la skill fedpawa, section « Lanes par sub-agents — vérification obligatoire »).
5. **Rapporter chaque lane dès sa fin** à l'utilisateur — jamais de résumé global différé.
6. **Fermer** : quand une lane change l'état durable du projet (fix déployé, faille corrigée), mettre à jour la section correspondante de `state/PROJECT.md` avant de marquer done.

## Pour un sub-agent exécutant une lane
1. Première action : `python3 /root/Fedpawa/state/lane.py claim <ID> --agent <ton-nom>`.
2. **Journaliser CHAQUE avancée** (toutes les ~5 minutes max, et à chaque fichier touché / test joué / constat clé) :
   `python3 /root/Fedpawa/state/lane.py log <ID> "ce que tu viens de faire" --artifact /chemin/delivre`
   Un log est une ligne de sauvetage : si tu crashes, c'est CE QUI DIT où tu t'es arrêté.
3. Les livrables sont des **FICHIERS sur disque** (rapports .md/.json, screenshots), posés au fil de l'eau — JAMAIS uniquement dans ta réponse finale (elle peut être tronquée). Chaque fichier posé = un `log --artifact`.
4. Fin normale : `python3 /root/Fedpawa/state/lane.py done <ID> --summary "..." --report /chemin/du/rapport` puis un résumé final COURT (<600 caractères).
5. Blocage ou crash imminent : `python3 /root/Fedpawa/state/lane.py fail <ID> --reason "position exacte: dernière commande, dernier fichier, erreur"` — ne jamais disparaître silencieusement.
6. Ne modifier le code QUE si le mandat de la lane l'autorise explicitement (mode audit = lecture seule stricte). Purger ses données de test si le mandat le demande.
7. Interdits : créer des arborescences parallèles hors /root/Fedpawa, réécrire des fichiers entiers au lieu de patcher, committer, toucher aux autres lanes.

## Reprise après crash (règle d'or)
Un sub-agent crashé n'est pas une lane perdue : son journal contient sa position d'arrêt. La reprise = re-dispatch avec :
« Lis state/lanes/<ID>.md jusqu'à la fin. Reprends depuis la dernière entrée du journal. Ne rejoue pas ce qui est déjà fait/artefacts déjà posés. »
Avant de re-dispatcher : inspecter le transcript (cache/delegation/live/deleg_*/task-0.log) et les artefacts réellement présents — un statut failed peut cacher un travail accompli, un completed un travail fantôme.

## Anti-règles (ce qui fait échouer un dispatch)
- Payload de contexte volumineux inline dans tasks[] → explodes en N sous-tâches. Passer par des fichiers.
- Bind statique des handlers sur des éléments injectés dynamiquement → utiliser la délégation d'événements (le pattern db-tabs.js).
- Littéraux entre quotes qui ressemblent à des secrets → le scrubber les remplace par *** à l'écriture ; construire par concaténation et vérifier avec od -c si un script échoue bizarrement.
- Regex contenant des séquences d'échappement fragiles dans les fichiers générés → vérifier avec node --check / python -m py_compile avant de lancer.
