import fs from 'fs-extra';
import path from 'path';

/**
 * 用户数据管理器 - 处理金币和解锁状态
 * 数据存储在 users.json 文件中
 */
class UserDataManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    this.data = null;
  }

  /**
   * 初始化 - 加载用户数据
   */
  async init() {
    await fs.ensureDir(this.dataDir);

    if (await fs.pathExists(this.usersFile)) {
      this.data = await fs.readJson(this.usersFile);
    } else {
      // 创建初始数据结构
      this.data = {
        defaultUser: {
          coins: 1000,
          unlockedNodes: []
        }
      };
      await this.save();
    }
  }

  /**
   * 保存数据到文件
   */
  async save() {
    await fs.writeJson(this.usersFile, this.data, { spaces: 2 });
  }

  /**
   * 获取用户金币余额
   */
  getCoins(userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }
    return this.data[userId].coins;
  }

  /**
   * 获取已解锁节点列表
   */
  getUnlockedNodes(userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }
    return this.data[userId].unlockedNodes;
  }

  /**
   * 检查节点是否已解锁
   */
  isNodeUnlocked(nodeId, userId = 'defaultUser') {
    const unlockedNodes = this.getUnlockedNodes(userId);
    return unlockedNodes.includes(nodeId);
  }

  /**
   * 使用金币解锁节点
   */
  async unlockWithCoins(nodeId, price, userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }

    const user = this.data[userId];

    // 检查金币是否足够
    if (user.coins < price) {
      return {
        success: false,
        message: `金币不足！需要 ${price} 金币，当前余额 ${user.coins}`,
        currentCoins: user.coins
      };
    }

    // 检查是否已解锁
    if (user.unlockedNodes.includes(nodeId)) {
      return {
        success: true,
        message: '节点已解锁',
        currentCoins: user.coins,
        alreadyUnlocked: true
      };
    }

    // 扣除金币并解锁
    user.coins -= price;
    user.unlockedNodes.push(nodeId);

    await this.save();

    return {
      success: true,
      message: `成功解锁！消耗 ${price} 金币`,
      currentCoins: user.coins,
      unlockedNodes: user.unlockedNodes
    };
  }

  /**
   * 观看广告解锁节点
   */
  async unlockWithAd(nodeId, userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }

    const user = this.data[userId];

    // 检查是否已解锁
    if (user.unlockedNodes.includes(nodeId)) {
      return {
        success: true,
        message: '节点已解锁',
        alreadyUnlocked: true
      };
    }

    // 模拟广告播放时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 解锁节点
    user.unlockedNodes.push(nodeId);

    await this.save();

    return {
      success: true,
      message: '广告观看完成，成功解锁！',
      unlockedNodes: user.unlockedNodes
    };
  }

  /**
   * 添加金币（用于测试）
   */
  async addCoins(amount, userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }

    this.data[userId].coins += amount;
    await this.save();

    return {
      success: true,
      message: `获得 ${amount} 金币`,
      currentCoins: this.data[userId].coins
    };
  }

  /**
   * 重置用户数据（用于测试）
   */
  async resetUser(userId = 'defaultUser') {
    this.data[userId] = {
      coins: 1000,
      unlockedNodes: []
    };
    await this.save();

    return {
      success: true,
      message: '用户数据已重置'
    };
  }

  /**
   * 获取用户完整信息
   */
  getUserInfo(userId = 'defaultUser') {
    if (!this.data[userId]) {
      this.data[userId] = { coins: 1000, unlockedNodes: [] };
    }
    return {
      coins: this.data[userId].coins,
      unlockedNodes: this.data[userId].unlockedNodes,
      userId: userId
    };
  }
}

export default UserDataManager;
