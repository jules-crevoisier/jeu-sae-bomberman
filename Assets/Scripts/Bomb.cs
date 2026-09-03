using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Detonates after a delay and propagates an orthogonal, Bomberman-style blast through the grid.
    /// </summary>
    public sealed class Bomb : BaseObject
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

        [Tooltip("When enabled, crates are destroyed without stopping the explosion arm.")]
        [SerializeField] private bool burnThroughCrates;

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
        private bool usesFuseTimer = true;

        #endregion

        #region Properties

        public bool HasDetonated => hasDetonated;

        #endregion

        #region Unity Messages

        private void Start()
        {
            if (usesFuseTimer)
            {
                Invoke(nameof(Detonate), fuseDuration);
            }
        }

        private void Update()
        {
            UpdateBaseObjectMovement();
            if (!IsObjectMoving)
            {
                Teleporter.TryTeleport(this, collisionTilemap);
            }
        }

        protected override bool TryHandleObjectArrival(Vector3Int cell, Vector3Int direction, bool keepMoving)
        {
            return Teleporter.TryTeleport(this, collisionTilemap, direction, keepMoving);
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Sets the player whose available bomb count is restored after detonation.
        /// </summary>
        public void Initialize(Player bombOwner, Tilemap bombWorldTilemap, Tilemap bombCrateTilemap, int bombExplosionRange, bool isControlledByOwner)
        {
            owner = bombOwner;
            InitializeBaseObject(bombWorldTilemap, bombCrateTilemap);
            explosionRange = bombExplosionRange;
            usesFuseTimer = !isControlledByOwner;
        }

        public void DisableFuseTimer()
        {
            usesFuseTimer = false;
            CancelInvoke(nameof(Detonate));
        }

        public bool TryKick(Vector3Int kickDirection)
        {
            if (hasDetonated || IsObjectMoving)
            {
                return false;
            }

            return TryStartObjectMovement(kickDirection, true);
        }

        #endregion

        #region Explosion

        public void Detonate()
        {
            if (hasDetonated)
            {
                return;
            }

            hasDetonated = true;
            CancelInvoke(nameof(Detonate));
            Vector3Int originCell = GetGridCell(collisionTilemap);
            SnapToCell(originCell, collisionTilemap);
            Player[] players = FindObjectsByType<Player>(FindObjectsSortMode.None);
            Bomb[] bombs = FindObjectsByType<Bomb>(FindObjectsSortMode.None);
            PowerUp[] powerUps = FindObjectsByType<PowerUp>(FindObjectsSortMode.None);

            ApplyExplosionToCell(originCell, players, bombs, powerUps);

            int leftLength = PropagateExplosion(originCell, ExplosionDirections[0], players, bombs, powerUps);
            int rightLength = PropagateExplosion(originCell, ExplosionDirections[1], players, bombs, powerUps);
            int downLength = PropagateExplosion(originCell, ExplosionDirections[2], players, bombs, powerUps);
            int upLength = PropagateExplosion(originCell, ExplosionDirections[3], players, bombs, powerUps);

            Explosion explosion = Instantiate(explosionPrefab, collisionTilemap.GetCellCenterWorld(originCell), Quaternion.identity);
            explosion.Initialize(leftLength, rightLength, downLength, upLength, collisionTilemap.cellSize);
            GameCamera.Instance?.ShakeFromExplosion();

            owner.ReleaseBomb(this);
            Destroy(gameObject);
        }

        private int PropagateExplosion(Vector3Int originCell, Vector3Int direction, Player[] players, Bomb[] bombs, PowerUp[] powerUps)
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
                    if (!burnThroughCrates)
                    {
                        return distance;
                    }

                    continue;
                }

                if (ApplyExplosionToCell(cellPosition, players, bombs, powerUps))
                {
                    return distance;
                }

                if (Teleporter.TryGetDestinationAtCell(cellPosition, collisionTilemap, out Vector3Int exitCell))
                {
                    PropagateTeleportedExplosion(exitCell, direction, explosionRange - distance, players, bombs, powerUps);
                    return distance;
                }
            }

            return explosionRange;
        }

        private void PropagateTeleportedExplosion(Vector3Int exitCell, Vector3Int direction, int remainingRange, Player[] players, Bomb[] bombs, PowerUp[] powerUps)
        {
            int length = 0;
            for (int distance = 1; distance <= remainingRange; distance++)
            {
                Vector3Int cellPosition = exitCell + (direction * distance);
                if (IsSolidCell(cellPosition)) break;
                length = distance;
                if (DestroyCrate(cellPosition) || ApplyExplosionToCell(cellPosition, players, bombs, powerUps)) break;

                if (Teleporter.TryGetDestinationAtCell(cellPosition, collisionTilemap, out Vector3Int nextExitCell))
                {
                    PropagateTeleportedExplosion(nextExitCell, direction, remainingRange - distance, players, bombs, powerUps);
                    break;
                }
            }

            // The visual spans both portals, while gameplay still starts one cell after the exit.
            Explosion continuation = Instantiate(explosionPrefab, collisionTilemap.GetCellCenterWorld(exitCell - direction), Quaternion.identity);
            continuation.InitializeLine(direction, length + 1, collisionTilemap.cellSize);
        }

        private bool IsSolidCell(Vector3Int cellPosition)
        {
            return collisionTilemap.GetColliderType(cellPosition) != Tile.ColliderType.None;
        }

        private bool DestroyCrate(Vector3Int cellPosition)
        {
            if (!crateTilemap.HasTile(cellPosition))
            {
                return false;
            }

            crateTilemap.SetTile(cellPosition, null);
            GameManager.Instance.TrySpawnPowerUp(crateTilemap.GetCellCenterWorld(cellPosition));
            return true;
        }

        private bool ApplyExplosionToCell(Vector3Int cellPosition, Player[] players, Bomb[] bombs, PowerUp[] powerUps)
        {
            DestroyPowerUps(cellPosition, powerUps);

            foreach (Player player in players)
            {
                if (player != null && player.GetGridCell(collisionTilemap) == cellPosition)
                {
                    player.TakeHit(playerStunDuration);
                }
            }

            foreach (Bomb bomb in bombs)
            {
                if (bomb != null && bomb != this && !bomb.HasDetonated && bomb.IsOnCell(cellPosition, collisionTilemap))
                {
                    bomb.Detonate();
                    return true;
                }
            }

            return false;
        }

        private void DestroyPowerUps(Vector3Int cellPosition, PowerUp[] powerUps)
        {
            foreach (PowerUp powerUp in powerUps)
            {
                if (powerUp != null && powerUp.IsOnCell(cellPosition, collisionTilemap))
                {
                    powerUp.DestroyByExplosion();
                }
            }
        }

        #endregion
    }
}
