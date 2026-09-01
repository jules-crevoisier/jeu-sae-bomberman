using UnityEngine;

namespace Bomberman
{
    [CreateAssetMenu(menuName = "Bomberman/Power Ups/Fire Range")]
    public sealed class FireRangePowerUpEffect : PowerUpEffect
    {
        #region Public Methods

        public override void Apply(Player player, int amount)
        {
            player.AddFireRange(amount);
        }

        #endregion
    }
}
