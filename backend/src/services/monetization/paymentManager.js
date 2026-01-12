import https from 'https';
import crypto from 'crypto';
import fs from 'fs-extra';

/**
 * 支付管理器 - 模拟支付SDK调用
 * 实际接入时替换 _verifyIOSReceipt() 和 _verifyAndroidReceipt() 方法
 */
class PaymentManager {
  constructor() {
    // 金币套餐配置（后端控制价格）
    this.coinPackages = [
      {
        id: 'pack_100',
        name: '小袋金币',
        coins: 100,
        price: 0.99,
        currency: 'USD',
        productId: 'com.yourapp.coins.100'
      },
      {
        id: 'pack_500',
        name: '中袋金币',
        coins: 500,
        price: 3.99,
        currency: 'USD',
        productId: 'com.yourapp.coins.500'
      },
      {
        id: 'pack_1000',
        name: '大袋金币',
        coins: 1000,
        price: 6.99,
        currency: 'USD',
        productId: 'com.yourapp.coins.1000'
      },
      {
        id: 'pack_5000',
        name: '超值金币',
        coins: 5000,
        price: 19.99,
        currency: 'USD',
        productId: 'com.yourapp.coins.5000'
      },
    ];

    // App Store 配置（实际接入时使用真实配置）
    this.appStoreConfig = {
      sandbox: true, // 测试环境
      password: process.env.APP_STORE_SHARED_SECRET || 'test_shared_secret'
    };

    // Google Play 配置（实际接入时使用真实配置）
    this.playStoreConfig = {
      packageName: 'com.yourcompany.app',
      apiKey: process.env.GOOGLE_PLAY_API_KEY || 'test_api_key'
    };

    // 购买记录（防重复消费）
    this.purchaseLog = new Map(); // transactionId -> { userId, coins, timestamp }

    // 购买日志路径
    this.purchaseLogPath = './userData/purchase_log.jsonl';

    // 加载历史购买记录
    this._loadPurchaseLog();
  }

  /**
   * 获取金币套餐列表
   */
  async getCoinPackages() {
    console.log(`💰 [支付系统] 获取金币套餐列表: ${this.coinPackages.length}个套餐`);
    return this.coinPackages;
  }

  /**
   * 根据套餐ID获取套餐信息
   */
  getPackageById(packageId) {
    return this.coinPackages.find(pkg => pkg.id === packageId);
  }

  /**
   * 验证购买凭证
   * @param {string} platform - 平台: ios, android
   * @param {string} receipt - 购买凭证
   * @param {string} packageId - 套餐ID
   */
  async verifyPurchase({ platform, receipt, packageId }) {
    try {
      console.log(`💳 [支付验证] 正在验证购买...`);
      console.log(`   - 平台: ${platform}`);
      console.log(`   - 套餐ID: ${packageId}`);
      console.log(`   - 凭证长度: ${receipt?.length || 0}`);

      // 检查套餐是否存在
      const package = this.getPackageById(packageId);
      if (!package) {
        console.warn('⚠️  [支付验证] 无效的套餐ID');
        return {
          isValid: false,
          message: '无效的套餐ID'
        };
      }

      console.log(`   - 套餐名称: ${package.name}`);
      console.log(`   - 金币数量: ${package.coins}`);

      // 根据平台调用不同的验证方法
      let verification;
      if (platform === 'ios') {
        verification = await this._verifyIOSReceipt(receipt, package);
      } else if (platform === 'android') {
        verification = await this._verifyAndroidReceipt(receipt, package);
      } else if (platform === 'windows') {
        // Windows 测试平台，直接通过
        verification = await this._verifyWindowsReceipt(receipt, package);
      } else {
        return {
          isValid: false,
          message: '不支持的平台'
        };
      }

      if (!verification.isValid) {
        console.warn(`⚠️  [支付验证] 验证失败: ${verification.message}`);
        return verification;
      }

      // 检查是否已消费（防重复消费）
      if (this.purchaseLog.has(verification.transactionId)) {
        console.warn(`⚠️  [支付验证] 重复的交易ID: ${verification.transactionId}`);
        return {
          isValid: false,
          message: '该交易已处理过，无法重复消费'
        };
      }

      console.log(`✅ [支付验证] 验证通过`);
      console.log(`   - 交易ID: ${verification.transactionId}`);
      console.log(`   - 获得金币: ${package.coins}`);

      return {
        isValid: true,
        coins: package.coins,
        transactionId: verification.transactionId,
        packageName: package.name
      };
    } catch (error) {
      console.error('❌ 支付验证失败:', error);
      return {
        isValid: false,
        message: '支付验证失败: ' + error.message
      };
    }
  }

  /**
   * ========== 模拟SDK验证方法 ==========
   * 实际接入时替换为真实SDK调用
   */

  /**
   * 模拟验证 iOS App Store 收据
   * 实际接入示例:
   * 1. 接收客户端传来的 base64 编码收据
   * 2. 发送 POST 请求到 https://buy.itunes.apple.com/verifyReceipt
   * 3. 解析返回的 JSON，验证 status === 0
   * 4. 提取 transaction_id 和 product_id
   */
  async _verifyIOSReceipt(receiptData, package) {
    console.log(`🍎 [App Store] 正在验证收据...`);

    // ========== 模拟验证过程 ==========
    // 实际接入时替换为真实的 App Store API 调用
    // POST https://buy.itunes.apple.com/verifyReceipt
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟

    // 模拟生成交易ID
    const transactionId = this._generateTransactionId('ios', package.id);

    console.log(`✅ [App Store] 收据验证成功`);
    // ===================================

    return {
      isValid: true,
      transactionId: transactionId
    };
  }

