using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Shared grid logic for gameplay objects that live on the Bomberman tilemap.
    /// </summary>
    public abstract class BaseObject : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Base Object Movement")]
        [Tooltip("The time, in seconds, needed to move across one tile when moved by object logic.")]
        [SerializeField, Min(0.01f)] private float objectMoveDuration = 0.15f;

        [Tooltip("When enabled, this object cannot be pushed onto a bomb cell.")]
        [SerializeField] private bool isBlockedByBombs = true;

        [Header("Base Object Tilemaps")]
        [Tooltip("The Tilemap containing ground and indestructible solid blocks.")]
        [SerializeField] protected Tilemap collisionTilemap;

        [Tooltip("The Tilemap containing destructible crates.")]
        [SerializeField] protected Tilemap crateTilemap;

        #endregion

        #region Private Fields

        private bool isObjectMoving;
        private bool shouldContinueObjectMovement;
        private float objectMoveElapsedTime;
        private Vector3 objectMoveStartPosition;
        private Vector3 objectMoveTargetPosition;
        private Vector3Int objectMoveDirection;
        private Vector3Int objectMoveTargetCell;

        #endregion

        #region Properties

        protected bool IsObjectMoving => isObjectMoving;

        #endregion

        #region Public Methods

        public void InitializeBaseObject(Tilemap objectCollisionTilemap, Tilemap objectCrateTilemap)
        {
            collisionTilemap = objectCollisionTilemap;
            crateTilemap = objectCrateTilemap;
        }

        public bool IsOnCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            return GetGridCell(tilemap) == cellPosition;
        }

        public virtual Vector3Int GetGridCell(Tilemap tilemap)
        {
            if (isObjectMoving)
            {
                return tilemap.WorldToCell(objectMoveTargetPosition);
            }

            return tilemap.WorldToCell(transform.position);
        }

        public void SnapToCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            Vector3 snappedPosition = tilemap.GetCellCenterWorld(cellPosition);
            snappedPosition.z = transform.position.z;
            transform.position = snappedPosition;
            isObjectMoving = false;
        }

        public void TeleportToCell(Vector3Int cellPosition, Tilemap tilemap, Vector3Int direction = default, bool keepMoving = false)
        {
            SnapToCell(cellPosition, tilemap);
            if (keepMoving) TryStartObjectMovement(direction, true);
        }

        #endregion

        #region Protected Methods

        protected void UpdateBaseObjectMovement()
        {
            if (isObjectMoving)
            {
                UpdateObjectMovement();
                return;
            }

            TryStartConveyorMovement();
        }

        protected bool TryStartObjectMovement(Vector3Int movementDirection, bool shouldContinueMovement)
        {
            Vector3Int currentCell = GetGridCell(collisionTilemap);
            Vector3Int targetCell = currentCell + movementDirection;

            if (IsCellBlocked(targetCell))
            {
                return false;
            }

            objectMoveStartPosition = GetCellCenterPosition(currentCell);
            objectMoveTargetPosition = GetCellCenterPosition(targetCell);
            objectMoveTargetCell = targetCell;
            objectMoveDirection = movementDirection;
            objectMoveElapsedTime = 0f;
            shouldContinueObjectMovement = shouldContinueMovement;
            isObjectMoving = true;

            return true;
        }

        protected bool IsCellBlocked(Vector3Int cellPosition)
        {
            if (collisionTilemap.GetColliderType(cellPosition) != Tile.ColliderType.None)
            {
                return true;
            }

            if (crateTilemap.HasTile(cellPosition))
            {
                return true;
            }

            return isBlockedByBombs && TryGetBombAtCell(cellPosition, out _);
        }

        protected bool TryGetBombAtCell(Vector3Int cellPosition, out Bomb foundBomb)
        {
            Bomb[] bombs = FindObjectsByType<Bomb>(FindObjectsSortMode.None);

            foreach (Bomb bomb in bombs)
            {
                if (bomb.transform != transform && bomb.IsOnCell(cellPosition, collisionTilemap))
                {
                    foundBomb = bomb;
                    return true;
                }
            }

            foundBomb = null;
            return false;
        }

        protected Vector3 GetCellCenterPosition(Vector3Int cellPosition)
        {
            Vector3 cellCenterPosition = collisionTilemap.GetCellCenterWorld(cellPosition);
            cellCenterPosition.z = transform.position.z;
            return cellCenterPosition;
        }

        #endregion

        #region Movement

        private void TryStartConveyorMovement()
        {
            Vector3Int currentCell = GetGridCell(collisionTilemap);

            if (ConveyorBelt.TryGetAtCell(currentCell, collisionTilemap, out ConveyorBelt conveyorBelt))
            {
                TryStartObjectMovement(conveyorBelt.CellDirection, false);
            }
        }

        private void UpdateObjectMovement()
        {
            objectMoveElapsedTime += Time.deltaTime;

            float progress = Mathf.Clamp01(objectMoveElapsedTime / objectMoveDuration);
            transform.position = Vector3.Lerp(objectMoveStartPosition, objectMoveTargetPosition, progress);

            if (progress < 1f)
            {
                return;
            }

            bool shouldKeepMoving = shouldContinueObjectMovement;
            shouldContinueObjectMovement = false;
            SnapToCell(objectMoveTargetCell, collisionTilemap);

            if (TryHandleObjectArrival(objectMoveTargetCell, objectMoveDirection, shouldKeepMoving))
            {
                return;
            }

            if (shouldKeepMoving && ConveyorBelt.TryGetAtCell(objectMoveTargetCell, collisionTilemap, out _))
            {
                return;
            }

            if (shouldKeepMoving)
            {
                TryStartObjectMovement(objectMoveDirection, true);
            }
        }

        protected virtual bool TryHandleObjectArrival(Vector3Int cell, Vector3Int direction, bool keepMoving) => false;

        #endregion
    }
}
