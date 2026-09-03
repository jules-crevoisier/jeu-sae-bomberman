using System.Collections;
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
        [SerializeField] private SpriteRenderer centerExplosionRenderer;

        [Tooltip("The sprite stretched from left to right.")]
        [SerializeField] private SpriteRenderer horizontalExplosionRenderer;

        [Tooltip("The sprite stretched from bottom to top.")]
        [SerializeField] private SpriteRenderer verticalExplosionRenderer;

        [Header("Lifetime")]
        [Tooltip("The time, in seconds, before the explosion object is destroyed.")]
        [SerializeField, Min(0.01f)] private float displayDuration = 0.25f;

        [Tooltip("How quickly the visible blast expands across its final range.")]
        [SerializeField, Min(0.01f)] private float propagationDuration = 0.1f;

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
            AnimateExpansion(cellSize);
        }

        public void InitializeLine(Vector3Int direction, int length, Vector3 cellSize)
        {
            bool horizontal = direction.x != 0;
            horizontalExplosionRenderer.enabled = horizontal;
            verticalExplosionRenderer.enabled = !horizontal;

            foreach (SpriteRenderer spriteRenderer in GetComponentsInChildren<SpriteRenderer>())
            {
                if (spriteRenderer != horizontalExplosionRenderer && spriteRenderer != verticalExplosionRenderer)
                {
                    spriteRenderer.enabled = false;
                }
            }

            SpriteRenderer renderer = horizontal ? horizontalExplosionRenderer : verticalExplosionRenderer;
            float cellLength = horizontal ? cellSize.x : cellSize.y;
            if (length == 0)
            {
                renderer.enabled = false;
                return;
            }

            renderer.size = new Vector2(length * cellLength, horizontal ? cellSize.y : cellSize.x);
            float offset = (length + 1) * cellLength * 0.5f * (horizontal ? direction.x : direction.y);
            renderer.transform.localPosition = horizontal
                ? new Vector3(offset, 0f, renderer.transform.localPosition.z)
                : new Vector3(0f, offset, renderer.transform.localPosition.z);
            AnimateExpansion(cellSize);
        }

        private void AnimateExpansion(Vector3 cellSize)
        {
            StartCoroutine(ExpandBlast(horizontalExplosionRenderer, cellSize));
            StartCoroutine(ExpandBlast(verticalExplosionRenderer, cellSize));
        }

        private IEnumerator ExpandBlast(SpriteRenderer renderer, Vector3 cellSize)
        {
            if (!renderer.enabled)
            {
                yield break;
            }

            Vector2 targetSize = renderer.size;
            Vector3 targetPosition = renderer.transform.localPosition;
            Vector2 startSize = new Vector2(cellSize.x, cellSize.y);
            renderer.size = startSize;
            renderer.transform.localPosition = new Vector3(0f, 0f, targetPosition.z);

            for (float elapsed = 0f; elapsed < propagationDuration; elapsed += Time.deltaTime)
            {
                float progress = Mathf.Clamp01(elapsed / propagationDuration);
                float easedProgress = 1f - Mathf.Pow(1f - progress, 3f);
                renderer.size = Vector2.Lerp(startSize, targetSize, easedProgress);
                renderer.transform.localPosition = Vector3.Lerp(new Vector3(0f, 0f, targetPosition.z), targetPosition, easedProgress);
                yield return null;
            }

            renderer.size = targetSize;
            renderer.transform.localPosition = targetPosition;
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
