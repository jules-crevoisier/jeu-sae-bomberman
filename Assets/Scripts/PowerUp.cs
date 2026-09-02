using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Applies one upgrade to the player that collects it.
    /// </summary>
    public sealed class PowerUp : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Upgrade")]
        [Tooltip("The upgrade applied when a player collects this power-up.")]
        [SerializeField] private PowerUpEffect powerUpEffect;

        [Tooltip("The strength of the upgrade.")]
        [SerializeField, Min(1)] private int amount = 1;

        [Header("Conveyor")]
        [Tooltip("Moves this power-up when it is standing on a conveyor belt.")]
        [SerializeField] private ConveyorMover conveyorMover;

        #endregion

        #region Public Methods

        public void Initialize(Tilemap worldTilemap, Tilemap crateTilemap)
        {
            conveyorMover.Initialize(worldTilemap, crateTilemap);
        }

        public bool IsOnCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            return conveyorMover.IsOnCell(cellPosition, tilemap);
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
