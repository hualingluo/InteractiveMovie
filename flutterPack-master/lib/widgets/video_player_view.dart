import 'package:flutter/material.dart';
// 引入 media_kit 视频渲染库
import 'package:media_kit_video/media_kit_video.dart';

class VideoPlayerView extends StatelessWidget {
  // 注意这里接收的是 media_kit 的 VideoController
  final VideoController? controller;

  const VideoPlayerView({super.key, this.controller});

  @override
  Widget build(BuildContext context) {
    // 如果控制器为空，显示黑屏
    if (controller == null) {
      return Container(color: Colors.black);
    }

    // media_kit 提供的全屏填充方案
    return SizedBox.expand(
      child: Video(
        controller: controller!,
        // BoxFit.cover 确保铺满全屏
        fit: BoxFit.cover,
        // 隐藏默认的播放控制条（互动视频通常不需要显示进度条）
        controls: NoVideoControls,
      ),
    );
  }
}
