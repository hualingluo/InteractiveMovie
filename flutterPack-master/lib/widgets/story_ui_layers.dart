import 'package:flutter/material.dart';

/// 一个通用的位置容器，将百分比坐标转换为实际像素
class PositionedLayer extends StatelessWidget {
  final Map pos; // 包含 x, y, w, h 的Map
  final Widget child;

  const PositionedLayer({super.key, required this.pos, required this.child});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size; // 获取当前屏幕尺寸
    return Positioned(
      left: size.width * (pos['x'] / 100), // X坐标百分比转像素
      top: size.height * (pos['y'] / 100), // Y坐标百分比转像素
      width: size.width * (pos['w'] / 100), // 宽度百分比转像素
      height: size.height * (pos['h'] / 100), // 高度百分比转像素
      child: child,
    );
  }
}

/// 剧情文本框组件
class StoryTextBox extends StatelessWidget {
  final String title;
  final String content;

  const StoryTextBox({super.key, required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.black54, // 半透明黑色背景
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.amber.withOpacity(0.5)), // 浅金色边框
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.amber,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Divider(color: Colors.amber), // 分割线
          Expanded(
            child: SingleChildScrollView(
              // 内容过多时可滚动
              child: Text(
                content,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
