using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Applies one upgrade to the player that collects it.
    /// </summary>
    public sealed class PowerUp : BaseObject
    {
        #region Inspector Fields

        [Header("Upgrade")]
        [Tooltip("The upgrade applied when a player collects this power-up.")]
        [SerializeField] private PowerUpEffect powerUpEffect;

        [Tooltip("The strength of the upgrade.")]
        [SerializeField, Min(1)] private int amount = 1;

        #endregion

        #region Unity Messages

        private void Update()
        {
            UpdateBaseObjectMovement();
        }

        #endregion

        #region Public Methods

        public void Initialize(Tilemap worldTilemap, Tilemap crateTilemap)
        {
            InitializeBaseObject(worldTilemap, crateTilemap);
        }

        public void Collect(Player player)
        {
            powerUpEffect.Apply(player, amount);
            Destroy(gameObject);
        }

        public void DestroyByExplosion()
        {
            Destroy(gameObject);
        }

        #endregion
    }
}
