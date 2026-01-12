# 变现系统使用说明

## 概述
已成功实现模拟变现系统,支持以下三种解锁方式:
- **free**: 免费章节,无需解锁
- **paid**: 金币付费解锁
- **ad**: 观看广告解锁

## 实现的功能

### 1. 数据模型 ([story_data.dart](lib/models/story_data.dart))
- ✅ 添加了 `Monetization` 类,包含 `type`, `price`, `adDescription` 属性
- ✅ `StoryNode` 类增加了 `monetization` 可选属性

### 2. 变现控制器 ([monetization_controller.dart](lib/controllers/monetization_controller.dart))
- ✅ 金币余额管理 (初始1000金币)
- ✅ 节点解锁状态跟踪
- ✅ `unlockWithCoins()` - 金币解锁方法
- ✅ `unlockWithAd()` - 广告解锁方法 (模拟2秒广告)
- ✅ `addCoins()` - 测试用添加金币方法
- ✅ 本地持久化存储 (使用 shared_preferences)

### 3. UI 组件
- ✅ [monetization_gate_dialog.dart](lib/widgets/monetization_gate_dialog.dart) - 解锁弹窗
- ✅ [coin_balance_widget.dart](lib/widgets/coin_balance_widget.dart) - 左上角金币显示
- ✅ 集成到 [main.dart](lib/main.dart) 的选项点击逻辑

## JSON 配置示例

### 1. 免费章节 (默认)
```json
{
  "node_001": {
    "id": "node_001",
    "title": "第一章",
    "content": "...",
    "options": [...],
    "mediaSrc": "start.mp4",
    "layout": {...},
    "interactiveSettings": {...}
    // 不需要 monetization 字段,默认免费
  }
}
```

### 2. 金币付费章节
```json
{
  "node_005": {
    "id": "node_005",
    "title": "权谋巅峰",
    "content": "...",
    "options": [...],
    "mediaSrc": "n5.mp4",
    "layout": {...},
    "interactiveSettings": {...},
    "monetization": {
      "type": "paid",
      "price": 50,
      "adDescription": "购买金币解锁核心真相"
    }
  }
}
```

### 3. 广告解锁章节
```json
{
  "node_003": {
    "id": "node_003",
    "title": "锋芒毕露",
    "content": "...",
    "options": [...],
    "mediaSrc": "n3.mp4",
    "layout": {...},
    "interactiveSettings": {...},
    "monetization": {
      "type": "ad",
      "adDescription": "观看广告解锁这个隐藏的剧情分支"
    }
  }
}
```

## 用户体验流程

### 金币付费解锁流程:
1. 用户点击选项按钮
2. 系统检测目标节点需要付费解锁
3. 弹窗显示: "需要 50 金币" + "当前余额: 1000 金币"
4. 用户点击 "消耗 50 金币解锁"
5. 金币扣除,节点解锁成功
6. 自动跳转到目标节点
7. 左上角金币余额实时更新

### 广告解锁流程:
1. 用户点击选项按钮
2. 系统检测目标节点需要看广告解锁
3. 弹窗显示: "观看广告免费解锁"
4. 用户点击 "观看广告解锁"
5. 模拟播放广告 2 秒
6. 广告播放完成,节点解锁成功
7. 自动跳转到目标节点

## 测试方法

### 方法1: 测试金币不足
```dart
// 在 monetization_controller.dart 中修改初始金币
int _coins = 10; // 改为10金币
```

### 方法2: 手动添加金币
在 main.dart 的 `initState` 中添加:
```dart
@override
void initState() {
  super.initState();
  _storyController.init();
  _monetizationController.init();

  // 测试: 添加500金币
  _monetizationController.addCoins(500);

  _storyController.addListener(_update);
  _monetizationController.addListener(_update);
}
```

### 方法3: 重置解锁记录
```dart
await _monetizationController.reset();
```

## 已配置的示例节点

在 [dataNew.json](backend/resources/dataNew.json) 中已配置:
- ✅ **node_003** - 广告解锁 (type: "ad")
- ✅ **node_005** - 金币解锁 (type: "paid", price: 50)
- 其他节点 - 免费 (无 monetization 字段)

## 依赖项

已在 [pubspec.yaml](pubspec.yaml) 中添加:
```yaml
dependencies:
  shared_preferences: ^2.2.2  # 本地存储
```

## 注意事项

1. ⚠️ 这是模拟实现,没有接入真实的广告SDK (如 AdMob)
2. ⚠️ 金币系统是虚拟的,实际应用需要对接真实支付系统
3. ✅ 解锁状态会持久化到本地,重启应用后保留
4. ✅ 已解锁的节点可以直接进入,不会重复收费

## 下一步 (如需真实变现)

如需接入真实SDK,需要修改:
1. 替换 `unlockWithAd()` 中的模拟代码为真实广告SDK
2. 对接应用内购买 (IAP) 系统替换 `unlockWithCoins()`
3. 添加服务器验证防止本地存储篡改
