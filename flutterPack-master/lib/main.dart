// import 'package:flutter/material.dart'; // 导入 Flutter 的 UI 基础包
// import 'package:media_kit/media_kit.dart'; // 导入视频播放器的核心控制库
// import 'widgets/interactive_movie_page.dart'; // 导入你自己写的交互播放页面文件

// void main() {
//   // 1. 确保 Flutter 引擎与原生平台（iOS/Android/Windows等）的绑定已完成
//   // 这在执行任何异步初始化代码（如初始化播放器）之前是必须的
//   WidgetsFlutterBinding.ensureInitialized();

//   // 2. 初始化 media_kit 播放器引擎
//   // 这会自动根据你的操作系统加载底层的解码库（如 libmpv）
//   MediaKit.ensureInitialized();

//   // 3. 运行根组件，启动 Flutter 应用
//   runApp(const MyApp());
// }

// // 定义应用程序的根组件，它是 StatelessWidget（无状态组件）
// class MyApp extends StatelessWidget {
//   // 构造函数，使用 key 来帮助 Flutter 标识和管理组件树中的 Widget
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context) {
//     // MaterialApp 是 Flutter 基于 Material Design 设计的顶层配置
//     return MaterialApp(
//       // App 的标题（主要用于任务管理器中显示的名称）
//       title: 'CineGenesis Player',

//       // 隐藏界面右上角自带的 "DEBUG" 红色横幅
//       debugShowCheckedModeBanner: false,

//       // 配置 App 的整体主题样式
//       theme: ThemeData.dark().copyWith(
//         // 使用深色主题，并将所有页面的默认脚手架背景色设为黑色
//         scaffoldBackgroundColor: Colors.black,
//       ),

//       // 设置 App 启动后显示的第一个页面
//       // 这里指向你拆分出来的交互式视频页面
//       home: const InteractiveMoviePage(),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'controllers/story_controller.dart';
import 'controllers/monetization_controller_api.dart';
import 'widgets/video_player_view.dart';
import 'widgets/story_ui_layers.dart';
import 'widgets/monetization_gate_dialog_api.dart';
import 'widgets/coin_balance_widget.dart';
import 'package:media_kit/media_kit.dart'; // 必须包含这一行

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // 初始化 MediaKit
  MediaKit.ensureInitialized();
  runApp(const MaterialApp(home: StoryScreen()));
}

class StoryScreen extends StatefulWidget {
  const StoryScreen({super.key});

  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  // 实例化逻辑控制器
  final StoryController _storyController = StoryController();
  final MonetizationControllerApi _monetizationController =
      MonetizationControllerApi();

  @override
  void initState() {
    super.initState();
    // 启动控制器
    _storyController.init();
    _monetizationController.init();
    // 监听逻辑层的变化，变化时刷新 UI
    _storyController.addListener(_update);
    _monetizationController.addListener(_update);
  }

  void _update() => setState(() {}); // 简单的刷新回调

  @override
  void dispose() {
    _storyController.removeListener(_update); // 移除监听
    _storyController.dispose(); // 销毁控制器
    _monetizationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 检查数据是否准备就绪
    final node = _storyController.currentNode;
    if (node == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: Stack(
        children: [
          // 1. 背景层：视频 (播放完会自动停在最后一帧)
          // --- 修改开始：背景层逻辑 ---
          // 逻辑：如果控制器里还没有截图，就显示视频；一旦有了截图，就显示图片。
          _storyController.lastFrameScreenshot == null
              ? VideoPlayerView(controller: _storyController.videoController)
              : SizedBox.expand(
                  child: Image.memory(
                    _storyController.lastFrameScreenshot!,
                    fit: BoxFit.cover, // 必须和视频的 BoxFit 保持一致
                    filterQuality: FilterQuality.high, // 使用高质量滤镜解决模糊问题
                  ),
                ),
          // --- 修改结束 ---

          // 2. 金币余额显示（左上角）
          Positioned(
            top: 20,
            left: 20,
            child: CoinBalanceWidget(
              monetizationController: _monetizationController,
            ),
          ),

          // 3. 文本层：一直显示或随按钮一起显示
          PositionedLayer(
            pos: node.layout['textPos'],
            child: StoryTextBox(title: node.title, content: node.content),
          ),

          // 4. 选项层：使用 AnimatedOpacity 实现缓缓浮现
          PositionedLayer(
            pos: node.layout['optionsPos'],
            child: AnimatedOpacity(
              opacity: _storyController.showOptions ? 1.0 : 0.0, // 根据状态控制透明度
              duration: const Duration(milliseconds: 800), // 0.8秒淡入
              curve: Curves.easeIn,
              child: _buildOptionsList(), // 之前定义的按钮列表方法
            ),
          ),
        ],
      ),
    );
  }

  /// 构建按钮列表
  Widget _buildOptionsList() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: _storyController.currentNode!.options.map((opt) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple.withOpacity(0.8),
              minimumSize: const Size(double.infinity, 50),
            ),
            // 点击时检查是否需要付费
            onPressed: () => _handleOptionClick(opt.targetId),
            child: Text(opt.label, style: const TextStyle(color: Colors.white)),
          ),
        );
      }).toList(),
    );
  }

  /// 处理选项点击 - 检查变现逻辑
  void _handleOptionClick(String targetId) {
    // 获取目标节点
    final targetNode = _storyController.storyData?.nodes[targetId];
    if (targetNode == null) {
      _storyController.jumpToNode(targetId);
      return;
    }

    // 检查是否需要变现
    final monetization = targetNode.monetization;

    // 如果没有变现设置或者是免费的，直接跳转
    if (monetization == null || monetization.type == 'free') {
      _storyController.jumpToNode(targetId);
      return;
    }

    // 如果已经解锁过，直接跳转
    if (_monetizationController.isNodeUnlocked(targetId)) {
      _storyController.jumpToNode(targetId);
      return;
    }

    // 显示变现门控弹窗
    showMonetizationGateApi(
      context: context,
      targetNode: targetNode,
      monetizationController: _monetizationController,
      onUnlocked: () => _storyController.jumpToNode(targetId),
    );
  }
}
