// builder.js
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const UPLOADS_DIR = './uploads'; // 临时文件目录

// 将核心逻辑封装并导出
export async function runFlutterBuild(buildId = 'default_build') {
    const FLUTTER_PATH = path.resolve('../flutterPack-master');
    const RESOURCES_PATH = path.resolve('./resources');
    const JSON_FILE = './resources/data.json';
    const FLUTTER_ASSETS_DIR = path.join(FLUTTER_PATH, 'assets/videos');
    const FLUTTER_CONFIG_JSON = path.join(FLUTTER_PATH, 'assets/config.json');

    try {
        console.log(`[${buildId}] 🚀 开始自动化打包流程...`);

        // 1. 读取并解析 JSON
        const rawData = await fs.readFile(JSON_FILE, 'utf-8');
        const data = JSON.parse(rawData);

        // 2. 准备目录
        await fs.mkdir(FLUTTER_ASSETS_DIR, { recursive: true });

        // 3. 循环处理节点和视频
        for (const key in data.nodes) {
            const nodeId = data.nodes[key].id.trim() || key;
            const videoFileName = `${nodeId}.mp4`;
            const localVideoPath = path.join(RESOURCES_PATH, videoFileName);

            try {
                await fs.access(localVideoPath);
                await fs.copyFile(localVideoPath, path.join(FLUTTER_ASSETS_DIR, videoFileName));
                data.nodes[key].mediaSrc = `assets/videos/${videoFileName}`;
                data.nodes[key].mediaType = 'video';
            } catch (e) {
                console.warn(`⚠️ 跳过缺失视频: ${videoFileName}`);
            }
        }

        // 4. 写入 Flutter 配置
        await fs.writeFile(FLUTTER_CONFIG_JSON, JSON.stringify(data, null, 2));

        // 5. 执行编译
        console.log('🛠️ 正在执行 Flutter Build...');
        console.log('💡 提示: 首次编译可能需要 10-30 分钟，后续编译会快很多');

        // 使用优化参数提升编译速度
        const { stdout } = await execAsync(
            'flutter build windows --release',
            {
                cwd: FLUTTER_PATH,
                maxBuffer: 1024 * 1024 * 10, // 增加输出缓冲区大小
                env: { ...process.env, FLUTTER_FRAMEWORK增压: 'true' }
            }
        );

        console.log('✅ 打包成功');

        // 清理临时文件
        await cleanupUploads();

        return { success: true, buildId, output: stdout };

    } catch (error) {
        console.error('❌ 打包失败:', error);
        throw error; // 抛出异常让主函数捕获
    }
}

/**
 * 清理 uploads 目录中的临时 JSON 文件
 */
async function cleanupUploads() {
    try {
        // 检查 uploads 目录是否存在
        try {
            await fs.access(UPLOADS_DIR);
        } catch {
            // 目录不存在，无需清理
            return;
        }

        console.log('\n🧹 正在清理临时文件...');

        // 读取目录中的所有文件
        const files = await fs.readdir(UPLOADS_DIR);
        let deletedCount = 0;

        // 删除所有 JSON 文件
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(UPLOADS_DIR, file);
                await fs.unlink(filePath);
                deletedCount++;
                console.log(`  ✓ 已删除: ${file}`);
            }
        }

        if (deletedCount > 0) {
            console.log(`✅ 清理完成，共删除 ${deletedCount} 个临时文件`);
        } else {
            console.log('ℹ️  没有需要清理的临时文件');
        }
    } catch (error) {
        console.warn('⚠️  清理临时文件时出现警告:', error.message);
        // 不中断构建流程，即使清理失败
    }
}