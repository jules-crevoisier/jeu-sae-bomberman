using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Moves the player one grid cell at a time using the Horizontal and Vertical input axes.
    /// </summary>
    public sealed class Player : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Grid Movement")]
        [Tooltip("The size of one tile in world units. Use 1 when the sprite Pixels Per Unit value is 16.")]
        [SerializeField, Min(0.01f)] private float tileSize = 1f;

        [Tooltip("The time, in seconds, needed to move across one tile.")]
        [SerializeField, Min(0.01f)] private float moveDuration = 0.15f;

        [Tooltip("Minimum axis value required to start moving.")]
        [SerializeField, Range(0.01f, 1f)] private float inputThreshold = 0.5f;

        [Header("Movement Hop")]
        [Tooltip("The upward height of each move. Use 0.125 for two pixels at 16 Pixels Per Unit.")]
        [SerializeField, Min(0f)] private float hopHeight = 0.125f;

        [Header("Input Axes")]
        [SerializeField] private string horizontalAxisName = "Horizontal";
        [SerializeField] private string verticalAxisName = "Vertical";

        [SerializeField] private string bombSpawnAxisName = "P1_B1";

        [Header("Bombs")]
        [Tooltip("The bomb object created when the bomb action is pressed.")]
        [SerializeField] private GameObject bombPrefab;

        [Tooltip("The world Z position used when a bomb is created.")]
        [SerializeField] private float bombSpawnZPosition;

        [Tooltip("The number of bombs available when the game starts.")]
        [SerializeField, Min(0)] private int startingBombCount = 1;

        [Header("State")]
        [SerializeField] private Animator animator;

        [Header("Collision")]
        [Tooltip("The Tilemap used to determine whether the next grid cell is blocked.")]
        [SerializeField] private Tilemap collisionTilemap;

        [Tooltip("The Tilemap containing destructible crates.")]
        [SerializeField] private Tilemap crateTilemap;

        [Header("Wall Bonk")]
        [Tooltip("The distance moved into a blocked cell. Use 0.125 for two pixels at 16 Pixels Per Unit.")]
        [SerializeField, Min(0.01f)] private float bonkDistance = 0.125f;

        [Tooltip("The total time, in seconds, of the move-into-wall and return animation.")]
        [SerializeField, Min(0.01f)] private float bonkDuration = 0.1f;

        #endregion

        #region Private Fields

        private bool isMoving;
        private bool isBonking;
        private bool isStunned;
        private bool hasBombPlacementCell;
        private float bonkElapsedTime;
        private float moveElapsedTime;
        private float stunDuration;
        private float stunElapsedTime;
        private int availableBombCount;
        private Vector3 bonkStartPosition;
        private Vector3 bonkTargetPosition;
        private Vector3 moveStartPosition;
        private Vector3 moveTargetPosition;
        private Vector3Int lastBombPlacementCell;

        #endregion

        #region Unity Messages

        private void Awake()
        {
            availableBombCount = startingBombCount;
            animator.SetBool("isDead", false);
        }

        private void Update()
        {
            if (isStunned)
            {
                UpdateStun();
                return;
            }

            TryPlaceBomb();

            if (isMoving)
            {
                UpdateMovement();
                return;
            }

            if (isBonking)
            {
                UpdateBonk();
                return;
            }

            TryStartMovement();
        }

        #endregion

        #region Movement

        private void TryStartMovement()
        {
            Vector2 inputDirection = GetInputDirection();

            if (inputDirection == Vector2.zero)
            {
                return;
            }

            moveStartPosition = transform.position;
            moveTargetPosition = moveStartPosition + (Vector3)(inputDirection * tileSize);

            if (IsCellBlocked(moveTargetPosition))
            {
                StartBonk(inputDirection);
                return;
            }

            moveElapsedTime = 0f;
            isMoving = true;
        }

        private void UpdateMovement()
        {
            moveElapsedTime += Time.deltaTime;

            float progress = Mathf.Clamp01(moveElapsedTime / moveDuration);
            float easedProgress = EaseOutQuadratic(progress);
            Vector3 movementPosition = Vector3.Lerp(moveStartPosition, moveTargetPosition, easedProgress);
            transform.position = movementPosition + (Vector3.up * GetHopOffset(progress));

            if (progress < 1f)
            {
                return;
            }

            transform.position = moveTargetPosition;
            isMoving = false;
        }

        private void StartBonk(Vector2 inputDirection)
        {
            bonkStartPosition = transform.position;
            bonkTargetPosition = bonkStartPosition + (Vector3)(inputDirection * bonkDistance);
            bonkElapsedTime = 0f;
            isBonking = true;
        }

        private void UpdateBonk()
        {
            bonkElapsedTime += Time.deltaTime;

            float progress = Mathf.Clamp01(bonkElapsedTime / bonkDuration);
            float bonkProgress = Mathf.Sin(progress * Mathf.PI);
            transform.position = Vector3.Lerp(bonkStartPosition, bonkTargetPosition, bonkProgress);

            if (progress < 1f)
            {
                return;
            }

            transform.position = bonkStartPosition;
            isBonking = false;
        }

        private Vector2 GetInputDirection()
        {
            float horizontalInput = Input.GetAxisRaw(horizontalAxisName);
            float verticalInput = Input.GetAxisRaw(verticalAxisName);

            if (Mathf.Abs(horizontalInput) >= inputThreshold)
            {
                return new Vector2(Mathf.Sign(horizontalInput), 0f);
            }

            if (Mathf.Abs(verticalInput) >= inputThreshold)
            {
                return new Vector2(0f, Mathf.Sign(verticalInput));
            }

            return Vector2.zero;
        }

        private bool IsCellBlocked(Vector3 worldPosition)
        {
            Vector3Int worldCellPosition = collisionTilemap.WorldToCell(worldPosition);

            if (collisionTilemap.GetColliderType(worldCellPosition) != Tile.ColliderType.None)
            {
                return true;
            }

            return crateTilemap.HasTile(crateTilemap.WorldToCell(worldPosition));
        }

        private void TryPlaceBomb()
        {
            if (!Input.GetButton(bombSpawnAxisName))
            {
                hasBombPlacementCell = false;
                return;
            }

            Vector3Int bombPlacementCell = GetBombPlacementCell();

            if (hasBombPlacementCell && bombPlacementCell == lastBombPlacementCell)
            {
                return;
            }

            if (availableBombCount <= 0)
            {
                return;
            }

            Bomb placedBomb = Instantiate(bombPrefab, GetBombSpawnPosition(bombPlacementCell), Quaternion.identity).GetComponent<Bomb>();
            placedBomb.Initialize(this, collisionTilemap, crateTilemap);
            availableBombCount--;
            lastBombPlacementCell = bombPlacementCell;
            hasBombPlacementCell = true;
        }

        /// <summary>
        /// Restores one available bomb after one of this player's bombs has detonated.
        /// </summary>
        public void RestoreBomb()
        {
            availableBombCount++;
        }

        /// <summary>
        /// Stops the player for the specified duration and updates the Animator's isDead parameter.
        /// </summary>
        public void Stun(float duration)
        {
            transform.position = GetGridPosition();
            isMoving = false;
            isBonking = false;
            isStunned = true;
            stunDuration = duration;
            stunElapsedTime = 0f;
            animator.SetBool("isDead", true);
        }

        /// <summary>
        /// Gets the player's logical cell, including while a movement animation is in progress.
        /// </summary>
        public Vector3Int GetGridCell(Tilemap tilemap)
        {
            return tilemap.WorldToCell(GetGridPosition());
        }

        private Vector3Int GetBombPlacementCell()
        {
            Vector3 gridPosition = isMoving ? moveTargetPosition : GetGridPosition();
            return collisionTilemap.WorldToCell(gridPosition);
        }

        private Vector3 GetBombSpawnPosition(Vector3Int cellPosition)
        {
            Vector3 bombSpawnPosition = collisionTilemap.GetCellCenterWorld(cellPosition);
            bombSpawnPosition.z = bombSpawnZPosition;
            return bombSpawnPosition;
        }

        private void UpdateStun()
        {
            stunElapsedTime += Time.deltaTime;

            if (stunElapsedTime < stunDuration)
            {
                return;
            }

            isStunned = false;
            animator.SetBool("isDead", false);
        }

        private Vector3 GetGridPosition()
        {
            if (isMoving)
            {
                return moveStartPosition;
            }

            return isBonking ? bonkStartPosition : transform.position;
        }

        private static float EaseOutQuadratic(float progress)
        {
            return 1f - ((1f - progress) * (1f - progress));
        }

        private float GetHopOffset(float progress)
        {
            return Mathf.Sin(progress * Mathf.PI) * hopHeight;
        }

        #endregion
    }
}
