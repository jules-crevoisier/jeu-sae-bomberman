using UnityEngine;

namespace Bomberman
{
    [CreateAssetMenu(menuName = "Bomberman/Power Ups/Kick")]
    public sealed class KickPowerUpEffect : PowerUpEffect
    {
        #region Public Methods

        public override void Apply(Player player, int amount)
        {
            player.EnableKick();
        }

        #endregion
    }
}
