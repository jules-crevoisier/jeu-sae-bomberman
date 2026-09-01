using UnityEngine;

namespace Bomberman
{
    /// <summary>
    /// Resizes the explosion sprites to match the blast cells, then destroys the object.
    /// </summary>
    public sealed class Explosion : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Shape")]
        [Tooltip("The sprite stretched from left to right.")]
        [SerializeField] private SpriteRenderer horizontalExplosionRenderer;

        [Tooltip("The sprite stretched from bottom to top.")]
        [SerializeField] private SpriteRenderer verticalExplosionRenderer;

        [Header("Lifetime")]
        [Tooltip("The time, in seconds, before the explosion object is destroyed.")]
        [SerializeField, Min(0.01f)] private float displayDuration = 0.25f;

        #endregion

        #region Unity Messages

        private void Awake()
        {
            Destroy(gameObject, displayDuration);
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Stretches and offsets the horizontal and vertical sprites to match the blast range.
        /// </summary>
        public void Initialize(int leftLength, int rightLength, int downLength, int upLength, Vector3 cellSize)
        {
            SetHorizontalExplosion(leftLength, rightLength, cellSize);
            SetVerticalExplosion(downLength, upLength, cellSize);
        }

        #endregion

        #region Sizing

        private void SetHorizontalExplosion(int leftLength, int rightLength, Vector3 cellSize)
        {
            int tileLength = leftLength + rightLength + 1;
            horizontalExplosionRenderer.size = new Vector2(tileLength * cellSize.x, cellSize.y);
            horizontalExplosionRenderer.transform.localPosition = new Vector3(
                (rightLength - leftLength) * cellSize.x * 0.5f,
                0f,
                horizontalExplosionRenderer.transform.localPosition.z);
        }

        private void SetVerticalExplosion(int downLength, int upLength, Vector3 cellSize)
        {
            int tileLength = downLength + upLength + 1;
            verticalExplosionRenderer.size = new Vector2(tileLength * cellSize.y, cellSize.x);
            verticalExplosionRenderer.transform.localPosition = new Vector3(
                0f,
                (upLength - downLength) * cellSize.y * 0.5f,
                verticalExplosionRenderer.transform.localPosition.z);
        }

        #endregion
    }
}
