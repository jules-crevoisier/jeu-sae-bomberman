using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    [System.Serializable]
    public struct WeightedPowerUp
    {
        #region Inspector Fields

        [Tooltip("The power-up prefab that can be selected.")]
        [SerializeField] private PowerUp powerUpPrefab;

        [Tooltip("Relative percentage weight used when choosing this power-up.")]
        [SerializeField, Range(0f, 100f)] private float spawnPercentage;

        #endregion

        #region Properties

        public PowerUp PowerUpPrefab => powerUpPrefab;

        public float SpawnPercentage => spawnPercentage;

        #endregion
    }

    /// <summary>
    /// Owns game-wide random spawning rules.
    /// </summary>
    public sealed class GameManager : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Power Ups")]
        [Tooltip("Chance that destroying a crate creates a power-up.")]
        [SerializeField, Range(0f, 1f)] private float powerUpSpawnChance = 0.3f;

        [Tooltip("The possible power-ups that can spawn from destroyed crates, with relative spawn percentages.")]
        [SerializeField] private WeightedPowerUp[] weightedPowerUps;

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

            PowerUp powerUpPrefab = GetRandomPowerUpPrefab();
            spawnPosition.z = powerUpSpawnZPosition;
            PowerUp powerUp = Instantiate(powerUpPrefab, spawnPosition, Quaternion.identity);
            powerUp.Initialize(worldTilemap, crateTilemap);
        }

        #endregion

        #region Power Up Selection

        private PowerUp GetRandomPowerUpPrefab()
        {
            float totalSpawnPercentage = 0f;

            foreach (WeightedPowerUp weightedPowerUp in weightedPowerUps)
            {
                totalSpawnPercentage += weightedPowerUp.SpawnPercentage;
            }

            float randomPercentage = Random.Range(0f, totalSpawnPercentage);
            float currentPercentage = 0f;

            foreach (WeightedPowerUp weightedPowerUp in weightedPowerUps)
            {
                currentPercentage += weightedPowerUp.SpawnPercentage;

                if (randomPercentage <= currentPercentage)
                {
                    return weightedPowerUp.PowerUpPrefab;
                }
            }

            return weightedPowerUps[weightedPowerUps.Length - 1].PowerUpPrefab;
        }

        #endregion
    }
}
