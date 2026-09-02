using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Moves an object one grid cell at a time when it is standing on a conveyor belt.
    /// </summary>
    public sealed class ConveyorMover : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Movement")]
        [Tooltip("The time, in seconds, needed to move across one conveyor tile.")]
        [SerializeField, Min(0.01f)] private float moveDuration = 0.15f;

        [Header("Blocking")]
        [Tooltip("When enabled, this object cannot be pushed onto a bomb cell.")]
        [SerializeField] private bool isBlockedByBombs = true;

        [Header("Tilemaps")]
        [Tooltip("The Tilemap containing ground and indestructible solid blocks.")]
        [SerializeField] private Tilemap worldTilemap;

        [Tooltip("The Tilemap containing destructible crates.")]
        [SerializeField] private Tilemap crateTilemap;

        #endregion

        #region Private Fields

        private bool isMoving;
        private float moveElapsedTime;
        private Vector3 moveStartPosition;
        private Vector3 moveTargetPosition;
        private Vector3Int moveTargetCell;

        #endregion

        #region Unity Messages

        private void Update()
        {
            if (isMoving)
            {
                UpdateMovement();
                return;
            }

            TryStartConveyorMovement();
        }

        #endregion

        #region Public Methods

        public void Initialize(Tilemap movementTilemap, Tilemap destructibleTilemap)
        {
            worldTilemap = movementTilemap;
            crateTilemap = destructibleTilemap;
        }

        public bool IsOnCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            return GetGridCell(tilemap) == cellPosition;
        }

        public Vector3Int GetGridCell(Tilemap tilemap)
        {
            if (isMoving)
            {
                return tilemap.WorldToCell(moveTargetPosition);
            }

            return tilemap.WorldToCell(transform.position);
        }

        public void SnapToCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            Vector3 snappedPosition = tilemap.GetCellCenterWorld(cellPosition);
            snappedPosition.z = transform.position.z;
            transform.position = snappedPosition;
            isMoving = false;
        }

        #endregion

        #region Conveyor Movement

        private void TryStartConveyorMovement()
        {
            Vector3Int currentCell = GetGridCell(worldTilemap);

            if (!ConveyorBelt.TryGetAtCell(currentCell, worldTilemap, out ConveyorBelt conveyorBelt))
            {
                return;
            }

            Vector3Int targetCell = currentCell + conveyorBelt.CellDirection;

            if (IsCellBlocked(targetCell))
            {
                return;
            }

            moveStartPosition = GetCellCenterPosition(currentCell);
            moveTargetPosition = GetCellCenterPosition(targetCell);
            moveTargetCell = targetCell;
            moveElapsedTime = 0f;
            isMoving = true;
        }

        private void UpdateMovement()
        {
            moveElapsedTime += Time.deltaTime;

            float progress = Mathf.Clamp01(moveElapsedTime / moveDuration);
            float easedProgress = EaseOutQuadratic(progress);
            transform.position = Vector3.Lerp(moveStartPosition, moveTargetPosition, easedProgress);

            if (progress < 1f)
            {
                return;
            }

            SnapToCell(moveTargetCell, worldTilemap);
        }

        #endregion

        #region Blocking

        private bool IsCellBlocked(Vector3Int cellPosition)
        {
            if (worldTilemap.GetColliderType(cellPosition) != Tile.ColliderType.None)
            {
                return true;
            }

            if (crateTilemap.HasTile(cellPosition))
            {
                return true;
            }

            return isBlockedByBombs && IsBombOnCell(cellPosition);
        }

        private bool IsBombOnCell(Vector3Int cellPosition)
        {
            Bomb[] bombs = FindObjectsByType<Bomb>(FindObjectsSortMode.None);

            foreach (Bomb bomb in bombs)
            {
                if (bomb.transform != transform && bomb.IsOnCell(cellPosition, worldTilemap))
                {
                    return true;
                }
            }

            return false;
        }

        #endregion

        #region Position

        private Vector3 GetCellCenterPosition(Vector3Int cellPosition)
        {
            Vector3 cellCenterPosition = worldTilemap.GetCellCenterWorld(cellPosition);
            cellCenterPosition.z = transform.position.z;
            return cellCenterPosition;
        }

        private static float EaseOutQuadratic(float progress)
        {
            return 1f - ((1f - progress) * (1f - progress));
        }

        #endregion
    }
}
