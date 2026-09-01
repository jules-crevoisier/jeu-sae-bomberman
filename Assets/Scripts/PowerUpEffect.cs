using UnityEngine;

namespace Bomberman
{
    /// <summary>
    /// Defines how a collected power-up changes a player.
    /// </summary>
    public abstract class PowerUpEffect : ScriptableObject
    {
        #region Public Methods

        public abstract void Apply(Player player, int amount);

        #endregion
    }
}
