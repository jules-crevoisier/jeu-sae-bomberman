using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Owns game-wide random spawning rules.
    /// </summary>
    public sealed class GameManager : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Power Ups")]
        [Tooltip("Chance that destroying a crate creates a power-up.")]
        [SerializeField, Range(0f, 1f)] private float powerUpSpawnChance = 0.3f;

        [Tooltip("The possible power-ups that can spawn from destroyed crates.")]
        [SerializeField] private PowerUp[] powerUpPrefabs;

        [Tooltip("The world Z position used when a power-up is created.")]
        [SerializeField] private float powerUpSpawnZPosition;

        [Header("Tilemaps")]
        [Tooltip("The Tilemap containing ground and indestructible solid blocks.")]
        [SerializeField] private Tilemap worldTilemap;

        [Tooltip("The Tilemap containing destructible crates.")]
        [SerializeField] private Tilemap crateTilemap;

        #endregion

        #region Properties

        public static GameManager Instance { get; private set; }

        #endregion

        #region Unity Messages

        private void Awake()
        {
            Instance = this;
        }

        #endregion

        #region Public Methods

        public void TrySpawnPowerUp(Vector3 spawnPosition)
        {
            if (Random.value > powerUpSpawnChance)
            {
                return;
            }

            PowerUp powerUpPrefab = powerUpPrefabs[Random.Range(0, powerUpPrefabs.Length)];
            spawnPosition.z = powerUpSpawnZPosition;
            PowerUp powerUp = Instantiate(powerUpPrefab, spawnPosition, Quaternion.identity);
            powerUp.Initialize(worldTilemap, crateTilemap);
        }

        #endregion
    }
}
