using UnityEngine;

namespace Bomberman
{
    [CreateAssetMenu(menuName = "Bomberman/Power Ups/Bomb Control")]
    public sealed class BombControlPowerUpEffect : PowerUpEffect
    {
        #region Public Methods

        public override void Apply(Player player, int amount)
        {
            player.EnableBombControl();
        }

        #endregion
    }
}
