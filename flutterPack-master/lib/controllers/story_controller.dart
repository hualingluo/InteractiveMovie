import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import '../models/story_data.dart';

/// 获取 exe 运行目录下的 data 文件夹路径
String getDataPath() {
  try {
    // 获取 exe 文件的完整路径
    final exePath = Platform.resolvedExecutable;
    debugPrint('EXE 路径: $exePath');

    // 获取 exe 所在目录
    final exeDir = Directory(exePath).parent;
    debugPrint('EXE 目录: ${exeDir.path}');

    // 构建 data 目录路径
    final dataDir = Directory('${exeDir.path}${Platform.pathSeparator}data');
    debugPrint('Data 目录: ${dataDir.path}');

    return dataDir.path;
  } catch (e) {
    debugPrint('获取数据路径失败: $e');
    // 如果失败，返回相对路径作为降级方案
    return 'data';
  }
}

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
      // 优先从 data/config.json 读取（release 目录下的外部配置）
      final dataPath = getDataPath();
      final configDataFile = File('$dataPath${Platform.pathSeparator}config.json');
      debugPrint('尝试加载配置文件: ${configDataFile.path}');

      String jsonStr;

      if (configDataFile.existsSync()) {
        jsonStr = await configDataFile.readAsString();
        debugPrint('✅ 加载外部配置: ${configDataFile.path}');
      } else {
        // 降级到 assets（打包在 exe 内的配置）
        debugPrint('⚠️ 外部配置不存在，降级到 assets');
        jsonStr = await rootBundle.loadString('assets/config.json');
        debugPrint('✅ 加载 assets 配置: assets/config.json');
      }

      final data = json.decode(jsonStr);
      storyData = StoryData.fromJson(data);

      if (storyData!.nodes.isNotEmpty) {
        String firstNodeId = storyData!.nodes.keys.first;
        await jumpToNode(firstNodeId);
      } else {
        debugPrint("错误：剧情数据中没有节点");
      }
    } catch (e) {
      debugPrint("❌ 加载配置失败: $e");
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

      try {
        // 优先从 data/videos 读取（release 目录下的视频）
        final dataPath = getDataPath();

        // 处理 mediaSrc，移除可能存在的 "videos/" 前缀
        String videoFileName = newNode.mediaSrc;
        if (videoFileName.startsWith('videos/')) {
          videoFileName = videoFileName.substring(7); // 移除 "videos/" 前缀
        }

        final videoPath = '$dataPath${Platform.pathSeparator}videos${Platform.pathSeparator}$videoFileName';
        final videoFile = File(videoPath);

        debugPrint('尝试加载视频: ${videoFile.path}');

        if (videoFile.existsSync()) {
          // 使用本地文件路径
          await player.open(Media(videoFile.absolute.path));
          debugPrint('✅ 加载本地视频: ${videoFile.absolute.path}');
        } else {
          // 降级到 assets
          debugPrint('⚠️ 本地视频不存在，降级到 assets');
          await player.open(Media('asset:///assets/videos/$videoFileName'));
          debugPrint('✅ 加载 assets 视频: assets/videos/$videoFileName');
        }
      } catch (e) {
        debugPrint('❌ 视频加载失败: $e');
        // 如果出错，尝试降级到 assets
        try {
          String videoFileName = newNode.mediaSrc;
          if (videoFileName.startsWith('videos/')) {
            videoFileName = videoFileName.substring(7);
          }
          await player.open(Media('asset:///assets/videos/$videoFileName'));
          debugPrint('✅ 降级加载 assets 视频');
        } catch (e2) {
          debugPrint('❌ assets 视频也加载失败: $e2');
        }
      }
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
