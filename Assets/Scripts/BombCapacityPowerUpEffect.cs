using UnityEngine;

namespace Bomberman
{
    [CreateAssetMenu(menuName = "Bomberman/Power Ups/Bomb Capacity")]
    public sealed class BombCapacityPowerUpEffect : PowerUpEffect
    {
        #region Public Methods

        public override void Apply(Player player, int amount)
        {
            player.AddBombCapacity(amount);
        }

        #endregion
    }
}
