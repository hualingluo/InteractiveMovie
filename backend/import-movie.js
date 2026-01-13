/**
 * 电影数据导入脚本
 *
 * 功能: 将 resources/dataNew.json 文件导入到数据库
 * 使用: node import-movie.js [电影名称]
 *
 * 示例:
 *   node import-movie.js                    # 使用默认名称 "凤起长街"
 *   node import-movie.js "我的电影"         # 使用自定义名称
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import MovieData from './src/models/MovieData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 读取JSON文件
 */
async function readJsonFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    log(`📂 正在读取文件: ${fullPath}`, 'blue');

    const content = await fs.readFile(fullPath, 'utf-8');
    const jsonData = JSON.parse(content);

    log(`✅ 文件读取成功`, 'green');
    return jsonData;
  } catch (error) {
    log(`❌ 读取文件失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 导入电影数据到数据库
 */
async function importMovie(movieName, filePath) {
  log('\n========================================', 'magenta');
  log('   🎬 电影数据导入工具', 'magenta');
  log('========================================\n', 'magenta');

  try {
    // 1. 读取JSON文件
    log('📋 步骤 1/4: 读取JSON文件', 'yellow');
    const jsonData = await readJsonFile(filePath);

    // 显示文件信息
    const nodeCount = Object.keys(jsonData.nodes || {}).length;
    const characterCount = Object.keys(jsonData.characters || {}).length;

    log(`   - 节点数量: ${nodeCount}`, 'blue');
    log(`   - 角色数量: ${characterCount}`, 'blue');
    log(`   - 视口设置: ${JSON.stringify(jsonData.viewport)}`, 'blue');
    log('');

    // 2. 检查电影是否已存在
    log('🔍 步骤 2/4: 检查数据库', 'yellow');
    const exists = await MovieData.exists(movieName);

    if (exists) {
      log(`⚠️  电影 "${movieName}" 已存在于数据库中`, 'yellow');

      // 询问是否覆盖
      log('\n是否要覆盖现有数据? (使用 update 方法)', 'yellow');
      log('注意: 这个脚本默认创建新记录', 'yellow');
      log(`如需更新,请删除原记录后重新导入,或使用 API: PUT /api/movies/name/${movieName}`, 'yellow');

      const updateResult = await MovieData.update(movieName, jsonData);

      if (updateResult.success) {
        log(`✅ 数据更新成功!`, 'green');
        log(`   更新时间: ${new Date().toLocaleString('zh-CN')}`, 'green');
        return true;
      } else {
        log(`❌ 更新失败: ${updateResult.message}`, 'red');
        return false;
      }
    } else {
      log(`✅ 数据库中不存在此电影,可以创建`, 'green');
    }

    // 3. 导入数据到数据库
    log('\n💾 步骤 3/4: 导入数据到数据库', 'yellow');
    const result = await MovieData.create(movieName, jsonData);

    if (result.success) {
      log(`✅ 数据导入成功!`, 'green');
      log(`   数据库ID: ${result.id}`, 'green');
      log(`   电影名称: ${movieName}`, 'green');
    } else {
      log(`❌ 导入失败: ${result.message}`, 'red');
      return false;
    }

    // 4. 验证导入
    log('\n✅ 步骤 4/4: 验证导入结果', 'yellow');
    const importedMovie = await MovieData.getByName(movieName);

    if (importedMovie) {
      const importedNodeCount = Object.keys(importedMovie.data.nodes || {}).length;
      const importedCharacterCount = Object.keys(importedMovie.data.characters || {}).length;

      log(`✅ 验证通过!`, 'green');
      log(`   - 节点数量: ${importedNodeCount}`, 'green');
      log(`   - 角色数量: ${importedCharacterCount}`, 'green');
      log(`   - 创建时间: ${new Date(importedMovie.created_at).toLocaleString('zh-CN')}`, 'green');
      log(`   - 更新时间: ${new Date(importedMovie.updated_at).toLocaleString('zh-CN')}`, 'green');
    } else {
      log(`❌ 验证失败: 无法从数据库读取导入的数据`, 'red');
      return false;
    }

    log('\n========================================', 'magenta');
    log('   🎉 导入完成!', 'magenta');
    log('========================================\n', 'magenta');

    log('💡 提示:', 'yellow');
    log(`   查看API: http://localhost:3002/api/movies/name/${encodeURIComponent(movieName)}`, 'blue');
    log(`   查看列表: http://localhost:3002/api/movies`, 'blue');

    return true;

  } catch (error) {
    log('\n❌ 导入过程中发生错误:', 'red');
    console.error(error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const movieName = args[0] || '凤起长街';
  const filePath = args[1] || 'resources/dataNew.json';

  log(`📽️  准备导入电影: ${movieName}`, 'blue');
  log(`📁 数据文件: ${filePath}`, 'blue');
  log('');

  const success = await importMovie(movieName, filePath);

  process.exit(success ? 0 : 1);
}

// 运行主函数
main();
