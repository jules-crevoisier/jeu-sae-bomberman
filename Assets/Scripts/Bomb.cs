using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Detonates after a delay and propagates an orthogonal, Bomberman-style blast through the grid.
    /// </summary>
    public sealed class Bomb : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Explosion")]
        [Tooltip("The time, in seconds, before the bomb detonates.")]
        [SerializeField, Min(0.01f)] private float fuseDuration = 2f;

        [Tooltip("The number of cells reached in each cardinal direction.")]
        [SerializeField, Min(1)] private int explosionRange = 1;

        [Tooltip("The time, in seconds, that players remain stunned after being hit by the blast.")]
        [SerializeField, Min(0.01f)] private float playerStunDuration = 5f;

        [Tooltip("The visual effect created when this bomb detonates.")]
        [SerializeField] private Explosion explosionPrefab;

        [Header("Tilemaps")]
        [Tooltip("The Tilemap containing ground and indestructible solid blocks.")]
        [SerializeField] private Tilemap worldTilemap;

        [Tooltip("The Tilemap containing destructible crates.")]
        [SerializeField] private Tilemap crateTilemap;

        #endregion

        #region Private Fields

        private static readonly Vector3Int[] ExplosionDirections =
        {
            Vector3Int.left,
            Vector3Int.right,
            Vector3Int.down,
            Vector3Int.up
        };

        private bool hasDetonated;
        private Player owner;

        #endregion

        #region Unity Messages

        private void Start()
        {
            Invoke(nameof(Detonate), fuseDuration);
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Sets the player whose available bomb count is restored after detonation.
        /// </summary>
        public void Initialize(Player bombOwner, Tilemap bombWorldTilemap, Tilemap bombCrateTilemap)
        {
            owner = bombOwner;
            worldTilemap = bombWorldTilemap;
            crateTilemap = bombCrateTilemap;
        }

        #endregion

        #region Explosion

        private void Detonate()
        {
            if (hasDetonated)
            {
                return;
            }

            hasDetonated = true;
            Vector3Int originCell = worldTilemap.WorldToCell(transform.position);
            ApplyExplosionToCell(originCell);

            int leftLength = PropagateExplosion(originCell, ExplosionDirections[0]);
            int rightLength = PropagateExplosion(originCell, ExplosionDirections[1]);
            int downLength = PropagateExplosion(originCell, ExplosionDirections[2]);
            int upLength = PropagateExplosion(originCell, ExplosionDirections[3]);

            Explosion explosion = Instantiate(explosionPrefab, worldTilemap.GetCellCenterWorld(originCell), Quaternion.identity);
            explosion.Initialize(leftLength, rightLength, downLength, upLength, worldTilemap.cellSize);

            owner.RestoreBomb();
            Destroy(gameObject);
        }

        private int PropagateExplosion(Vector3Int originCell, Vector3Int direction)
        {
            for (int distance = 1; distance <= explosionRange; distance++)
            {
                Vector3Int cellPosition = originCell + (direction * distance);

                if (IsSolidCell(cellPosition))
                {
                    return distance - 1;
                }

                if (DestroyCrate(cellPosition))
                {
                    return distance;
                }

                if (ApplyExplosionToCell(cellPosition))
                {
                    return distance;
                }
            }

            return explosionRange;
        }

        private bool IsSolidCell(Vector3Int cellPosition)
        {
            return worldTilemap.GetColliderType(cellPosition) != Tile.ColliderType.None;
        }

        private bool DestroyCrate(Vector3Int cellPosition)
        {
            if (!crateTilemap.HasTile(cellPosition))
            {
                return false;
            }

            crateTilemap.SetTile(cellPosition, null);
            return true;
        }

        private bool ApplyExplosionToCell(Vector3Int cellPosition)
        {
            Player[] players = FindObjectsByType<Player>(FindObjectsSortMode.None);

            foreach (Player player in players)
            {
                if (player.GetGridCell(worldTilemap) == cellPosition)
                {
                    player.Stun(playerStunDuration);
                }
            }

            Bomb[] bombs = FindObjectsByType<Bomb>(FindObjectsSortMode.None);

            foreach (Bomb bomb in bombs)
            {
                if (bomb != this && worldTilemap.WorldToCell(bomb.transform.position) == cellPosition)
                {
                    bomb.Detonate();
                    return true;
                }
            }

            return false;
        }

        #endregion
    }
}
