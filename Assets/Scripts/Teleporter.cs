using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    [ExecuteAlways]
    public sealed class Teleporter : MonoBehaviour
    {
        public enum TeleporterColor { Red, Purple, Blue, Cyan, Green, Orange }
        [SerializeField] private TeleporterColor teleporterColor;
        [SerializeField] private SpriteRenderer teleporterRenderer;
        private static readonly Dictionary<int, Teleporter> ExitLocks = new Dictionary<int, Teleporter>();
        private static readonly List<Teleporter> Teleporters = new List<Teleporter>();

        private void Awake() => RefreshVisual();
        private void Start() => RefreshAllVisuals();
        private void OnValidate() => RefreshAllVisuals();

        private void OnEnable()
        {
            if (!Teleporters.Contains(this))
            {
                Teleporters.Add(this);
            }

            RefreshAllVisuals();
        }

        private void OnDisable()
        {
            Teleporters.Remove(this);
            RefreshAllVisuals();
        }

        public void SetColor(TeleporterColor color) { teleporterColor = color; RefreshAllVisuals(); }

        public static Teleporter[] GetAllTeleporters()
        {
            Teleporters.RemoveAll(item => item == null);
            return Teleporters.ToArray();
        }

        public static void RefreshAllVisuals()
        {
            foreach (Teleporter item in GetAllTeleporters())
            {
                item.RefreshVisual();
            }
        }

        public static bool TryTeleport(Player player, Tilemap map) => TryTeleport(player.GetInstanceID(), player.GetGridCell(map), map, cell => player.TeleportToCell(cell, map));
        public static bool TryTeleport(Bomb bomb, Tilemap map, Vector3Int direction = default, bool keepMoving = false) => TryTeleport(bomb.GetInstanceID(), bomb.GetGridCell(map), map, cell => bomb.TeleportToCell(cell, map, direction, keepMoving));
        private static bool TryTeleport(int id, Vector3Int cell, Tilemap map, System.Action<Vector3Int> move)
        {
            if (ExitLocks.TryGetValue(id, out Teleporter locked)) { if (locked == null || locked.GetCell(map) != cell) ExitLocks.Remove(id); else return false; }
            foreach (Teleporter entrance in GetAllTeleporters())
                if (entrance.GetCell(map) == cell && entrance.TryGetPair(out Teleporter exit)) { ExitLocks[id] = exit; move(exit.GetCell(map)); return true; }
            return false;
        }
        public static bool TryGetDestinationAtCell(Vector3Int cell, Tilemap map, out Vector3Int destination)
        {
            foreach (Teleporter entrance in GetAllTeleporters()) if (entrance.GetCell(map) == cell && entrance.TryGetPair(out Teleporter exit)) { destination = exit.GetCell(map); return true; }
            destination = default; return false;
        }
        private bool TryGetPair(out Teleporter pair)
        {
            List<Teleporter> matches = new List<Teleporter>();
            foreach (Teleporter item in GetAllTeleporters()) if (item.teleporterColor == teleporterColor) matches.Add(item);
            pair = matches.Count == 2 ? (matches[0] == this ? matches[1] : matches[0]) : null; return pair != null;
        }
        private Vector3Int GetCell(Tilemap map) => map.WorldToCell(transform.position);
        private void RefreshVisual()
        {
            if (teleporterRenderer == null) teleporterRenderer = GetComponent<SpriteRenderer>();
            if (teleporterRenderer == null) return;
            if (!TryGetPair(out _)) { teleporterRenderer.color = Color.white; return; }
            teleporterRenderer.color = teleporterColor switch { TeleporterColor.Red => Color.red, TeleporterColor.Purple => new Color(.7f, .25f, 1f), TeleporterColor.Blue => Color.blue, TeleporterColor.Cyan => Color.cyan, TeleporterColor.Green => Color.green, _ => new Color(1f, .5f, 0f) };
        }
    }
}
