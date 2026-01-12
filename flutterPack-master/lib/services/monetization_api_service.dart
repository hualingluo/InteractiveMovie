import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// 变现 API 服务 - 与 Node.js 后端通信
class MonetizationApiService {
  // TODO: 替换为你的实际后端地址
  static const String baseUrl = 'http://localhost:3002';

  final String userId;

  MonetizationApiService({this.userId = 'defaultUser'});

  /// 获取用户信息
  Future<UserInfo?> getUserInfo() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/monetization/user-info?userId=$userId'))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return UserInfo.fromJson(data['data']);
        }
      }
      return null;
    } catch (e) {
      debugPrint('获取用户信息失败: $e');
      return null;
    }
  }

  /// 检查节点是否可以访问
  Future<NodeCheckResult?> checkNode(String nodeId) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/monetization/check-node'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'nodeId': nodeId, 'userId': userId}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return NodeCheckResult.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('检查节点失败: $e');
      return null;
    }
  }

  /// 使用金币解锁节点
  Future<UnlockResult?> unlockWithCoins(String nodeId) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/monetization/unlock-coins'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'nodeId': nodeId, 'userId': userId}),
          )
          .timeout(const Duration(seconds: 10)); // 广告可能需要更长时间

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return UnlockResult.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('金币解锁失败: $e');
      return null;
    }
  }

  /// 观看广告解锁节点
  Future<UnlockResult?> unlockWithAd(String nodeId) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/monetization/unlock-ad'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'nodeId': nodeId, 'userId': userId}),
          )
          .timeout(const Duration(seconds: 10)); // 广告播放需要时间

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return UnlockResult.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('广告解锁失败: $e');
      return null;
    }
  }

  /// 添加金币（测试用）
  Future<bool> addCoins(int amount) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/monetization/add-coins'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'amount': amount, 'userId': userId}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      debugPrint('添加金币失败: $e');
      return false;
    }
  }

  /// 重置用户数据（测试用）
  Future<bool> resetUser() async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/monetization/reset'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'userId': userId}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      debugPrint('重置失败: $e');
      return false;
    }
  }
}

/// 用户信息模型
class UserInfo {
  final int coins;
  final List<String> unlockedNodes;
  final String userId;

  UserInfo({
    required this.coins,
    required this.unlockedNodes,
    required this.userId,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      coins: json['coins'] ?? 0,
      unlockedNodes:
          (json['unlockedNodes'] as List?)?.map((e) => e.toString()).toList() ??
          [],
      userId: json['userId'] ?? 'defaultUser',
    );
  }
}

/// 节点检查结果
class NodeCheckResult {
  final bool success;
  final bool canAccess;
  final String? reason;
  final MonetizationInfo? monetization;

  NodeCheckResult({
    required this.success,
    required this.canAccess,
    this.reason,
    this.monetization,
  });

  factory NodeCheckResult.fromJson(Map<String, dynamic> json) {
    return NodeCheckResult(
      success: json['success'] ?? false,
      canAccess: json['canAccess'] ?? false,
      reason: json['reason'],
      monetization: json['monetization'] != null
          ? MonetizationInfo.fromJson(json['monetization'])
          : null,
    );
  }
}

/// 变现信息
class MonetizationInfo {
  final String type;
  final int? price;
  final String? adDescription;

  MonetizationInfo({required this.type, this.price, this.adDescription});

  factory MonetizationInfo.fromJson(Map<String, dynamic> json) {
    return MonetizationInfo(
      type: json['type'] ?? 'free',
      price: json['price'],
      adDescription: json['adDescription'],
    );
  }
}

/// 解锁结果
class UnlockResult {
  final bool success;
  final String? message;
  final int? currentCoins;
  final List<String>? unlockedNodes;
  final bool? alreadyUnlocked;

  UnlockResult({
    required this.success,
    this.message,
    this.currentCoins,
    this.unlockedNodes,
    this.alreadyUnlocked,
  });

  factory UnlockResult.fromJson(Map<String, dynamic> json) {
    return UnlockResult(
      success: json['success'] ?? false,
      message: json['message'],
      currentCoins: json['currentCoins'],
      unlockedNodes: (json['unlockedNodes'] as List?)
          ?.map((e) => e.toString())
          .toList(),
      alreadyUnlocked: json['alreadyUnlocked'],
    );
  }
}