  /**
   * 模拟验证 Android Google Play 收据
   * 实际接入示例:
   * 1. 接收客户端传来的 purchaseToken
   * 2. 调用 Google Play Developer API
   * 3. GET https://www.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}
   * 4. 验证 purchaseState === 0 且 consumptionState === 0
   */
  async _verifyAndroidReceipt(purchaseToken, package) {
    console.log(`🤖 [Google Play] 正在验证购买...`);

    // ========== 模拟验证过程 ==========
    // 实际接入时替换为真实的 Google Play API 调用
    // GET https://www.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟

    // 模拟生成交易ID
    const transactionId = this._generateTransactionId('android', package.id);

    console.log(`✅ [Google Play] 购买验证成功`);
    // ===================================

    return {
      isValid: true,
      transactionId: transactionId
    };
  }

  /**
   * 模拟 Windows 平台验证（测试用）
   */
  async _verifyWindowsReceipt(receipt, package) {
    console.log(`🪟 [Windows] 测试模式，直接通过验证`);

    // Windows 平台用于测试，直接生成交易ID
    const transactionId = this._generateTransactionId('windows', package.id);

    return {
      isValid: true,
      transactionId: transactionId
    };
  }

  /**
   * ========== 辅助方法 ==========
   */

  /**
   * 生成交易ID（模拟）
   */
  _generateTransactionId(platform, packageId) {
    const data = `${platform}-${packageId}-${Date.now()}-${Math.random()}`;
    return crypto.createHash('md5').update(data).digest('hex').substring(0, 32);
  }

  /**
   * 记录购买日志
   */
  async logPurchase(data) {
    try {
      // 保存到内存（防重复消费）
      this.purchaseLog.set(data.transactionId, {
        userId: data.userId,
        coins: data.coins,
        packageId: data.packageId,
        timestamp: data.timestamp
      });

      // 保存到文件
      const logEntry = JSON.stringify(data) + '\n';
      await fs.appendFile(this.purchaseLogPath, logEntry);

      console.log(`📊 [支付日志] 购买成功: ${data.packageName} (${data.coins}金币)`);
      console.log(`   - 交易ID: ${data.transactionId}`);
      console.log(`   - 用户: ${data.userId}`);
    } catch (error) {
      console.error('❌ 写入购买日志失败:', error);
    }
  }

  /**
   * 加载购买日志
   */
  async _loadPurchaseLog() {
    try {
      const logFile = this.purchaseLogPath;
      if (await fs.pathExists(logFile)) {
        const lines = await fs.readFile(logFile, 'utf8');
        const logs = lines.split('\n').filter(line => line.trim());

        let loaded = 0;
        for (const line of logs) {
          try {
            const data = JSON.parse(line);
            this.purchaseLog.set(data.transactionId, data);
            loaded++;
          } catch (error) {
            console.warn('跳过无效的购买日志行:', line.substring(0, 50));
          }
        }

        console.log(`📂 [支付系统] 加载购买记录: ${loaded}条`);
      }
    } catch (error) {
      console.error('❌ 加载购买日志失败:', error);
    }
  }

  /**
   * 获取支付统计数据
   */
  async getPaymentStats() {
    try {
      const logs = Array.from(this.purchaseLog.values());

      if (logs.length === 0) {
        return {
          totalPurchases: 0,
          totalCoins: 0,
          totalRevenue: 0,
          byPackage: {}
        };
      }

      const stats = {
        totalPurchases: logs.length,
        totalCoins: logs.reduce((sum, log) => sum + log.coins, 0),
        totalRevenue: 0, // 实际接入时根据 packageId 计算收入
        byPackage: {}
      };

      logs.forEach(log => {
        const pkgName = log.packageId || 'unknown';
        stats.byPackage[pkgName] = (stats.byPackage[pkgName] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ 获取支付统计失败:', error);
      return null;
    }
  }

  /**
   * 清理过期的购买日志（超过30天）
   */
  async cleanupOldLogs() {
    try {
      const logFile = this.purchaseLogPath;
      if (!await fs.pathExists(logFile)) {
        return;
      }

      const lines = await fs.readFile(logFile, 'utf8');
      const logs = lines.split('\n').filter(line => line.trim());

      const now = Date.now();
      const maxAge = 30 * 24 * 3600000; // 30天
      const validLogs = [];

      let cleaned = 0;
      for (const line of logs) {
        try {
          const log = JSON.parse(line);
          const logTime = new Date(log.timestamp).getTime();

          if (now - logTime < maxAge) {
            validLogs.push(line);
          } else {
            cleaned++;
          }
        } catch (error) {
          // 保留无法解析的行
          validLogs.push(line);
        }
      }

      if (cleaned > 0) {
        await fs.writeFile(logFile, validLogs.join('\n') + '\n');
        console.log(`🧹 [支付系统] 清理过期购买日志: ${cleaned}条`);
      }
    } catch (error) {
      console.error('❌ 清理购买日志失败:', error);
    }
  }
}

export default PaymentManager;
