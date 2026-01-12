import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:media_kit/media_kit.dart'; // 导入核心播放库
import 'package:media_kit_video/media_kit_video.dart'; // 导入视频渲染库
import '../models/game_data.dart'; // 导入你拆分后的数据模型

class InteractiveMoviePage extends StatefulWidget {
  const InteractiveMoviePage({super.key});

  @override
  State<InteractiveMoviePage> createState() => _InteractiveMoviePageState();
}

class _InteractiveMoviePageState extends State<InteractiveMoviePage> {
  // --- 状态变量 ---
  GameData? _gameData; // 存储从 JSON 解析出的完整游戏数据
  GameNode? _currentNode; // 当前正在播放/显示的剧情节点
  late final Player _player; // media_kit 的播放器实例，负责解码和控制
  late final VideoController _videoController; // 视频控制器，将播放器画面桥接到 UI
  bool _isVideoLoading = true; // 控制加载遮罩层的显示，防止视频加载时的黑屏闪烁

  @override
  void initState() {
    super.initState();

    // 1. 初始化播放器实例
    _player = Player();

    // 2. 初始化视频控制器，并关联到播放器
    _videoController = VideoController(_player);

    // 3. 监听播放器状态：当视频开始播放（playing 为 true）且组件还挂载在树上时
    _player.stream.playing.listen((isPlaying) {
      if (isPlaying && mounted) {
        setState(() => _isVideoLoading = false); // 隐藏加载指示器
      }
    });

    // 4. 开始加载游戏配置文件
    _loadGame();
  }

  /// 加载并解析 JSON 配置文件
  void _loadGame() async {
    try {
      // 从项目的 assets 目录下读取 config.json
      final jsonString = await DefaultAssetBundle.of(
        context,
      ).loadString('assets/config.json');

      // 解析 JSON 字符串并转化为 GameData 对象
      final data = GameData.fromJson(jsonDecode(jsonString));

      setState(() {
        _gameData = data;
        // 游戏启动时，默认定位到 ID 为 'start' 的节点
        _currentNode = data.nodes['start'];
      });

      // 如果成功获取初始节点，开始播放对应的视频
      if (_currentNode != null) _initializeVideo(_currentNode!.mediaSrc);
    } catch (e) {
      // 如果路径不对或 JSON 格式错误，在控制台打印错误
      debugPrint("Error loading JSON: $e");
    }
  }

  /// 初始化视频播放
  Future<void> _initializeVideo(String assetPath) async {
    if (assetPath.isEmpty) return; // 如果视频路径为空，则直接退出防止报错

    setState(() => _isVideoLoading = true); // 切换视频前显示加载状态

    // media_kit 访问本地资源需要使用 'asset:///' 协议前缀
    await _player.open(Media('asset:///$assetPath'), play: true);

    // 设置循环播放，防止视频播完后出现黑屏
    _player.setPlaylistMode(PlaylistMode.loop);
  }

  /// 核心跳转逻辑：点击按钮时调用
  void _jumpToNode(String targetId) async {
    // 验证目标节点是否存在于数据集中
    if (_gameData == null || !_gameData!.nodes.containsKey(targetId)) return;

    final nextNode = _gameData!.nodes[targetId]!;

    setState(() {
      _currentNode = nextNode; // 更新当前的剧情文本和选项
      _isVideoLoading = true; // 重新显示加载状态，直到新视频缓冲完成
    });

    // 立即加载并播放新节点的视频
    await _player.open(Media('asset:///${nextNode.mediaSrc}'), play: true);
  }

  @override
  void dispose() {
    // 组件销毁时必须释放播放器资源，否则会导致内存泄漏
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 如果 JSON 还没加载完，先显示一个基础的居中加载圈
    if (_currentNode == null)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      body: Stack(
        fit: StackFit.expand, // 让 Stack 的子组件铺满全屏
        children: [
          // 1. 最底层：视频渲染层
          Video(controller: _videoController, controls: NoVideoControls),

          // 2. 中间层：视频加载时的黑色遮罩
          if (_isVideoLoading) _buildLoadingOverlay(),

          // 3. 最上层：剧情文字、渐变背景和选项按钮
          _buildTextOverlay(),
        ],
      ),
    );
  }

  /// 构建加载中的遮罩层
  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black87, // 半透明黑色背景
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.amber), // 金色进度条
            SizedBox(height: 20),
            Text('加载视频中...', style: TextStyle(color: Colors.white)),
          ],
        ),
      ),
    );
  }

  /// 构建 UI 内容层（文字和按钮）
  Widget _buildTextOverlay() {
    return Container(
      // 使用渐变背景增强文字可读性（从透明过渡到黑色）
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
          stops: const [0.5, 1.0], // 从中间位置开始变黑
        ),
      ),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end, // 内容靠底部对齐
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 显示当前节点标题
          Text(
            _currentNode!.title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.amber,
            ),
          ),
          const SizedBox(height: 10),
          // 显示当前剧情内容
          Text(
            _currentNode!.content,
            style: const TextStyle(fontSize: 16, color: Colors.white),
          ),
          const SizedBox(height: 30),
          // 将节点内的选项列表转化为按钮组件
          ..._currentNode!.options.map((opt) => _buildOptionButton(opt)),

          // 如果节点没有选项（说明是结局），显示重新开始按钮
          if (_currentNode!.options.isEmpty)
            ElevatedButton(
              onPressed: () => _jumpToNode('start'),
              child: const Text("重新开始"),
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  /// 构建单个选项按钮
  Widget _buildOptionButton(NodeOption option) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white.withOpacity(0.2), // 半透明按钮背景
          side: const BorderSide(color: Colors.white, width: 1), // 按钮边框
        ),
        // 点击按钮执行跳转逻辑
        onPressed: () => _jumpToNode(option.targetId),
        child: Text(option.label, style: const TextStyle(color: Colors.white)),
      ),
    );
  }
}
