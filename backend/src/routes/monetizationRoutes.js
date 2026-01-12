import express from 'express';
import UserDataManager from '../services/monetization/userDataManager.js';
import AdManager from '../services/monetization/adManager.js';
import PaymentManager from '../services/monetization/paymentManager.js';

const router = express.Router();
const userDataManager = new UserDataManager('./userData');
const adManager = new AdManager();
const paymentManager = new PaymentManager();

// 初始化管理器
userDataManager.init().catch(console.error);
paymentManager._loadPurchaseLog().catch(console.error);

// 定期清理过期日志（每天凌晨3点）
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 3 && now.getMinutes() === 0) {
    console.log('🧹 定时任务: 清理过期日志...');
    await paymentManager.cleanupOldLogs();
  }
}, 60000); // 每分钟检查一次

/**
 * GET /api/monetization/user-info
 * 获取用户信息（金币余额、已解锁节点）
 */
router.get('/user-info', async (req, res) => {
  try {
    const userId = req.query.userId || 'defaultUser';
    const userInfo = userDataManager.getUserInfo(userId);

    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * POST /api/monetization/check-node
 * 检查节点是否需要解锁
 */
router.post('/check-node', async (req, res) => {
  try {
    const { nodeId, userId = 'defaultUser' } = req.body;

    // 读取剧情数据
    const storyData = await import('../../resources/dataNew.json', {
      assert: { type: 'json' }
    });

    const node = storyData.default.nodes[nodeId];

    if (!node) {
      return res.json({
        success: true,
        canAccess: true,
        reason: '节点不存在或为免费节点'
      });
    }

    // 检查变现设置
    const monetization = node.monetization;

    if (!monetization || monetization.type === 'free') {
      return res.json({
        success: true,
        canAccess: true,
        reason: 'free'
      });
    }

    // 检查是否已解锁
    const isUnlocked = userDataManager.isNodeUnlocked(nodeId, userId);

    if (isUnlocked) {
      return res.json({
        success: true,
        canAccess: true,
        reason: 'unlocked'
      });
    }

    // 需要解锁
    return res.json({
      success: true,
      canAccess: false,
      reason: monetization.type, // 'paid' 或 'ad'
      monetization: {
        type: monetization.type,
        price: monetization.price,
        adDescription: monetization.adDescription
      }
    });
  } catch (error) {
    console.error('检查节点失败:', error);
    res.status(500).json({
      success: false,
      message: '检查节点失败'
    });
  }
});

/**
 * POST /api/monetization/unlock-coins
 * 使用金币解锁节点
 */
router.post('/unlock-coins', async (req, res) => {
  try {
    const { nodeId, userId = 'defaultUser' } = req.body;

    // 读取剧情数据获取价格
    const storyData = await import('../../resources/dataNew.json', {
      assert: { type: 'json' }
    });

    const node = storyData.default.nodes[nodeId];

    if (!node || !node.monetization || node.monetization.type !== 'paid') {
      return res.status(400).json({
        success: false,
        message: '节点不是付费类型'
      });
    }

    const price = node.monetization.price;

    if (!price) {
      return res.status(400).json({
        success: false,
        message: '未设置价格'
      });
    }

    // 执行解锁
    const result = await userDataManager.unlockWithCoins(nodeId, price, userId);

    res.json(result);
  } catch (error) {
    console.error('金币解锁失败:', error);
    res.status(500).json({
      success: false,
      message: '金币解锁失败'
    });
  }
});

/**
 * POST /api/monetization/unlock-ad
 * 观看广告解锁节点
 */
router.post('/unlock-ad', async (req, res) => {
  try {
    const { nodeId, userId = 'defaultUser' } = req.body;

    // 读取剧情数据验证节点
    const storyData = await import('../../resources/dataNew.json', {
      assert: { type: 'json' }
    });

    const node = storyData.default.nodes[nodeId];

    if (!node || !node.monetization || node.monetization.type !== 'ad') {
      return res.status(400).json({
        success: false,
        message: '节点不是广告类型'
      });
    }

    // 执行解锁（包含2秒广告模拟）
    const result = await userDataManager.unlockWithAd(nodeId, userId);

    res.json(result);
  } catch (error) {
    console.error('广告解锁失败:', error);
    res.status(500).json({
      success: false,
      message: '广告解锁失败'
    });
  }
});

/**
 * POST /api/monetization/add-coins
 * 添加金币（仅用于测试）
 */
router.post('/add-coins', async (req, res) => {
  try {
    const { amount, userId = 'defaultUser' } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '金额必须为正数'
      });
    }

    const result = await userDataManager.addCoins(amount, userId);

    res.json(result);
  } catch (error) {
    console.error('添加金币失败:', error);
    res.status(500).json({
      success: false,
      message: '添加金币失败'
    });
  }
});

