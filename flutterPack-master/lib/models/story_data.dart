/// 剧情整体数据结构
class StoryData {
  final Map<String, StoryNode> nodes; // 所有的节点

  StoryData({required this.nodes});

  // 从JSON字符串解析
  factory StoryData.fromJson(Map<String, dynamic> json) {
    var nodesMap = json['nodes'] as Map<String, dynamic>;
    // 将Map中的每个键值对转化为StoryNode对象
    Map<String, StoryNode> nodes = nodesMap.map(
      (key, value) => MapEntry(key, StoryNode.fromJson(value)),
    );
    return StoryData(nodes: nodes);
  }
}

/// 单个剧情节点
class StoryNode {
  final String id;
  final String title;
  final String content;
  final List<StoryOption> options;
  final String mediaSrc;
  final String mediaType;
  final Map<String, dynamic> layout; // 布局信息
  final Map<String, dynamic> settings; // 交互设置
  final Monetization? monetization; // 变现设置

  StoryNode({
    required this.id,
    required this.title,
    required this.content,
    required this.options,
    required this.mediaSrc,
    required this.mediaType,
    required this.layout,
    required this.settings,
    this.monetization,
  });

  factory StoryNode.fromJson(Map<String, dynamic> json) {
    return StoryNode(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      // 将options列表转换为StoryOption对象列表
      options: (json['options'] as List)
          .map((i) => StoryOption.fromJson(i))
          .toList(),
      mediaSrc: json['mediaSrc'],
      mediaType: json['mediaType'],
      layout: json['layout'],
      settings: json['interactiveSettings'],
      monetization: json['monetization'] != null
          ? Monetization.fromJson(json['monetization'])
          : null,
    );
  }
}

/// 变现设置结构
class Monetization {
  final String type; // 'free', 'ad', 'paid'
  final int? price; // 金币价格（当type为paid时）
  final String? adDescription; // 广告解锁提示语（当type为ad时）

  Monetization({
    required this.type,
    this.price,
    this.adDescription,
  });

  factory Monetization.fromJson(Map<String, dynamic> json) {
    return Monetization(
      type: json['type'] ?? 'free',
      price: json['price'],
      adDescription: json['adDescription'],
    );
  }
}

/// 选项按钮结构
class StoryOption {
  final String id;
  final String label;
  final String targetId;
  final bool isDefault;

  StoryOption({
    required this.id,
    required this.label,
    required this.targetId,
    required this.isDefault,
  });

  factory StoryOption.fromJson(Map<String, dynamic> json) {
    return StoryOption(
      id: json['id'],
      label: json['label'],
      targetId: json['targetId'],
      isDefault: json['isDefault'] ?? false,
    );
  }
}
