using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    public enum ConveyorDirection
    {
        Right,
        Left,
        Up,
        Down
    }

    /// <summary>
    /// Pushes players standing on the same grid cell in a fixed direction.
    /// </summary>
    public sealed class ConveyorBelt : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Movement")]
        [Tooltip("The direction this conveyor pushes the player.")]
        [SerializeField] private ConveyorDirection conveyorDirection;

        #endregion

        #region Private Fields

        private static readonly List<ConveyorBelt> ConveyorBelts = new List<ConveyorBelt>();

        #endregion

        #region Properties

        public Vector2 Direction => conveyorDirection switch
        {
            ConveyorDirection.Right => Vector2.right,
            ConveyorDirection.Left => Vector2.left,
            ConveyorDirection.Up => Vector2.up,
            ConveyorDirection.Down => Vector2.down,
            _ => Vector2.zero
        };

        public Vector3Int CellDirection => conveyorDirection switch
        {
            ConveyorDirection.Right => Vector3Int.right,
            ConveyorDirection.Left => Vector3Int.left,
            ConveyorDirection.Up => Vector3Int.up,
            ConveyorDirection.Down => Vector3Int.down,
            _ => Vector3Int.zero
        };

        #endregion

        #region Unity Messages

        private void OnEnable()
        {
            ConveyorBelts.Add(this);
        }

        private void OnDisable()
        {
            ConveyorBelts.Remove(this);
        }

        #endregion

        #region Public Methods

        public static bool TryGetAtCell(Vector3Int cellPosition, Tilemap tilemap, out ConveyorBelt conveyorBelt)
        {
            foreach (ConveyorBelt registeredConveyorBelt in ConveyorBelts)
            {
                if (registeredConveyorBelt.IsOnCell(cellPosition, tilemap))
                {
                    conveyorBelt = registeredConveyorBelt;
                    return true;
                }
            }

            conveyorBelt = null;
            return false;
        }

        #endregion

        #region Private Methods

        private bool IsOnCell(Vector3Int cellPosition, Tilemap tilemap)
        {
            return tilemap.WorldToCell(transform.position) == cellPosition;
        }

        #endregion
    }
}
