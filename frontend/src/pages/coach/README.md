# Espace Coach — Phase 5

## User stories couvertes

| ID | Story | Route |
|----|-------|-------|
| P5-1 | Dashboard coach (semaine, inscrits, présence, commentaires) | `/coach/dashboard` |
| P5-2 | Vue multi-clubs coach indépendant | `/coach/dashboard` (filtre clubs) |
| P5-3 | Suivi progression membres | `/coach/progression` |
| P5-4 | Profil public coach | `/coach/profile` → annuaire `/coach/independants/:id` |
| P5-5 | Commentaires suivi post-séance | `/coach/planning` |
| P4-4 | Message équipe (coach) | `/coach/messages` |

## Architecture

- `types/coach.ts` — modèles métier
- `data/coach/mockData.ts` — données de démo
- `components/coach/` — composants réutilisables
- Pages sous `pages/coach/`

## Prochaines étapes

1. Endpoints backend (sessions coach, progression, profil public, messages)
2. Connexion API + remplacement des mocks
3. Permissions coach club vs coach indépendant

