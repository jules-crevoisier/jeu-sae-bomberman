using UnityEngine;

public class MainMenuManager : MonoBehaviour
{
    [SerializeField] private GameObject mainMenuPanel;
    [SerializeField] private GameObject playerSelectionPanel;

    [Header("Play Workflow")]
    [SerializeField] private GameObject mapSelectionPanel;
    [SerializeField] private GameObject officialMapsPanel;
    [SerializeField] private GameObject customMapsPanel;

    [Header("Creator Workflow")]
    [SerializeField] private GameObject creatorPanel;

    void Start()
    {
        OpenMainMenuPanel();
    }

    public void OpenMainMenuPanel()
    {
        mainMenuPanel.SetActive(true);
        playerSelectionPanel.SetActive(false);
        mapSelectionPanel.SetActive(false);
        officialMapsPanel.SetActive(false);
        customMapsPanel.SetActive(false);
        creatorPanel.SetActive(false);
    }

    #region Play Workflow

    public void OpenPlayerSelectionPanel()
    {
        mainMenuPanel.SetActive(false);
        playerSelectionPanel.SetActive(true);
    }

    public void OpenMapSelectionPanel()
    {
        playerSelectionPanel.SetActive(false);
        customMapsPanel.SetActive(false);

        mapSelectionPanel.SetActive(true);
        officialMapsPanel.SetActive(true);
    }

    public void PerformBackAction()
    {
        if (mapSelectionPanel.activeSelf)
        {
            OpenPlayerSelectionPanel();
            return;
        }

        if (playerSelectionPanel.activeSelf || creatorPanel.activeSelf)
            OpenMainMenuPanel();
    }

    #endregion

    #region Creator Workflow

    public void OpenCreatorPanel()
    {
        mainMenuPanel.SetActive(false);
        creatorPanel.SetActive(true);
    }

    #endregion

    #region Quit
    public void QuitApplication()
    {
        Application.Quit();
    }
    #endregion
}
