import crypto from 'crypto';
import fs from 'fs-extra';

/**
 * 广告管理器 - 模拟广告SDK调用
 * 实际接入时替换 _loadAdFromSDK() 和 _showAdInSDK() 方法
 */
class AdManager {
  constructor() {
    // 广告配置（模拟 AdMob/穿山甲配置）
    this.adConfigs = {
      android: {
        rewarded: {
          adUnitId: 'ca-app-pub-xxx/xxx', // AdMob 广告单元ID
          provider: 'admob',               // 广告提供商: admob, pangle, gromore
          duration: 30,                    // 广告时长(秒)
          rewardType: 'unlock'             // 奖励类型：解锁
        },
        interstitial: {
          adUnitId: 'ca-app-pub-yyy/yyy',
          provider: 'admob',
          duration: 15,
          rewardType: 'none'
        }
      },
      ios: {
        rewarded: {
          adUnitId: 'ca-app-pub-zzz/zzz', // iOS 广告单元ID
          provider: 'admob',
          duration: 30,
          rewardType: 'unlock'
        },
        interstitial: {
          adUnitId: 'ca-app-pub-www/www',
          provider: 'admob',
          duration: 15,
          rewardType: 'none'
        }
      },
      windows: {
        // Windows 平台通常不用广告SDK，这里仅作演示
        rewarded: {
          adUnitId: 'windows-ad-001',
          provider: 'custom',
          duration: 5,  // Windows 测试时用短广告
          rewardType: 'unlock'
        }
      }
    };

    // 广告播放追踪（防作弊）
    this.activeAds = new Map(); // trackingId -> { nodeId, startTime, userId, platform }

    // 广告播放日志
    this.adLogPath = './userData/ad_log.jsonl';

    // 清理过期追踪记录（每小时）
    setInterval(() => this._cleanupExpiredAds(), 3600000);
  }

  /**
   * 获取广告配置
   * @param {string} nodeId - 节点ID
   * @param {string} platform - 平台: android, ios, windows
   * @param {string} adType - 广告类型: rewarded, interstitial
   */
  async getAdConfig(nodeId, platform = 'windows', adType = 'rewarded') {
    try {
      console.log(`📺 [广告SDK] 正在加载广告...`);
      console.log(`   - 节点ID: ${nodeId}`);
      console.log(`   - 平台: ${platform}`);
      console.log(`   - 广告类型: ${adType}`);

      // 1. 检查平台是否支持
      const platformAds = this.adConfigs[platform];
      if (!platformAds) {
        console.warn(`⚠️  [广告SDK] 不支持的平台: ${platform}`);
        return null;
      }

      const adConfig = platformAds[adType];
      if (!adConfig) {
        console.warn(`⚠️  [广告SDK] 不支持的广告类型: ${adType}`);
        return null;
      }

      // 2. ========== 模拟调用广告SDK ==========
      const sdkLoadResult = await this._loadAdFromSDK(adConfig);
      if (!sdkLoadResult.success) {
        console.error(`❌ [广告SDK] 广告加载失败: ${sdkLoadResult.message}`);
        return null;
      }
      // =====================================

      // 3. 生成追踪ID（用于验证）
      const trackingId = this._generateTrackingId(nodeId);

      // 4. 记录广告会话
      this.activeAds.set(trackingId, {
        nodeId,
        startTime: Date.now(),
        userId: 'defaultUser',
        platform,
        adType
      });

      console.log(`✅ [广告SDK] 广告加载成功`);
      console.log(`   - 追踪ID: ${trackingId}`);
      console.log(`   - 广告单元: ${adConfig.adUnitId}`);

      // 5. 返回广告配置给客户端
      return {
        adUnitId: adConfig.adUnitId,
        adType: adType,
        provider: adConfig.provider,
        duration: adConfig.duration,
        rewardType: adConfig.rewardType,
        trackingId: trackingId
      };
    } catch (error) {
      console.error('❌ 获取广告配置失败:', error);
      return null;
    }
  }

