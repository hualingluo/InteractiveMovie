import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import '../models/story_data.dart';

class StoryController extends ChangeNotifier {
  StoryData? storyData;
  StoryNode? currentNode;

  late final Player player;
  VideoController? videoController;

  bool showOptions = false;
  Timer? _triggerTimer;
  Timer? _autoTimer;
  StreamSubscription? _completedSubscription;
  bool _mounted = true; // 添加 mounted 标记

  bool get mounted => _mounted;
  Uint8List? lastFrameScreenshot; // 存储截图

  StoryController() {
    player = Player();

    // 监听视频播放完成事件
    _completedSubscription = player.stream.completed.listen((bool completed) {
      if (completed) {
        _handleVideoEnd();
      }
    });
  }

  Future<void> init() async {
    videoController = VideoController(player);

    try {
      final jsonStr = await rootBundle.loadString('assets/config.json');
      final data = json.decode(jsonStr);
      storyData = StoryData.fromJson(data);

      if (storyData!.nodes.isNotEmpty) {
        String firstNodeId = storyData!.nodes.keys.first;
        await jumpToNode(firstNodeId);
      } else {
        debugPrint("错误：剧情数据中没有节点");
      }
    } catch (e) {
      debugPrint("加载配置失败: $e");
    }
  }

  Future<void> jumpToNode(String nodeId) async {
    if (storyData == null) return;
    final newNode = storyData!.nodes[nodeId];
    if (newNode == null) return;

    _clearTimers();
    showOptions = false;
    currentNode = newNode;
    notifyListeners();

    if (newNode.mediaType == "video" && newNode.mediaSrc.isNotEmpty) {
      // 设置不循环播放
      await player.setPlaylistMode(PlaylistMode.none);
      await player.open(Media('asset:///assets/videos/${newNode.mediaSrc}'));
    } else {
      await player.stop();
      // 如果没有视频，使用兜底定时器
      _startFallbackTimer(newNode);
    }

    notifyListeners();
  }

  void _onVideoFinished() async {
    // 视频结束，立刻截取当前帧
    lastFrameScreenshot = await player.screenshot();

    showOptions = true;
    notifyListeners(); // 刷新 UI，此时 UI 可以根据是否有截图来切换显示
  }

  void _handleVideoEnd() {
    if (!mounted) return;

    showOptions = true;
    notifyListeners();

    // 视频播完定格后，如果开启了自动跳转，开始倒计时
    if (currentNode?.settings['autoTransition'] == true) {
      int duration = currentNode!.settings['duration'] ?? 10;
      _autoTimer = Timer(Duration(seconds: duration), () {
        _handleDefaultSelection();
      });
    }
  }

  void _startFallbackTimer(StoryNode node) {
    int waitTime = node.settings['decisionTriggerTime'] ?? 0;
    _triggerTimer = Timer(Duration(seconds: waitTime), () {
      if (!mounted) return;
      showOptions = true;
      notifyListeners();

      // 兜底的自动跳转逻辑
      if (node.settings['autoTransition'] == true) {
        int duration = node.settings['duration'] ?? 15;
        _autoTimer = Timer(Duration(seconds: duration), () {
          _handleDefaultSelection();
        });
      }
    });
  }

  void _handleDefaultSelection() {
    if (currentNode == null || currentNode!.options.isEmpty) return;

    final defOpt = currentNode!.options.firstWhere(
      (o) => o.isDefault,
      orElse: () => currentNode!.options.first,
    );
    jumpToNode(defOpt.targetId);
  }

  void _clearTimers() {
    _triggerTimer?.cancel();
    _autoTimer?.cancel();
  }

  @override
  void dispose() {
    _mounted = false;
    _completedSubscription?.cancel();
    _clearTimers();
    player.dispose();
    super.dispose();
  }
}
