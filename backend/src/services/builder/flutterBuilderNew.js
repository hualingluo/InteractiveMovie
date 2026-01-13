import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置参数 ---
const FLUTTER_PATH = path.resolve(__dirname, '../../../../flutterPack-master');
const SCRIPTS_BASE_DIR = path.join(__dirname, '../../../scripts-storage');
const RESOURCES_BASE_DIR = path.join(__dirname, '../../../resources');
const FLUTTER_ASSETS_DIR = path.join(FLUTTER_PATH, 'assets/videos');
const FLUTTER_CONFIG_JSON = path.join(FLUTTER_PATH, 'assets/config.json');

export async function buildExe(projectPath) {
    try {
        console.log('🚀 开始构建流程...');
        console.log(`📂 项目路径: ${projectPath}`);

        // 1. 检查 Flutter 项目是否存在
        if (!fs.existsSync(FLUTTER_PATH)) {
            throw new Error(`未找到 Flutter 项目: ${FLUTTER_PATH}`);
        }

        // 2. 确定剧本文件路径
        let scriptJsonPath;
        if (projectPath && projectPath.trim() !== '') {
            // 兼容旧逻辑：从 scripts-storage 读取
            const projectFullPath = path.join(SCRIPTS_BASE_DIR, projectPath);
            console.log(`📂 项目完整路径: ${projectFullPath}`);

            // 检查项目目录是否存在
            if (!fs.existsSync(projectFullPath)) {
                throw new Error(`项目目录不存在: ${projectFullPath}`);
            }
            scriptJsonPath = path.join(projectFullPath, 'script.json');
        } else {
            // 新逻辑：从 resources 读取(与videos同级)
            scriptJsonPath = path.join(RESOURCES_BASE_DIR, 'script.json');
            console.log(`📂 使用 resources/script.json`);
        }

        // 3. 检查剧本文件是否存在
        if (!fs.existsSync(scriptJsonPath)) {
            throw new Error(`未找到 script.json: ${scriptJsonPath}`);
        }

        // 4. 读取剧本数据
        console.log('📝 正在读取剧本数据...');
        const storyData = await fs.readJson(scriptJsonPath);
        console.log(`✅ 剧本数据读取成功，包含 ${Object.keys(storyData.nodes || {}).length} 个节点`);

        // 5. 准备 Flutter 内部目录
        const flutterAssetsVideoDir = path.join(FLUTTER_PATH, 'assets/videos');
        await fs.ensureDir(flutterAssetsVideoDir);

        // 6. 注入 JSON 配置到 Flutter 项目
        console.log('📝 正在注入 JSON 配置...');
        await fs.writeJson(FLUTTER_CONFIG_JSON, storyData, { spaces: 2 });

        // 7. 跳过视频资源同步（直接在构建后复制到 release 目录）
        console.log('📽️ 视频将在构建完成后直接复制到 release 目录...');

        // 7. 同步图片资源（从 resources/images 文件夹）
        console.log('🖼️ 正在同步图片资源...');
        const resourcesImagesDir = path.join(RESOURCES_BASE_DIR, 'images');
        const flutterAssetsImageDir = path.join(FLUTTER_PATH, 'assets/images');
        await fs.ensureDir(flutterAssetsImageDir);

        if (fs.existsSync(resourcesImagesDir)) {
            // 读取 resources/images 目录
            const files = await fs.readdir(resourcesImagesDir);
            // 过滤出图片文件
            const imageFiles = files.filter(file =>
                file.endsWith('.jpg') ||
                file.endsWith('.jpeg') ||
                file.endsWith('.png') ||
                file.endsWith('.gif') ||
                file.endsWith('.webp')
            );

            // 复制每个图片文件
            for (const imageFile of imageFiles) {
                const srcPath = path.join(resourcesImagesDir, imageFile);
                const destPath = path.join(flutterAssetsImageDir, imageFile);
                await fs.copy(srcPath, destPath, { overwrite: true });
                console.log(`  ✓ 已复制: ${imageFile}`);
            }

            if (imageFiles.length === 0) {
                console.warn('  ⚠️  警告: 未找到任何图片文件');
            } else {
                console.log(`  ✅ 共复制 ${imageFiles.length} 个图片文件`);
            }
        } else {
            console.warn('  ⚠️  警告: resources/images 文件夹不存在');
        }

        // 8. 更新 pubspec.yaml (确保资源被声明)
        console.log('🛠️ 检查 pubspec.yaml 资源声明...');
        const pubspecPath = path.join(FLUTTER_PATH, 'pubspec.yaml');
        let pubspecContent = await fs.readFile(pubspecPath, 'utf8');

        // 简单的正则表达式检查是否包含 assets 声明，如果没有则添加
        const assetDeclaration = '\n  assets:\n    - assets/data/\n    - assets/videos/\n    - assets/images/\n';
        if (!pubspecContent.includes('assets/')) {
            pubspecContent = pubspecContent.replace('flutter:', `flutter:${assetDeclaration}`);
            await fs.writeFile(pubspecPath, pubspecContent);
        }

        // 9. 执行 Flutter 构建
        console.log('📦 正在调用 Flutter 构建 Windows EXE (这可能需要几分钟)...');
        // 执行命令，并将输出直接打印到控制台
        execSync('flutter build windows', {
            cwd: FLUTTER_PATH,
            stdio: 'inherit'
        });

        // 10. 复制视频资源到 release 目录
        console.log('📽️ 正在复制视频到 release 目录...');
        const outputPath = path.join(FLUTTER_PATH, 'build/windows/x64/runner/Release');
        const releaseDataDir = path.join(outputPath, 'data');
        const releaseVideosDir = path.join(releaseDataDir, 'videos');
        const resourcesVideosDir = path.join(RESOURCES_BASE_DIR, 'videos');

        await fs.ensureDir(releaseVideosDir);

        if (fs.existsSync(resourcesVideosDir)) {
            const files = await fs.readdir(resourcesVideosDir);
            const videoFiles = files.filter(file =>
                file.endsWith('.mp4') ||
                file.endsWith('.webm') ||
                file.endsWith('.mov') ||
                file.endsWith('.avi')
            );

            for (const videoFile of videoFiles) {
                const srcPath = path.join(resourcesVideosDir, videoFile);
                const destPath = path.join(releaseVideosDir, videoFile);
                await fs.copy(srcPath, destPath, { overwrite: true });
                console.log(`  ✓ 已复制: ${videoFile} -> release/data/videos/`);
            }

            if (videoFiles.length === 0) {
                console.warn('  ⚠️  警告: 未找到任何视频文件');
            } else {
                console.log(`  ✅ 共复制 ${videoFiles.length} 个视频文件到 release 目录`);
            }
        }

        // 11. 复制 config.json 到 release 目录（作为外部资源）
        console.log('📝 正在复制 config.json 到 release 目录...');
        const releaseConfigPath = path.join(releaseDataDir, 'config.json');
        await fs.copy(FLUTTER_CONFIG_JSON, releaseConfigPath, { overwrite: true });
        console.log(`  ✅ 已复制: config.json -> release/data/config.json`);

        // 12. 整理输出结果
        console.log('\n✅ 构建成功！');
        console.log(`📂 EXE 文件位于: ${outputPath}`);

        return {
            success: true,
            outputPath,
            message: '构建成功'
        };

    } catch (error) {
        console.error('\n❌ 构建失败:');
        console.error(error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 清理 uploads 目录中的临时 JSON 文件
 */
async function cleanupUploads() {
    try {
        const uploadsDir = CONFIG.uploadsDir;

        // 检查 uploads 目录是否存在
        if (!fs.existsSync(uploadsDir)) {
            return;
        }

        console.log('\n🧹 正在清理临时文件...');

        // 读取目录中的所有文件
        const files = await fs.readdir(uploadsDir);
        let deletedCount = 0;

        // 删除所有 JSON 文件
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(uploadsDir, file);
                await fs.remove(filePath);
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