/// --- 游戏整体数据集模型 ---
class GameData {
  // 存储所有剧情节点的映射表，Key 是节点 ID（如 "start"），Value 是节点对象
  final Map<String, GameNode> nodes;
  // 存储视口/画布的相关配置（x, y 坐标等）
  final GameViewport viewport;

  // 标准构造函数
  GameData({required this.nodes, required this.viewport});

  // 这里的 factory 构造函数负责将 JSON (Map) 转化为 GameData 对象
  factory GameData.fromJson(Map<String, dynamic> json) {
    var nodesMap = <String, GameNode>{}; // 初始化一个空的 Map 用来装载节点

    // 检查 JSON 里的 'nodes' 字段是否存在
    if (json['nodes'] != null) {
      // 遍历 JSON 里的 nodes 对象
      json['nodes'].forEach((key, value) {
        // 将每一个子项通过 GameNode.fromJson 转化，并存入 nodesMap
        nodesMap[key] = GameNode.fromJson(value);
      });
    }

    // 返回构建好的实例
    return GameData(
      nodes: nodesMap,
      // 如果 JSON 里没有 viewport 字段，则传一个空 Map 进去走默认值
      viewport: GameViewport.fromJson(json['viewport'] ?? {}),
    );
  }
}

/// --- 单个剧情节点模型 ---
class GameNode {
  final String id; // 节点的唯一标识符
  final String title; // 节点标题（显示在 UI 上）
  final String content; // 剧情文本内容
  final String mediaSrc; // 关联的视频文件路径
  final List<NodeOption> options; // 该节点下的选项按钮列表

  GameNode({
    required this.id,
    required this.title,
    required this.content,
    required this.mediaSrc,
    required this.options,
  });

  // 将 JSON 里的节点字典转化为 GameNode 对象
  factory GameNode.fromJson(Map<String, dynamic> json) {
    var optionsList = <NodeOption>[]; // 初始化选项列表

    // 如果 JSON 里的 'options' 列表不为空
    if (json['options'] != null) {
      // 遍历列表里的每一项，转化为 NodeOption 对象并添加
      json['options'].forEach((v) => optionsList.add(NodeOption.fromJson(v)));
    }

    return GameNode(
      // 使用 ?? 运算符提供默认值，防止 JSON 缺少字段时程序崩溃
      id: json['id'] ?? "",
      title: json['title'] ?? "",
      content: json['content'] ?? "",
      mediaSrc: json['mediaSrc'] ?? "",
      options: optionsList,
    );
  }
}

/// --- 按钮选项模型 ---
class NodeOption {
  final String label; // 按钮上显示的文字
  final String targetId; // 点击该按钮后要跳转的目标节点 ID

  NodeOption({required this.label, required this.targetId});

  // 将 JSON 里的选项字典转化为 NodeOption 对象
  factory NodeOption.fromJson(Map<String, dynamic> json) {
    return NodeOption(
      label: json['label'] ?? "", // 如果没有 label 默认为空字符串
      targetId: json['targetId'] ?? "", // 如果没有跳转 ID 默认为空字符串
    );
  }
}

/// --- 视口/配置坐标模型 ---
class GameViewport {
  final double x, y; // 坐标值

  GameViewport({required this.x, required this.y});

  // 将 JSON 里的视口字典转化为 GameViewport 对象
  factory GameViewport.fromJson(Map<String, dynamic> json) {
    return GameViewport(
      // 使用 .toDouble() 确保即使 JSON 里写的是整数(0)也能转为浮点数(0.0)
      x: (json['x'] ?? 0).toDouble(),
      y: (json['y'] ?? 0).toDouble(),
    );
  }
}
