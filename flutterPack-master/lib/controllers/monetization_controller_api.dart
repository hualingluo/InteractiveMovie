import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/monetization_api_service.dart';
import '../models/story_data.dart';

/// 基于 API 的变现控制器 - 与 Node.js 后端通信
class MonetizationControllerApi extends ChangeNotifier {
  final MonetizationApiService _apiService;

  int _coins = 0;
  List<String> _unlockedNodes = [];
  bool _isLoading = false;
  String? _errorMessage;

  MonetizationControllerApi({String userId = 'defaultUser'})
      : _apiService = MonetizationApiService(userId: userId);

  int get coins => _coins;
  List<String> get unlockedNodes => _unlockedNodes;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// 初始化 - 从后端加载用户数据
  Future<void> init() async {
    _setLoading(true);
    try {
      final userInfo = await _apiService.getUserInfo();
      if (userInfo != null) {
        _coins = userInfo.coins;
        _unlockedNodes = userInfo.unlockedNodes;
        _clearError();
        debugPrint('✅ 用户数据加载成功: 金币=$_coins, 已解锁=${_unlockedNodes.length}个节点');
      } else {
        _setError('无法加载用户数据');
      }
    } catch (e) {
      _setError('初始化失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// 检查节点是否已解锁
  bool isNodeUnlocked(String nodeId) {
    return _unlockedNodes.contains(nodeId);
  }

  /// 刷新用户数据
  Future<void> refreshUserInfo() async {
    final userInfo = await _apiService.getUserInfo();
    if (userInfo != null) {
      _coins = userInfo.coins;
      _unlockedNodes = userInfo.unlockedNodes;
      notifyListeners();
    }
  }

  /// 检查节点是否可以访问
  Future<NodeCheckResult?> checkNodeAccess(String nodeId) async {
    final result = await _apiService.checkNode(nodeId);
    return result;
  }

  /// 使用金币解锁节点
  Future<bool> unlockWithCoins(String nodeId) async {
    _setLoading(true);
    _clearError();

    try {
      final result = await _apiService.unlockWithCoins(nodeId);

      if (result != null && result.success) {
        // 解锁成功，刷新用户数据
        await refreshUserInfo();
        debugPrint('✅ 金币解锁成功: $nodeId');
        return true;
      } else {
        _setError(result?.message ?? '解锁失败');
        return false;
      }
    } catch (e) {
      _setError('解锁失败: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// 观看广告解锁节点
  Future<bool> unlockWithAd(String nodeId) async {
    _setLoading(true);
    _clearError();

    try {
      debugPrint('📺 正在播放广告...');
      final result = await _apiService.unlockWithAd(nodeId);

      if (result != null && result.success) {
        // 解锁成功，刷新用户数据
        await refreshUserInfo();
        debugPrint('✅ 广告解锁成功: $nodeId');
        return true;
      } else {
        _setError(result?.message ?? '解锁失败');
        return false;
      }
    } catch (e) {
      _setError('解锁失败: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// 添加金币（测试用）
  Future<bool> addCoins(int amount) async {
    _setLoading(true);
    try {
      final success = await _apiService.addCoins(amount);
      if (success) {
        await refreshUserInfo();
        debugPrint('✅ 获得 $amount 金币');
      }
      return success;
    } catch (e) {
      _setError('添加金币失败: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// 重置用户数据（测试用）
  Future<bool> reset() async {
    _setLoading(true);
    try {
      final success = await _apiService.resetUser();
      if (success) {
        await refreshUserInfo();
        debugPrint('✅ 数据已重置');
      }
      return success;
    } catch (e) {
      _setError('重置失败: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }
}
