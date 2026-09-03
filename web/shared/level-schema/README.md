# @bomberman/level-schema

JSON contract for custom Bomberman levels. The web editor writes this file; Unity reads `id` + `x` + `y`.

## Format

```json
{
  "version": 1,
  "name": "Arène classique",
  "width": 21,
  "height": 13,
  "cellSize": 1,
  "origin": "bottom-left",
  "objects": [
    { "id": "solid", "x": 0, "y": 0 },
    { "id": "crate", "x": 3, "y": 2 },
    { "id": "spawn_p1", "x": 1, "y": 1 },
    { "id": "conveyor_right", "x": 5, "y": 4 }
  ]
}
```

- Coordinates are integers on the grid.
- `(0, 0)` is the bottom-left cell. `x` goes right, `y` goes up — same as Unity tilemaps.
- World position for a cell: `(x + 0.5, y + 0.5)` if the Grid is centered on cell centers.
- Floor tiles (`id: "floor"` on the ground layer) are omitted unless the editor enables "include floor". Missing cells are walkable `Blocks_Stone`.
- `layer` is optional. Omit it when the object sits on its default layer (`floor` → ground, `solid` → solid, `crate` → crate, objects → objects). Include it when a tile is swapped, e.g. wood as floor: `{ "id": "crate", "x": 4, "y": 2, "layer": "ground" }`. Unity can ignore `layer` and still spawn from `id`.
- Power-ups are **not** placed in the editor. Unity should spawn them at random when a crate is destroyed, like the current GameManager.

## IDs

| id | Visuel Unity | Rôle par défaut |
|---|---|---|
| `floor` | `Blocks_Stone` (pierre) | Fond |
| `solid` | `Blocks_Solid` (mur) | Solides |
| `crate` | `Blocks_Wood` (bois) | Caisses |
| `spawn_p1` | Prefab `BomberRat_P1` | Objets |
| `spawn_p2` | Prefab `BomberRat_P2` | Objets |
| `conveyor_up` / `down` / `left` / `right` | Prefab `ConveyorBelt` + direction | Objets |

Quand `layer` est présent, Unity doit placer le **visuel** `id` sur la tilemap du calque (ex. `crate` + `layer: "ground"` → bois sur le sol, case praticable). Sans `layer`, utiliser le rôle par défaut ci-dessus.

Grid sizes: petite `16×8`, moyenne `21×13`, grande `26×18`.
