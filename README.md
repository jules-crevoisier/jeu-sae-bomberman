# jeu-sae-bomberman

Unity Bomberman. Tout le site web (éditeur de niveaux) vit dans **`web/`**, séparé du projet Unity (`Assets/`, `Packages/`, `ProjectSettings/`).

## Éditeur de niveaux

```powershell
cd web
npm install
npm run dev:editor
```

Ouvre `http://localhost:5173`.

### Calques

- **Fond** — sol (walkable)
- **Solides** — murs qui ne bougent pas
- **Caisses** — blocs secondaires
- **Objets** — spawns et tapis

Sur Fond / Solides / Caisses, tu choisis librement le **matériau** (Pierre, Mur, Bois). Exemple : bois sur le fond = sol en planches. Le JSON ajoute alors `"layer": "ground"`.

Icônes UI : Lucide. Tuiles : sprites Unity (`Blocks.png`, etc.).

Format JSON : `web/shared/level-schema/README.md`.

## Déploiement Dokploy (Docker)

Le Dockerfile est dans `web/`. Unity n’est **pas** inclus dans l’image.

### Dans Dokploy

1. Nouvelle application → source = ce repo Git
2. Build type : **Dockerfile**
3. **Docker Context Path** : `web` (ou `./web`)
4. **Dockerfile Path** : `Dockerfile`
5. Port exposé : **80**
6. Domaine + HTTPS via Dokploy

Sans ça, le build prendrait tout le repo Unity inutilement.

### Test local

```powershell
cd web
docker compose up --build
```

Ouvre `http://localhost:8080`.