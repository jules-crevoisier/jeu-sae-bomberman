using UnityEngine;

namespace Bomberman
{
    /// <summary>
    /// Applies a short positional shake to the gameplay camera.
    /// </summary>
    public sealed class GameCamera : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Shake")]
        [Tooltip("The maximum positional offset applied while the camera is shaking.")]
        [SerializeField, Min(0f)] private float shakeAmplitude = 0.18f;

        [Tooltip("The time, in seconds, that a single explosion shake lasts.")]
        [SerializeField, Min(0.01f)] private float shakeDuration = 0.14f;

        #endregion

        #region Private Fields

        private Vector3 basePosition;
        private float shakeTimeRemaining;

        #endregion

        #region Properties

        public static GameCamera Instance { get; private set; }

        #endregion

        #region Unity Messages

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }

            Instance = this;
            basePosition = transform.localPosition;
        }

        private void LateUpdate()
        {
            if (shakeTimeRemaining <= 0f)
            {
                if (transform.localPosition != basePosition)
                {
                    transform.localPosition = basePosition;
                }

                return;
            }

            shakeTimeRemaining = Mathf.Max(0f, shakeTimeRemaining - Time.deltaTime);
            float intensity = shakeAmplitude * (shakeTimeRemaining / shakeDuration);
            Vector2 offset = Random.insideUnitCircle * intensity;
            transform.localPosition = basePosition + new Vector3(offset.x, offset.y, 0f);
        }

        private void OnDisable()
        {
            if (Instance == this)
            {
                transform.localPosition = basePosition;
            }
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                transform.localPosition = basePosition;
                Instance = null;
            }
        }

        #endregion

        #region Public Methods

        public void ShakeFromExplosion()
        {
            shakeTimeRemaining = Mathf.Min(shakeTimeRemaining + shakeDuration, shakeDuration * 2f);
        }

        #endregion
    }
}
