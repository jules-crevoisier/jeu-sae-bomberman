using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;
using UnityEngine.UI;

namespace Bomberman
{
    /// <summary>
    /// Moves the player one grid cell at a time using the Horizontal and Vertical input axes.
    /// </summary>
    public sealed class Player : BaseObject
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

        [SerializeField] private string bombDetonationAxisName = "P1_B2";

        [Header("Bombs")]
        [Tooltip("The bomb object created when the bomb action is pressed.")]
        [SerializeField] private GameObject bombPrefab;

        [Tooltip("The bomb object created after collecting the spike bomb power-up.")]
        [SerializeField] private GameObject spikeBombPrefab;

        [Tooltip("The world Z position used when a bomb is created.")]
        [SerializeField] private float bombSpawnZPosition;

        [Tooltip("The number of bombs available when the game starts.")]
        [SerializeField, Min(0)] private int startingBombCount = 1;

        [Tooltip("The fire range used by bombs when the game starts.")]
        [SerializeField, Min(1)] private int startingFireRange = 1;

        [Header("State")]
        [SerializeField] private Animator animator;

        [SerializeField] private SpriteRenderer playerRenderer;

        [Header("Dead Flicker")]
        [Tooltip("The time, in seconds, between each player sprite enable/disable toggle while dead.")]
        [SerializeField, Min(0.01f)] private float deadFlickerInterval = 0.2f;

        [Header("Lives")]
        [Tooltip("The number of hits this player can take before being eliminated.")]
        [SerializeField, Min(1)] private int startingLifeCount = 3;

        [Tooltip("The UI container whose child images represent this player's remaining lives.")]
        [SerializeField] private Transform heartContainer;

        [Tooltip("The sprite displayed for each remaining life.")]
        [SerializeField] private Sprite filledHeartSprite;

        [Tooltip("The sprite displayed for each lost life.")]
        [SerializeField] private Sprite emptyHeartSprite;

        [Header("Wall Bonk")]
        [Tooltip("The distance moved into a blocked cell. Use 0.125 for two pixels at 16 Pixels Per Unit.")]
        [SerializeField, Min(0.01f)] private float bonkDistance = 0.125f;

        [Tooltip("The total time, in seconds, of the move-into-wall and return animation.")]
        [SerializeField, Min(0.01f)] private float bonkDuration = 0.1f;

        #endregion

        #region Private Fields

        private bool isMoving;
        private bool isSliding;
        private bool isSlidingMove;
        private bool isBonking;
        private bool isEliminated;
        private bool isStunned;
        private bool hasBombPlacementCell;
        private bool hasBombControlPower;
        private bool hasKickPower;
        private bool hasSpikeBombPower;
        private float bonkElapsedTime;
        private float deadFlickerElapsedTime;
        private float moveElapsedTime;
        private float stunDuration;
        private float stunElapsedTime;
        private int availableBombCount;
        private int currentFireRange;
        private int remainingLifeCount;
        private int totalBombCount;
        private readonly List<Bomb> bombQueue = new List<Bomb>();
        private Vector3 bonkStartPosition;
        private Vector3 bonkTargetPosition;
        private Vector3 moveStartPosition;
        private Vector3 moveTargetPosition;
        private Vector3Int lastBombPlacementCell;
        private Vector2 slideDirection;
        private Vector2 lastInputDirection;

        #endregion

        #region Unity Messages

        private void Awake()
        {
            totalBombCount = startingBombCount;
            availableBombCount = totalBombCount;
            currentFireRange = startingFireRange;
            remainingLifeCount = startingLifeCount;
            RefreshLifeDisplay();
            animator.SetBool("isDead", false);
            playerRenderer.enabled = true;
        }

        private void Update()
        {
            if (isEliminated)
            {
                return;
            }

            if (isStunned)
            {
                UpdateStun();
                return;
            }

            TryPlaceBomb();
            TryDetonateControlledBomb();

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

            TryCollectPowerUp();
            if (Teleporter.TryTeleport(this, collisionTilemap))
            {
                return;
            }
            if (TryStartConveyorMovement())
            {
                return;
            }
            if (isSliding && IsIceCell(GetGridCell(collisionTilemap)))
            {
                if (!TryStartMovement(slideDirection, false, false))
                {
                    isSliding = false;
                }
                return;
            }
            isSliding = false;
            if (TryStartMovement())
            {
                return;
            }
        }

        #endregion

