using UnityEngine;

namespace Bomberman
{
    [CreateAssetMenu(menuName = "Bomberman/Power Ups/Spike Bomb")]
    public sealed class SpikeBombPowerUpEffect : PowerUpEffect
    {
        #region Public Methods

        public override void Apply(Player player, int amount)
        {
            player.EnableSpikeBomb();
        }

        #endregion
    }
}
