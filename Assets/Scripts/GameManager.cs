using UnityEngine;

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
            Instantiate(powerUpPrefab, spawnPosition, Quaternion.identity);
        }

        #endregion
    }
}
