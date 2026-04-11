# Plan d'implementation - Issue #3622

## Contexte

Probleme utilisateur: sur certains reseaux, Discord est bloque, ce qui empeche la connexion au compte principal. Le magic link actuel peut creer un compte separe, donc sans transfert des stats/skins du compte Discord.

Objectif: permettre une connexion non dependante de Discord au meme compte utilisateur.

## Portee

- Hors scope MVP: systeme complet username/password.
- Scope MVP: liaison d'email verifie au compte existant + connexion email vers compte unifie.

## Plan en 3 PRs

## PR A - API: lier un email verifie a un compte existant

### Objectif

Permettre a un compte connecte via Discord d'ajouter un email de secours.

### Endpoints proposes

- `POST /auth/link/email/start`: envoie un lien de verification a l'email.
- `POST /auth/link/email/confirm`: confirme et lie l'email au compte authentifie (token dans le body JSON `{ token }`).

### Regles

- Un email ne peut etre lie qu'a un seul compte.
- Si email deja lie a un autre compte: erreur de conflit claire.
- Journaliser les evenements de liaison (audit).

### Critere d'acceptation

- Un utilisateur connecte via Discord peut lier un email.
- L'email lie devient un moyen de reconnexion sans Discord.

## PR B - API: login email vers compte unifie

### Objectif

Eviter la creation involontaire d'un compte separe lors de la connexion par email.

### Changement

- Le flow magic link cherche d'abord un compte deja lie a l'email.
- Si trouve: ouvrir la session de ce compte.
- Sinon: creer un compte uniquement si l'inscription email est autorisee.

### Critere d'acceptation

- Un meme utilisateur retrouve le meme profil (stats/skins) via Discord ou email lie.

## PR C - Frontend OpenFrontIO: UX de liaison et login alternatif

### Objectif

Rendre la liaison email visible et explicite dans l'interface.

### Changements cibles

- Ajouter dans l'account modal une section "Ajouter un email de secours".
- Distinguer clairement:
  - magic link de connexion,
  - magic link de liaison de compte.
- Mettre a jour les textes pour expliquer que l'email lie reconnecte au meme profil.

### Tests

- Test unitaire de la logique de compte lie (sur la surface modifiee).
- Test manuel E2E:
  - login Discord,
  - liaison email,
  - logout,
  - login email,
  - verification du meme profil.

### Critere d'acceptation

- Le parcours de liaison est compréhensible.
- La reconnexion email reouvre le compte historique.

## Decisions produit a valider avant implementation lourde

- Autoriser ou non la creation de compte par email si aucun compte lie n'existe.
- Politique en cas de collision email (message utilisateur + recovery).
- Priorite password/passkey (recommande hors scope MVP).

## Risques et mitigation

- Risque: confusion entre "connexion" et "liaison".
  - Mitigation: labels UI explicites + messages de confirmation.
- Risque: conflits d'email.
  - Mitigation: erreurs metier dediees et parcours de resolution documente.
- Risque: regression auth.
  - Mitigation: tests cibles + rollout progressif.

## Definition of Done

- Endpoints de liaison email disponibles et testes.
- Login email unifie sur le compte existant.
- UX frontend mise a jour avec textes clairs.
- Tests executes et resultat documente dans la PR.
