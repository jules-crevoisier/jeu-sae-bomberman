using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Bomberman
{
    /// <summary>
    /// Rebuilds the CustomMap scene from a level-editor JSON export.
    /// </summary>
    public sealed class LevelCreator : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Source")]
        [SerializeField] private TextAsset levelJsonAsset;
        [SerializeField, TextArea(12, 40)] private string levelJson;

        [Header("Execution")]
        [SerializeField] private bool generateOnAwake = true;

        [Header("Scene References")]
        [SerializeField] private Tilemap worldTilemap;
        [SerializeField] private Tilemap crateTilemap;
        [SerializeField] private TileBase solidTile;
        [SerializeField] private TileBase floorTile;
        [SerializeField] private TileBase iceTile;
        [SerializeField] private TileBase crateTile;
        [SerializeField] private Transform conveyorContainer;
        [SerializeField] private GameObject conveyorPrefab;
        [SerializeField] private GameObject teleporterPrefab;

        private GameObject teleporterTemplateCache;

        #endregion

        #region Unity Messages

        private void Awake()
        {
            if (generateOnAwake)
            {
                GenerateLevel();
            }
        }

        private void OnDestroy()
        {
            DestroySceneObject(teleporterTemplateCache);
        }

        #endregion

        #region Public Methods

        [ContextMenu("Generate Level")]
        public void GenerateLevel()
        {
            if (!TryResolveReferences())
            {
                Debug.LogError("Level generation failed because the scene references could not be resolved.", this);
                return;
            }

            string json = GetSourceJson();

            if (string.IsNullOrWhiteSpace(json))
            {
                Debug.LogWarning("Level generation skipped because no level JSON is configured.", this);
                return;
            }

            LevelDefinition levelDefinition;

            try
            {
                levelDefinition = JsonUtility.FromJson<LevelDefinition>(json);
            }
            catch (Exception exception)
            {
                Debug.LogError($"Level generation failed while parsing the JSON: {exception.Message}", this);
                return;
            }

            if (!IsValid(levelDefinition))
            {
                Debug.LogError("Level generation failed because the JSON is missing width, height, or objects.", this);
                return;
            }

            GameObject conveyorTemplate = CreateConveyorTemplate();
            GameObject teleporterTemplate = CreateTeleporterTemplate();
            List<PlayerState> playerStates = CapturePlayerStates();
            LevelBuildData buildData = BuildLevelData(levelDefinition);

            if (buildData.hasIce && iceTile == null)
            {
                Debug.LogWarning("The level contains ice, but no ice tile is assigned. Floor will be used instead.", this);
            }

            ClearSceneState(conveyorTemplate, teleporterTemplate);
            RebuildTilemaps(levelDefinition, buildData);
            SpawnConveyors(levelDefinition, buildData, conveyorTemplate);
            SpawnTeleporters(levelDefinition, buildData, teleporterTemplate);
            RepositionPlayers(levelDefinition, buildData, playerStates);

            if (conveyorTemplate != null)
            {
                DestroySceneObject(conveyorTemplate);
            }

        }

        #endregion

        #region Scene Resolution

        private bool TryResolveReferences()
        {
            if (worldTilemap == null)
            {
                worldTilemap = FindTilemap("Tilemap");
            }

            if (crateTilemap == null)
            {
                crateTilemap = FindTilemap("Crate");
            }

            if (worldTilemap == null || crateTilemap == null)
            {
                return false;
            }

            if (solidTile == null || floorTile == null)
            {
                DiscoverWorldTiles();
            }

            if (crateTile == null)
            {
                DiscoverCrateTile();
            }

            if (conveyorContainer == null)
            {
                ConveyorBelt[] conveyors = FindObjectsByType<ConveyorBelt>(FindObjectsSortMode.None);

                if (conveyors.Length > 0 && conveyors[0] != null)
                {
                    conveyorContainer = conveyors[0].transform.parent;
                }

                if (conveyorContainer == null)
                {
                    GameObject hazardContainer = GameObject.Find("Hazard");

                    if (hazardContainer != null)
                    {
                        conveyorContainer = hazardContainer.transform;
                    }
                }

                if (conveyorContainer == null && worldTilemap != null)
                {
                    conveyorContainer = worldTilemap.transform.parent;
                }
            }

            return solidTile != null && floorTile != null && crateTile != null;
        }

        private Tilemap FindTilemap(string tilemapName)
        {
            Tilemap[] tilemaps = FindObjectsByType<Tilemap>(FindObjectsSortMode.None);

            foreach (Tilemap tilemap in tilemaps)
            {
                if (tilemap != null && tilemap.name == tilemapName)
                {
                    return tilemap;
                }
            }

            return null;
        }

        private void DiscoverWorldTiles()
        {
            foreach (Vector3Int cellPosition in worldTilemap.cellBounds.allPositionsWithin)
            {
                TileBase tile = worldTilemap.GetTile(cellPosition);

                if (tile == null)
                {
                    continue;
                }

                if (worldTilemap.GetColliderType(cellPosition) == Tile.ColliderType.None)
                {
                    floorTile ??= tile;
                }
                else
                {
                    solidTile ??= tile;
                }

                if (solidTile != null && floorTile != null)
                {
                    return;
                }
            }
        }

        private void DiscoverCrateTile()
        {
            foreach (Vector3Int cellPosition in crateTilemap.cellBounds.allPositionsWithin)
            {
                crateTile = crateTilemap.GetTile(cellPosition);

                if (crateTile != null)
                {
                    return;
                }
            }
        }

        private string GetSourceJson()
        {
            if (levelJsonAsset != null && !string.IsNullOrWhiteSpace(levelJsonAsset.text))
            {
                return levelJsonAsset.text;
            }

            return levelJson;
        }

        #endregion

        #region Build

        private static bool IsValid(LevelDefinition levelDefinition)
        {
            return levelDefinition != null
                && levelDefinition.width > 0
                && levelDefinition.height > 0
                && levelDefinition.objects != null;
        }

        private LevelBuildData BuildLevelData(LevelDefinition levelDefinition)
        {
            LevelBuildData buildData = new LevelBuildData(levelDefinition.width, levelDefinition.height);
            HashSet<string> unknownObjectIds = new HashSet<string>();

            foreach (LevelObjectDefinition levelObject in levelDefinition.objects)
            {
                string normalizedId = NormalizeToken(levelObject.id);
                int width = Mathf.Max(1, levelObject.w);
                int height = Mathf.Max(1, levelObject.h);

                // The editor compresses adjacent cells into optional w/h rectangles.
                for (int y = levelObject.y; y < levelObject.y + height; y++)
                {
                    for (int x = levelObject.x; x < levelObject.x + width; x++)
                    {
                        if (!IsInsideBounds(x, y, levelDefinition))
                        {
                            continue;
                        }

                        Vector2Int cellPosition = new Vector2Int(x, y);

                        if (TryGetPlayerIndex(normalizedId, out int playerIndex))
                        {
                            buildData.playerSpawnCells[playerIndex] = cellPosition;
                            continue;
                        }

                        if (IsIgnoredObject(normalizedId))
                        {
                            continue;
                        }

                        if (IsConveyorId(normalizedId))
                        {
                            LevelCellData conveyorCell = buildData.cells[cellPosition.x, cellPosition.y];
                            conveyorCell.hasConveyor = true;
                            conveyorCell.conveyorDirection = ParseConveyorDirection(levelObject, normalizedId);
                            buildData.cells[cellPosition.x, cellPosition.y] = conveyorCell;
                            continue;
                        }

                        if (IsTeleporterId(normalizedId))
                        {
                            LevelCellData teleporterCell = buildData.cells[cellPosition.x, cellPosition.y];
                            teleporterCell.hasTeleporter = true;
                            teleporterCell.teleporterColor = ParseTeleporterColor(normalizedId);
                            buildData.cells[cellPosition.x, cellPosition.y] = teleporterCell;
                            continue;
                        }

                        if (!string.IsNullOrWhiteSpace(levelObject.layer))
                        {
                            continue;
                        }

                        switch (normalizedId)
                        {
                            case "solid":
                                buildData.cells[cellPosition.x, cellPosition.y].isSolid = true;
                                buildData.cells[cellPosition.x, cellPosition.y].hasCrate = false;
                                break;

                            case "crate":
                                if (!buildData.cells[cellPosition.x, cellPosition.y].isSolid)
                                {
                                    buildData.cells[cellPosition.x, cellPosition.y].hasCrate = true;
                                }
                                break;

                            case "floor":
                                buildData.cells[cellPosition.x, cellPosition.y].isIce = false;
                                break;

                            case "ice":
                                buildData.cells[cellPosition.x, cellPosition.y].isIce = true;
                                buildData.hasIce = true;
                                break;

                            default:
                                if (unknownObjectIds.Add(normalizedId))
                                {
                                    Debug.LogWarning($"Unsupported level object '{levelObject.id}' was ignored.", this);
                                }
                                break;
                        }
                    }
                }
            }

            return buildData;
        }

        private void RebuildTilemaps(LevelDefinition levelDefinition, LevelBuildData buildData)
        {
            worldTilemap.ClearAllTiles();
            crateTilemap.ClearAllTiles();

            for (int y = 0; y < levelDefinition.height; y++)
            {
                for (int x = 0; x < levelDefinition.width; x++)
                {
                    Vector3Int sceneCell = GetSceneCell(x, y, levelDefinition);
                    LevelCellData cellData = buildData.cells[x, y];

                    TileBase groundTile = cellData.isIce && iceTile != null ? iceTile : floorTile;
                    worldTilemap.SetTile(sceneCell, cellData.isSolid ? solidTile : groundTile);

                    if (cellData.hasCrate && !cellData.isSolid)
                    {
                        crateTilemap.SetTile(sceneCell, crateTile);
                    }
                }
            }

            worldTilemap.CompressBounds();
            crateTilemap.CompressBounds();
        }

        private void SpawnConveyors(LevelDefinition levelDefinition, LevelBuildData buildData, GameObject conveyorTemplate)
        {
            if (conveyorTemplate == null)
            {
                return;
            }

            for (int y = 0; y < levelDefinition.height; y++)
            {
                for (int x = 0; x < levelDefinition.width; x++)
                {
                    LevelCellData cellData = buildData.cells[x, y];

                    if (!cellData.hasConveyor || cellData.isSolid)
                    {
                        continue;
                    }

                    Vector3Int sceneCell = GetSceneCell(x, y, levelDefinition);
                    Vector3 spawnPosition = worldTilemap.GetCellCenterWorld(sceneCell);
                    spawnPosition.z = conveyorTemplate.transform.position.z;

                    GameObject conveyorObject = Instantiate(
                        conveyorTemplate,
                        spawnPosition,
                        GetConveyorRotation(cellData.conveyorDirection),
                        conveyorContainer);

                    conveyorObject.name = conveyorTemplate.name.Replace(" Template", string.Empty);
                    conveyorObject.SetActive(true);

                    ConveyorBelt conveyorBelt = conveyorObject.GetComponent<ConveyorBelt>();

                    if (conveyorBelt != null)
                    {
                        conveyorBelt.SetDirection(cellData.conveyorDirection);
                    }
                }
            }
        }

        private void SpawnTeleporters(LevelDefinition levelDefinition, LevelBuildData buildData, GameObject teleporterTemplate)
        {
            if (teleporterTemplate == null)
            {
                return;
            }

            for (int y = 0; y < levelDefinition.height; y++)
            {
                for (int x = 0; x < levelDefinition.width; x++)
                {
                    LevelCellData cellData = buildData.cells[x, y];

                    if (!cellData.hasTeleporter || cellData.isSolid)
                    {
                        continue;
                    }

                    Vector3Int sceneCell = GetSceneCell(x, y, levelDefinition);
                    Vector3 spawnPosition = worldTilemap.GetCellCenterWorld(sceneCell);
                    spawnPosition.z = teleporterTemplate.transform.position.z;

                    GameObject teleporterObject = Instantiate(
                        teleporterTemplate,
                        spawnPosition,
                        Quaternion.identity,
                        conveyorContainer);

                    teleporterObject.name = teleporterTemplate.name.Replace(" Template", string.Empty);
                    teleporterObject.SetActive(true);

                    Teleporter teleporter = teleporterObject.GetComponent<Teleporter>();

                    if (teleporter != null)
                    {
                        teleporter.SetColor(cellData.teleporterColor);
                    }
                }
            }

            Teleporter.RefreshAllVisuals();
        }

        #endregion

        #region Scene State

        private GameObject CreateConveyorTemplate()
        {
            GameObject templateSource = conveyorPrefab;

            if (templateSource == null)
            {
                ConveyorBelt[] conveyors = FindObjectsByType<ConveyorBelt>(FindObjectsSortMode.None);

                if (conveyors.Length == 0 || conveyors[0] == null)
                {
                    Debug.LogWarning("No conveyor prefab or scene conveyor is configured; conveyor objects were skipped.", this);
                    return null;
                }

                templateSource = conveyors[0].gameObject;
            }

            GameObject conveyorTemplate = Instantiate(templateSource);
            conveyorTemplate.name = $"{templateSource.name} Template";
            conveyorTemplate.hideFlags = HideFlags.HideAndDontSave;
            conveyorTemplate.SetActive(false);
            return conveyorTemplate;
        }

        private GameObject CreateTeleporterTemplate()
        {
            if (teleporterTemplateCache != null)
            {
                return teleporterTemplateCache;
            }

            GameObject templateSource = teleporterPrefab;

            if (templateSource == null)
            {
                Teleporter[] teleporters = Teleporter.GetAllTeleporters();

                if (teleporters.Length == 0 || teleporters[0] == null)
                {
                    Debug.LogWarning("No teleporter prefab or scene teleporter is configured; teleporter objects were skipped.", this);
                    return null;
                }

                templateSource = teleporters[0].gameObject;
            }

            GameObject teleporterTemplate = Instantiate(templateSource);
            teleporterTemplate.name = $"{templateSource.name} Template";
            teleporterTemplate.hideFlags = HideFlags.HideAndDontSave;
            teleporterTemplate.SetActive(false);
            teleporterTemplateCache = teleporterTemplate;
            return teleporterTemplateCache;
        }

        private void ClearSceneState(GameObject conveyorTemplate, GameObject teleporterTemplate)
        {
            ConveyorBelt[] conveyors = FindObjectsByType<ConveyorBelt>(FindObjectsSortMode.None);

            foreach (ConveyorBelt conveyor in conveyors)
            {
                if (conveyor == null || conveyor.gameObject == conveyorTemplate)
                {
                    continue;
                }

                conveyor.gameObject.SetActive(false);
                DestroySceneObject(conveyor.gameObject);
            }

            Teleporter[] teleporters = Teleporter.GetAllTeleporters();

            foreach (Teleporter teleporter in teleporters)
            {
                if (teleporter == null || teleporter.gameObject == teleporterTemplate)
                {
                    continue;
                }

                teleporter.gameObject.SetActive(false);
                DestroySceneObject(teleporter.gameObject);
            }

            Bomb[] bombs = FindObjectsByType<Bomb>(FindObjectsSortMode.None);

            foreach (Bomb bomb in bombs)
            {
                if (bomb != null)
                {
                    DestroySceneObject(bomb.gameObject);
                }
            }

            PowerUp[] powerUps = FindObjectsByType<PowerUp>(FindObjectsSortMode.None);

            foreach (PowerUp powerUp in powerUps)
            {
                if (powerUp != null)
                {
                    DestroySceneObject(powerUp.gameObject);
                }
            }
        }

        private List<PlayerState> CapturePlayerStates()
        {
            Player[] players = FindObjectsByType<Player>(FindObjectsSortMode.None);
            List<PlayerState> playerStates = new List<PlayerState>(players.Length);

            foreach (Player player in players)
            {
                if (player == null)
                {
                    continue;
                }

                playerStates.Add(new PlayerState
                {
                    player = player,
                    playerIndex = GetPlayerIndexFromName(player.name),
                    preferredCell = worldTilemap.WorldToCell(player.transform.position)
                });
            }

            return playerStates;
        }

        private void RepositionPlayers(LevelDefinition levelDefinition, LevelBuildData buildData, List<PlayerState> playerStates)
        {
            foreach (PlayerState playerState in playerStates)
            {
                if (playerState.player == null)
                {
                    continue;
                }

                Vector3Int targetCell = playerState.preferredCell;

                if (playerState.playerIndex > 0
                    && buildData.playerSpawnCells.TryGetValue(playerState.playerIndex, out Vector2Int spawnCell))
                {
                    targetCell = GetSceneCell(spawnCell.x, spawnCell.y, levelDefinition);
                }

                if (!IsWalkable(targetCell, levelDefinition))
                {
                    targetCell = FindClosestWalkableCell(targetCell, levelDefinition);
                }

                playerState.player.SnapToCell(targetCell, worldTilemap);
            }
        }

        private Vector3Int FindClosestWalkableCell(Vector3Int preferredCell, LevelDefinition levelDefinition)
        {
            if (IsWalkable(preferredCell, levelDefinition))
            {
                return preferredCell;
            }

            int maxRadius = Mathf.Max(levelDefinition.width, levelDefinition.height);

            for (int radius = 1; radius <= maxRadius; radius++)
            {
                for (int y = -radius; y <= radius; y++)
                {
                    for (int x = -radius; x <= radius; x++)
                    {
                        if (Mathf.Abs(x) != radius && Mathf.Abs(y) != radius)
                        {
                            continue;
                        }

                        Vector3Int candidateCell = preferredCell + new Vector3Int(x, y, 0);

                        if (IsWalkable(candidateCell, levelDefinition))
                        {
                            return candidateCell;
                        }
                    }
                }
            }

            return preferredCell;
        }

        private bool IsWalkable(Vector3Int sceneCell, LevelDefinition levelDefinition)
        {
            return IsInsideBoard(sceneCell, levelDefinition)
                && worldTilemap.GetColliderType(sceneCell) == Tile.ColliderType.None
                && !crateTilemap.HasTile(sceneCell);
        }

        private static bool IsInsideBoard(Vector3Int sceneCell, LevelDefinition levelDefinition)
        {
            Vector3Int minimumCell = GetSceneCell(0, 0, levelDefinition);
            Vector3Int maximumCell = GetSceneCell(levelDefinition.width - 1, levelDefinition.height - 1, levelDefinition);

            return sceneCell.x >= minimumCell.x
                && sceneCell.x <= maximumCell.x
                && sceneCell.y >= minimumCell.y
                && sceneCell.y <= maximumCell.y;
        }

        private static void DestroySceneObject(GameObject sceneObject)
        {
            if (sceneObject == null)
            {
                return;
            }

            if (Application.isPlaying)
            {
                UnityEngine.Object.Destroy(sceneObject);
                return;
            }

            UnityEngine.Object.DestroyImmediate(sceneObject);
        }

        #endregion

        #region Coordinates

        private static bool IsInsideBounds(int x, int y, LevelDefinition levelDefinition)
        {
            return x >= 0
                && x < levelDefinition.width
                && y >= 0
                && y < levelDefinition.height;
        }

        private static Vector3Int GetSceneCell(int jsonX, int jsonY, LevelDefinition levelDefinition)
        {
            return new Vector3Int(
                jsonX - Mathf.CeilToInt(levelDefinition.width * 0.5f),
                jsonY - Mathf.CeilToInt(levelDefinition.height * 0.5f),
                0);
        }

        #endregion

        #region Object Parsing

        private static bool TryGetPlayerIndex(string normalizedId, out int playerIndex)
        {
            switch (normalizedId)
            {
                case "p1":
                case "player1":
                case "spawn1":
                case "spawnp1":
                case "start1":
                case "playerone":
                    playerIndex = 1;
                    return true;

                case "p2":
                case "player2":
                case "spawn2":
                case "spawnp2":
                case "start2":
                case "playertwo":
                    playerIndex = 2;
                    return true;

                default:
                    playerIndex = 0;
                    return false;
            }
        }

        private static int GetPlayerIndexFromName(string playerName)
        {
            string normalizedName = NormalizeToken(playerName);

            if (normalizedName.Contains("p1") || normalizedName.Contains("player1"))
            {
                return 1;
            }

            if (normalizedName.Contains("p2") || normalizedName.Contains("player2"))
            {
                return 2;
            }

            return 0;
        }

        private static bool IsIgnoredObject(string normalizedId)
        {
            return normalizedId == "bomb"
                || normalizedId == "spikebomb"
                || normalizedId == "kick"
                || normalizedId == "bombcontrol"
                || normalizedId == "firerange"
                || normalizedId == "bombplus"
                || normalizedId == "bombcapacity"
                || normalizedId == "powerup"
                || normalizedId.StartsWith("powerup")
                || normalizedId.EndsWith("powerup");
        }

        private static bool IsConveyorId(string normalizedId)
        {
            return normalizedId.Contains("conveyor")
                || normalizedId.Contains("belt")
                || normalizedId.Contains("tapis");
        }

        private static bool IsTeleporterId(string normalizedId)
        {
            return normalizedId.StartsWith("teleporter") || normalizedId.StartsWith("portal");
        }

        private static string NormalizeToken(string value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant().Replace(" ", string.Empty).Replace("_", string.Empty).Replace("-", string.Empty);
        }

        private static ConveyorDirection ParseConveyorDirection(LevelObjectDefinition levelObject, string normalizedId)
        {
            if (TryParseConveyorDirection(levelObject.direction, out ConveyorDirection direction)
                || TryParseConveyorDirection(levelObject.conveyorDirection, out direction)
                || TryParseConveyorIdDirection(normalizedId, out direction))
            {
                return direction;
            }

            return ConveyorDirection.Left;
        }

        private static bool TryParseConveyorIdDirection(string normalizedId, out ConveyorDirection direction)
        {
            if (normalizedId.EndsWith("right"))
            {
                direction = ConveyorDirection.Right;
                return true;
            }

            if (normalizedId.EndsWith("left"))
            {
                direction = ConveyorDirection.Left;
                return true;
            }

            if (normalizedId.EndsWith("up") || normalizedId.EndsWith("top"))
            {
                direction = ConveyorDirection.Up;
                return true;
            }

            if (normalizedId.EndsWith("down") || normalizedId.EndsWith("bottom"))
            {
                direction = ConveyorDirection.Down;
                return true;
            }

            direction = ConveyorDirection.Left;
            return false;
        }

        private static bool TryParseConveyorDirection(string value, out ConveyorDirection direction)
        {
            string normalizedValue = NormalizeToken(value);

            switch (normalizedValue)
            {
                case "0":
                case "right":
                    direction = ConveyorDirection.Right;
                    return true;

                case "1":
                case "left":
                    direction = ConveyorDirection.Left;
                    return true;

                case "2":
                case "up":
                case "top":
                    direction = ConveyorDirection.Up;
                    return true;

                case "3":
                case "down":
                case "bottom":
                    direction = ConveyorDirection.Down;
                    return true;

                default:
                    direction = ConveyorDirection.Left;
                    return false;
            }
        }

        private static Teleporter.TeleporterColor ParseTeleporterColor(string normalizedId)
        {
            if (normalizedId.Contains("purple"))
            {
                return Teleporter.TeleporterColor.Purple;
            }

            if (normalizedId.Contains("blue"))
            {
                return Teleporter.TeleporterColor.Blue;
            }

            if (normalizedId.Contains("cyan"))
            {
                return Teleporter.TeleporterColor.Cyan;
            }

            if (normalizedId.Contains("green"))
            {
                return Teleporter.TeleporterColor.Green;
            }

            if (normalizedId.Contains("orange"))
            {
                return Teleporter.TeleporterColor.Orange;
            }

            return Teleporter.TeleporterColor.Red;
        }

        private static Quaternion GetConveyorRotation(ConveyorDirection direction)
        {
            float zRotation = direction switch
            {
                ConveyorDirection.Right => 180f,
                ConveyorDirection.Left => 0f,
                ConveyorDirection.Up => -90f,
                ConveyorDirection.Down => 90f,
                _ => 0f
            };

            return Quaternion.Euler(0f, 0f, zRotation);
        }

        #endregion

        #region Serialized Data

        [Serializable]
        private sealed class LevelDefinition
        {
            public int width;
            public int height;
            public LevelObjectDefinition[] objects;
        }

        [Serializable]
        private sealed class LevelObjectDefinition
        {
            public string id;
            public string layer;
            public int x;
            public int y;
            public int w;
            public int h;
            public string direction;
            public string conveyorDirection;
        }

        [Serializable]
        private struct LevelCellData
        {
            public bool isSolid;
            public bool isIce;
            public bool hasCrate;
            public bool hasConveyor;
            public ConveyorDirection conveyorDirection;
            public bool hasTeleporter;
            public Teleporter.TeleporterColor teleporterColor;
        }

        private sealed class LevelBuildData
        {
            public readonly LevelCellData[,] cells;
            public readonly Dictionary<int, Vector2Int> playerSpawnCells;
            public bool hasIce;

            public LevelBuildData(int width, int height)
            {
                cells = new LevelCellData[width, height];
                playerSpawnCells = new Dictionary<int, Vector2Int>();
            }
        }

        private struct PlayerState
        {
            public Player player;
            public int playerIndex;
            public Vector3Int preferredCell;
        }

        #endregion
    }
}