  /**
   * 验证广告播放完成（防作弊）
   * @param {string} trackingId - 追踪ID
   * @param {boolean} adCompleted - 客户端报告的完成状态
   */
  async verifyAdCompletion(trackingId, adCompleted) {
    try {
      console.log(`🔍 [广告验证] 正在验证广告播放...`);
      console.log(`   - 追踪ID: ${trackingId}`);
      console.log(`   - 客户端报告: ${adCompleted ? '已完成' : '未完成'}`);

      // 1. 检查追踪ID是否存在
      const adSession = this.activeAds.get(trackingId);
      if (!adSession) {
        console.warn('⚠️  [广告验证] 无效的追踪ID');
        return {
          success: false,
          message: '无效的追踪ID'
        };
      }

      // 2. 检查客户端是否标记为完成
      if (!adCompleted) {
        console.warn('⚠️  [广告验证] 客户端报告广告未完成');
        return {
          success: false,
          message: '广告未播放完成'
        };
      }

      // 3. 检查广告播放时长（防止快进作弊）
      const elapsed = Date.now() - adSession.startTime;
      const minDuration = this.adConfigs[adSession.platform]?.[adSession.adType]?.duration * 1000 || 15000;
      const elapsedSeconds = Math.floor(elapsed / 1000);

      console.log(`   - 播放时长: ${elapsedSeconds}秒`);
      console.log(`   - 要求时长: ${minDuration / 1000}秒`);

      if (elapsed < minDuration) {
        console.warn(`⚠️  [广告验证] 广告播放时间过短: ${elapsedSeconds}秒`);
        return {
          success: false,
          message: `广告播放时间不足，需要${minDuration / 1000}秒`
        };
      }

      // 4. ========== 模拟调用SDK验证 ==========
      // 实际接入时调用 AdMob API 验证广告是否真实播放
      const sdkVerifyResult = await this._verifyWithSDK(trackingId, adSession);
      if (!sdkVerifyResult.valid) {
        console.error(`❌ [广告验证] SDK验证失败: ${sdkVerifyResult.reason}`);
        return {
          success: false,
          message: sdkVerifyResult.reason
        };
      }
      // ======================================

      // 5. 验证通过，清除追踪记录
      this.activeAds.delete(trackingId);

      // 6. 记录到日志
      await this._logAdCompletion({
        nodeId: adSession.nodeId,
        platform: adSession.platform,
        adType: adSession.adType,
        duration: elapsed,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [广告验证] 验证通过，解锁成功`);

      return {
        success: true,
        message: '广告播放验证通过'
      };
    } catch (error) {
      console.error('❌ 验证广告失败:', error);
      return {
        success: false,
        message: '验证广告失败'
      };
    }
  }

  /**
   * ========== 模拟SDK方法 ==========
   * 实际接入时替换为真实SDK调用
   */

  /**
   * 模拟从广告SDK加载广告
   * 实际接入示例:
   * - AdMob: RewardedAd.load(adUnitId)
   * - 穿山甲: PangleRewardedAd.load()
   */
  async _loadAdFromSDK(adConfig) {
    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟广告加载成功
    // TODO: 实际接入时替换为真实SDK调用
    // - AdMob: RewardedAd.load(adUnitId)
    // - 穿山甲: PangleRewardedAd.load()
    return {
      success: true,
      message: '广告加载成功'
    };
  }

  /**
   * 模拟验证广告播放
   * 实际接入示例:
   * - AdMob: 检查服务器回调或客户端验证
   * - 穿山甲: 验证 reward verify API
   */
  async _verifyWithSDK(trackingId, adSession) {
    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    // 在实际接入中，这里应该:
    // 1. 检查广告SDK的服务器到服务器回调
    // 2. 或者验证客户端传来的签名
    // 3. 检查广告是否被真实观看（非跳过）

    // 模拟验证通过
    return {
      valid: true,
      reason: null
    };
  }

  /**
   * ========== 辅助方法 ==========
   */

  /**
   * 生成追踪ID
   */
  _generateTrackingId(nodeId) {
    const data = `${nodeId}-${Date.now()}-${Math.random()}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 清理过期追踪记录（超过1小时）
   */
  _cleanupExpiredAds() {
    const now = Date.now();
    const maxAge = 3600000; // 1小时
    let cleaned = 0;

    for (const [trackingId, session] of this.activeAds.entries()) {
      if (now - session.startTime > maxAge) {
        this.activeAds.delete(trackingId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [广告管理] 清理过期追踪记录: ${cleaned}条`);
    }
  }

  /**
   * 记录广告完成日志
   */
  async _logAdCompletion(data) {
    try {
      const logEntry = JSON.stringify(data) + '\n';
      await fs.appendFile(this.adLogPath, logEntry);
      console.log(`📊 [广告日志] 广告完成: ${data.nodeId} (${data.duration}ms)`);
    } catch (error) {
      console.error('❌ 写入广告日志失败:', error);
    }
  }

  /**
   * 获取广告统计数据
   */
  async getAdStats() {
    try {
      const logFile = this.adLogPath;
      if (!await fs.pathExists(logFile)) {
        return {
          totalAds: 0,
          byPlatform: {},
          byNodeType: {}
        };
      }

      const lines = await fs.readFile(logFile, 'utf8');
      const logs = lines.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));

      const stats = {
        totalAds: logs.length,
        byPlatform: {},
        byNodeType: {}
      };

      logs.forEach(log => {
        // 按平台统计
        stats.byPlatform[log.platform] = (stats.byPlatform[log.platform] || 0) + 1;
        // 按节点统计
        stats.byNodeType[log.nodeId] = (stats.byNodeType[log.nodeId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ 获取广告统计失败:', error);
      return null;
    }
  }
}

export default AdManager;