/**
 * POST /api/monetization/reset
 * 重置用户数据（仅用于测试）
 */
router.post('/reset', async (req, res) => {
  try {
    const { userId = 'defaultUser' } = req.body;
    const result = await userDataManager.resetUser(userId);

    res.json(result);
  } catch (error) {
    console.error('重置失败:', error);
    res.status(500).json({
      success: false,
      message: '重置失败'
    });
  }
});

// ==================== 广告相关API ====================

/**
 * POST /api/monetization/get-ad
 * 获取广告配置（后端控制广告逻辑）
 */
router.post('/get-ad', async (req, res) => {
  try {
    const { nodeId, platform = 'windows', adType = 'rewarded' } = req.body;

    console.log(`\n📺 [API] 请求广告配置`);
    console.log(`   节点ID: ${nodeId}`);
    console.log(`   平台: ${platform}`);
    console.log(`   广告类型: ${adType}`);

    // 后端决定是否显示广告、显示哪个广告
    const adConfig = await adManager.getAdConfig(nodeId, platform, adType);

    if (!adConfig) {
      return res.json({
        success: false,
        message: '暂无可用广告'
      });
    }

    res.json({
      success: true,
      ad: adConfig
    });
  } catch (error) {
    console.error('获取广告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取广告失败'
    });
  }
});

/**
 * POST /api/monetization/verify-ad
 * 验证广告播放完成（防作弊）
 */
router.post('/verify-ad', async (req, res) => {
  try {
    const { nodeId, trackingId, adCompleted, userId = 'defaultUser' } = req.body;

    console.log(`\n🔍 [API] 验证广告播放`);
    console.log(`   节点ID: ${nodeId}`);
    console.log(`   追踪ID: ${trackingId}`);
    console.log(`   完成状态: ${adCompleted}`);

    // 后端验证广告是否真实播放完成
    const isValid = await adManager.verifyAdCompletion(trackingId, adCompleted);

    if (!isValid.success) {
      return res.status(400).json(isValid);
    }

    // 验证通过，解锁节点
    const result = await userDataManager.unlockWithAd(nodeId, userId);

    res.json(result);
  } catch (error) {
    console.error('验证广告失败:', error);
    res.status(500).json({
      success: false,
      message: '验证广告失败'
    });
  }
});

/**
 * GET /api/monetization/ad-stats
 * 获取广告统计数据（管理员用）
 */
router.get('/ad-stats', async (req, res) => {
  try {
    const stats = await adManager.getAdStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取广告统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取广告统计失败'
    });
  }
});

// ==================== 支付相关API ====================

/**
 * GET /api/monetization/coin-packages
 * 获取金币套餐列表（后端配置价格）
 */
router.get('/coin-packages', async (req, res) => {
  try {
    const packages = await paymentManager.getCoinPackages();

    res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('获取套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取套餐失败'
    });
  }
});

/**
 * POST /api/monetization/purchase-coins
 * 购买金币（后端验证支付）
 */
router.post('/purchase-coins', async (req, res) => {
  try {
    const { packageId, platform = 'windows', receipt, userId = 'defaultUser' } = req.body;

    console.log(`\n💳 [API] 处理金币购买`);
    console.log(`   套餐ID: ${packageId}`);
    console.log(`   平台: ${platform}`);
    console.log(`   用户: ${userId}`);

    // 1. 验证支付凭证
    const verification = await paymentManager.verifyPurchase({
      platform,
      receipt,
      packageId
    });

    if (!verification.isValid) {
      console.log(`❌ [API] 支付验证失败: ${verification.message}`);
      return res.status(400).json({
        success: false,
        message: verification.message || '支付验证失败'
      });
    }

    console.log(`✅ [API] 支付验证通过`);

    // 2. 验证通过，增加金币
    const coinsToAdd = verification.coins;
    const result = await userDataManager.addCoins(coinsToAdd, userId);

    // 3. 记录购买日志
    await paymentManager.logPurchase({
      userId,
      packageId,
      coins: coinsToAdd,
      platform,
      transactionId: verification.transactionId,
      packageName: verification.packageName,
      timestamp: new Date().toISOString()
    });

    // 4. 返回结果（包含交易ID）
    res.json({
      ...result,
      transactionId: verification.transactionId,
      packageName: verification.packageName
    });
  } catch (error) {
    console.error('购买失败:', error);
    res.status(500).json({
      success: false,
      message: '购买失败'
    });
  }
});

/**
 * GET /api/monetization/payment-stats
 * 获取支付统计数据（管理员用）
 */
router.get('/payment-stats', async (req, res) => {
  try {
    const stats = await paymentManager.getPaymentStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取支付统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付统计失败'
    });
  }
});

export default router;