        #region Movement

        private bool TryStartMovement()
        {
            Vector2 inputDirection = GetInputDirection();

            if (inputDirection == Vector2.zero)
            {
                return false;
            }

            lastInputDirection = inputDirection;
            TryStartMovement(inputDirection, true);
            return true;
        }

        private bool TryStartMovement(Vector2 movementDirection, bool shouldBonkWhenBlocked, bool shouldHop = true)
        {
            Vector3 targetPosition = transform.position + (Vector3)(movementDirection * tileSize);

            if (IsPlayerCellBlocked(movementDirection, targetPosition))
            {
                if (shouldBonkWhenBlocked)
                {
                    StartBonk(movementDirection);
                }

                return false;
            }

            moveStartPosition = transform.position;
            moveTargetPosition = targetPosition;
            moveElapsedTime = 0f;
            isMoving = true;
            isSlidingMove = !shouldHop;

            return true;
        }

        private void UpdateMovement()
        {
            moveElapsedTime += Time.deltaTime;

            float progress = Mathf.Clamp01(moveElapsedTime / moveDuration);
            float movementProgress = isSlidingMove ? progress : EaseOutQuadratic(progress);
            Vector3 movementPosition = Vector3.Lerp(moveStartPosition, moveTargetPosition, movementProgress);
            transform.position = isSlidingMove ? movementPosition : movementPosition + (Vector3.up * GetHopOffset(progress));

            if (progress < 1f)
            {
                return;
            }

            transform.position = moveTargetPosition;
            isMoving = false;
            isSlidingMove = false;
            slideDirection = (moveTargetPosition - moveStartPosition).normalized;
            if (slideDirection == Vector2.zero)
            {
                slideDirection = lastInputDirection;
            }
            isSliding = IsIceCell(collisionTilemap.WorldToCell(moveTargetPosition));
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

        private bool IsPlayerCellBlocked(Vector2 movementDirection, Vector3 worldPosition)
        {
            Vector3Int worldCellPosition = collisionTilemap.WorldToCell(worldPosition);

            if (collisionTilemap.GetColliderType(worldCellPosition) != Tile.ColliderType.None)
            {
                return true;
            }

            if (crateTilemap.HasTile(crateTilemap.WorldToCell(worldPosition)))
            {
                return true;
            }

            if (!TryGetBombAtCell(worldCellPosition, out Bomb bomb))
            {
                return false;
            }

            if (!hasKickPower)
            {
                return true;
            }

            return !bomb.TryKick(GetCellDirection(movementDirection));
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

            Bomb placedBomb = Instantiate(GetCurrentBombPrefab(), GetBombSpawnPosition(bombPlacementCell), Quaternion.identity).GetComponent<Bomb>();
            placedBomb.Initialize(this, collisionTilemap, crateTilemap, currentFireRange, hasBombControlPower);

            bombQueue.Add(placedBomb);
            availableBombCount--;
            lastBombPlacementCell = bombPlacementCell;
            hasBombPlacementCell = true;
        }

        /// <summary>
        /// Restores one available bomb after one of this player's bombs has detonated.
        /// </summary>
        public void RestoreBomb()
        {
            availableBombCount = Mathf.Min(availableBombCount + 1, totalBombCount);
        }

        public void ReleaseBomb(Bomb bomb)
        {
            bombQueue.Remove(bomb);
            RestoreBomb();
        }

        /// <summary>
        /// Removes one life, then briefly stuns the player unless that was the final life.
        /// </summary>
        public void TakeHit(float stunDuration)
        {
            if (isEliminated || isStunned)
            {
                return;
            }

            remainingLifeCount = Mathf.Max(remainingLifeCount - 1, 0);
            RefreshLifeDisplay();

            if (remainingLifeCount == 0)
            {
                Eliminate();
                return;
            }

            transform.position = GetGridPosition();
            isMoving = false;
            isBonking = false;
            isStunned = true;
            deadFlickerElapsedTime = 0f;
            this.stunDuration = stunDuration;
            stunElapsedTime = 0f;
            animator.SetBool("isDead", true);
        }

        /// <summary>
        /// Gets the player's logical cell, including while a movement animation is in progress.
        /// </summary>
        public override Vector3Int GetGridCell(Tilemap tilemap)
        {
            return tilemap.WorldToCell(GetGridPosition());
        }

        public void TeleportToCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            Vector3 position = tilemap.GetCellCenterWorld(cellPosition);
            position.z = transform.position.z;
            transform.position = position;
            isMoving = false;
            isBonking = false;
            isSliding = false;
            isSlidingMove = false;
        }

        private bool IsIceCell(Vector3Int cellPosition)
        {
            TileBase tile = collisionTilemap.GetTile(cellPosition);
            if (tile is Tile tileAsset && tileAsset.sprite != null)
            {
                return tileAsset.sprite.name == "Blocks_Ice";
            }

            return tile != null && tile.name == "Blocks_Ice";
        }

        private Vector3Int GetBombPlacementCell()
        {
            Vector3 gridPosition = isMoving ? moveTargetPosition : GetGridPosition();
            return collisionTilemap.WorldToCell(gridPosition);
        }

        private void TryCollectPowerUp()
        {
            Vector3Int playerCellPosition = GetGridCell(collisionTilemap);
            PowerUp[] powerUps = FindObjectsByType<PowerUp>(FindObjectsSortMode.None);

            foreach (PowerUp powerUp in powerUps)
            {
                if (powerUp.IsOnCell(playerCellPosition, collisionTilemap))
                {
                    powerUp.Collect(this);
                    return;
                }
            }
        }

        private bool TryStartConveyorMovement()
        {
            if (isMoving || isBonking || isStunned)
            {
                return false;
            }

            Vector3Int playerCellPosition = GetGridCell(collisionTilemap);

            if (ConveyorBelt.TryGetAtCell(playerCellPosition, collisionTilemap, out ConveyorBelt conveyorBelt))
            {
                return TryStartMovement(conveyorBelt.Direction, false);
            }

            return false;
        }

        public void AddFireRange(int amount)
        {
            currentFireRange += amount;
        }

        public void AddBombCapacity(int amount)
        {
            totalBombCount += amount;
            availableBombCount += amount;
        }

        public void EnableSpikeBomb()
        {
            hasSpikeBombPower = true;
        }

        public void EnableBombControl()
        {
            hasBombControlPower = true;

            foreach (Bomb bomb in bombQueue)
            {
                if (bomb != null && !bomb.HasDetonated)
                {
                    bomb.DisableFuseTimer();
                }
            }
        }

        public void EnableKick()
        {
            hasKickPower = true;
        }

        private GameObject GetCurrentBombPrefab()
        {
            return hasSpikeBombPower ? spikeBombPrefab : bombPrefab;
        }

        private void TryDetonateControlledBomb()
        {
            if (!hasBombControlPower || !Input.GetButtonDown(bombDetonationAxisName))
            {
                return;
            }

            while (bombQueue.Count > 0)
            {
                Bomb bomb = bombQueue[0];
                bombQueue.RemoveAt(0);

                if (bomb != null && !bomb.HasDetonated)
                {
                    bomb.Detonate();
                    return;
                }
            }
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
            UpdateDeadFlicker();

            if (stunElapsedTime < stunDuration)
            {
                return;
            }

            isStunned = false;
            StopDeadFlicker();
            animator.SetBool("isDead", false);
        }

        private void UpdateDeadFlicker()
        {
            deadFlickerElapsedTime += Time.deltaTime;

            if (deadFlickerElapsedTime < deadFlickerInterval)
            {
                return;
            }

            deadFlickerElapsedTime = 0f;
            playerRenderer.enabled = !playerRenderer.enabled;
        }

        private void StopDeadFlicker()
        {
            deadFlickerElapsedTime = 0f;
            playerRenderer.enabled = true;
        }

        private void Eliminate()
        {
            transform.position = GetGridPosition();
            isMoving = false;
            isBonking = false;
            isStunned = false;
            isEliminated = true;
            animator.SetBool("isDead", true);
            playerRenderer.enabled = false;
        }

        private void RefreshLifeDisplay()
        {
            if (heartContainer == null)
            {
                return;
            }

            for (int index = 0; index < heartContainer.childCount; index++)
            {
                Image heartImage = heartContainer.GetChild(index).GetComponent<Image>();

                if (heartImage != null)
                {
                    heartImage.sprite = index < remainingLifeCount ? filledHeartSprite : emptyHeartSprite;
                }
            }
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

        private static Vector3Int GetCellDirection(Vector2 movementDirection)
        {
            return new Vector3Int(Mathf.RoundToInt(movementDirection.x), Mathf.RoundToInt(movementDirection.y), 0);
        }

        #endregion
    }
}
