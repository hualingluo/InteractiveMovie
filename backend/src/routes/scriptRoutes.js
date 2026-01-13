import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传中间件（使用内存存储）
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 限制 100MB（支持大视频文件）
  }
});

// 配置剧本存储的基础目录
const SCRIPTS_BASE_DIR = path.join(__dirname, '../../scripts-storage');
// 配置资源存储的基础目录
const RESOURCES_BASE_DIR = path.join(__dirname, '../../resources');

// 确保存储目录存在
fs.ensureDirSync(SCRIPTS_BASE_DIR);
fs.ensureDirSync(RESOURCES_BASE_DIR);
fs.ensureDirSync(path.join(RESOURCES_BASE_DIR, 'videos'));
fs.ensureDirSync(path.join(RESOURCES_BASE_DIR, 'images'));

/**
 * 辅助函数：从路径中提取文件名
 */
function getFileNameFromPath(filePath) {
  if (!filePath) return null;
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

/**
 * 辅助函数：判断是否为视频文件
 */
function isVideoFile(fileName) {
  if (!fileName) return false;
  const ext = path.extname(fileName).toLowerCase();
  return ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
}

/**
 * 辅助函数：判断是否为图片文件
 */
function isImageFile(fileName) {
  if (!fileName) return false;
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
}

/**
 * 保存剧本到指定文件夹
 * POST /api/scripts/save
 *
 * Body:
 * {
 *   "folderPath": "相对路径或项目名称",
 *   "scriptData": { 包含 nodes, metadata 等 }
 * }
 */
router.post('/save', async (req, res) => {
  try {
    const { folderPath, scriptData } = req.body;

    if (!folderPath || !scriptData) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: folderPath 和 scriptData'
      });
    }

    // 构建完整的保存路径
    const targetDir = path.join(SCRIPTS_BASE_DIR, folderPath);

    // 确保目标目录存在
    await fs.ensureDir(targetDir);

    // 保存完整的剧本数据到 script.json
    const scriptFilePath = path.join(targetDir, 'script.json');
    await fs.writeJson(scriptFilePath, {
      ...scriptData,
      updatedAt: new Date().toISOString()
    }, { spaces: 2 });

    // 保存每个节点的独立文件到 scenes 文件夹
    const scenesDir = path.join(targetDir, 'scenes');
    await fs.ensureDir(scenesDir);

    if (scriptData.nodes) {
      for (const [nodeId, nodeData] of Object.entries(scriptData.nodes)) {
        const nodeFilePath = path.join(scenesDir, `${nodeId}.json`);
        await fs.writeJson(nodeFilePath, nodeData, { spaces: 2 });
      }
    }

    res.json({
      success: true,
      message: '剧本保存成功',
      path: targetDir,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('保存剧本失败:', error);
    res.status(500).json({
      success: false,
      message: '保存剧本失败',
      error: error.message
    });
  }
});

/**
 * 读取剧本数据
 * GET /api/scripts/load?path=项目路径
 */
router.get('/load', async (req, res) => {
  try {
    const { path: folderPath } = req.query;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        message: '缺少路径参数'
      });
    }

    const targetDir = path.join(SCRIPTS_BASE_DIR, folderPath);
    const scriptFilePath = path.join(targetDir, 'script.json');

    // 检查文件是否存在
    if (!await fs.pathExists(scriptFilePath)) {
      return res.status(404).json({
        success: false,
        message: '剧本文件不存在'
      });
    }

    // 读取剧本数据
    const scriptData = await fs.readJson(scriptFilePath);

    res.json({
      success: true,
      data: scriptData
    });

  } catch (error) {
    console.error('读取剧本失败:', error);
    res.status(500).json({
      success: false,
      message: '读取剧本失败',
      error: error.message
    });
  }
});

/**
 * 列出所有剧本项目
 * GET /api/scripts/list
 */
router.get('/list', async (req, res) => {
  try {
    const projects = [];
    const dirs = await fs.readdir(SCRIPTS_BASE_DIR, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const scriptPath = path.join(SCRIPTS_BASE_DIR, dir.name, 'script.json');
        if (await fs.pathExists(scriptPath)) {
          const scriptData = await fs.readJson(scriptPath);
          projects.push({
            name: dir.name,
            metadata: scriptData.metadata || {},
            nodeCount: Object.keys(scriptData.nodes || {}).length,
            updatedAt: scriptData.updatedAt
          });
        }
      }
    }

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('列取剧本列表失败:', error);
    res.status(500).json({
      success: false,
      message: '列取剧本列表失败',
      error: error.message
    });
  }
});

/**
 * 删除剧本项目
 * DELETE /api/scripts/delete?path=项目路径
 */
router.delete('/delete', async (req, res) => {
  try {
    const { path: folderPath } = req.query;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        message: '缺少路径参数'
      });
    }

    const targetDir = path.join(SCRIPTS_BASE_DIR, folderPath);

    // 检查目录是否存在
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 删除整个项目目录
    await fs.remove(targetDir);

    res.json({
      success: true,
      message: '项目删除成功'
    });

  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
});

/**
 * 上传剧本文件（仅 JSON，不包含资源文件）
 * POST /api/scripts/upload
 *
 * FormData:
 * - file: 剧本文件 (JSON)
 * - projectName: 项目名称 (可选，如果不提供则使用文件名)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { projectName } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: '缺少上传文件'
      });
    }

    // 解析 JSON 数据
    let scriptData;
    try {
      scriptData = JSON.parse(file.buffer.toString('utf-8'));
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: '文件格式错误：不是有效的 JSON 文件'
      });
    }

    // 验证数据结构
    if (!scriptData.nodes && !scriptData.metadata) {
      return res.status(400).json({
        success: false,
        message: '剧本数据格式错误：缺少 nodes 或 metadata'
      });
    }

    // 确定项目路径
    const folderName = projectName || scriptData.metadata?.id || `imported_${Date.now()}`;
    const folderPath = path.join(SCRIPTS_BASE_DIR, folderName);

    // 确保目录存在
    await fs.ensureDir(folderPath);

    // 保存完整的剧本数据
    const scriptFilePath = path.join(folderPath, 'script.json');
    await fs.writeJson(scriptFilePath, {
      ...scriptData,
      updatedAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    }, { spaces: 2 });

    // 保存每个节点的独立文件到 scenes 文件夹
    const scenesDir = path.join(folderPath, 'scenes');
    await fs.ensureDir(scenesDir);

    if (scriptData.nodes) {
      for (const [nodeId, nodeData] of Object.entries(scriptData.nodes)) {
        const nodeFilePath = path.join(scenesDir, `${nodeId}.json`);
        await fs.writeJson(nodeFilePath, nodeData, { spaces: 2 });
      }
    }

    res.json({
      success: true,
      message: '剧本导入成功',
      data: {
        path: folderName,
        scriptData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('上传剧本失败:', error);
    res.status(500).json({
      success: false,
      message: '上传剧本失败',
      error: error.message
    });
  }
});

/**
 * 上传资源文件（视频和图片）- 用于打包时上传
 * POST /api/scripts/upload-resources
 *
 * FormData:
 * - videos: 视频文件数组
 * - images: 图片文件数组
 */
router.post('/upload-resources', upload.fields([
  { name: 'videos', maxCount: 50 },
  { name: 'images', maxCount: 50 }
]), async (req, res) => {
  try {
    const { videos = [], images = [] } = req.files;

    // 处理视频文件上传
    const uploadedVideos = [];
    if (videos && videos.length > 0) {
      console.log(`📹 正在上传 ${videos.length} 个视频文件到服务器...`);

      for (const video of videos) {
        const fileName = video.originalname;
        const videoPath = path.join(RESOURCES_BASE_DIR, 'videos', fileName);

        // 保存视频文件
        await fs.writeFile(videoPath, video.buffer);
        uploadedVideos.push(fileName);
        console.log(`  ✓ 已保存视频: ${fileName}`);
      }

      console.log(`✅ 共保存 ${videos.length} 个视频文件`);
    }

    // 处理图片文件上传
    const uploadedImages = [];
    if (images && images.length > 0) {
      console.log(`🖼️ 正在上传 ${images.length} 个图片文件到服务器...`);

      for (const image of images) {
        const fileName = image.originalname;
        const imagePath = path.join(RESOURCES_BASE_DIR, 'images', fileName);

        // 保存图片文件
        await fs.writeFile(imagePath, image.buffer);
        uploadedImages.push(fileName);
        console.log(`  ✓ 已保存图片: ${fileName}`);
      }

      console.log(`✅ 共保存 ${images.length} 个图片文件`);
    }

    res.json({
      success: true,
      message: '资源文件上传成功',
      data: {
        uploadedVideos,
        uploadedImages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('上传资源文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传资源文件失败',
      error: error.message
    });
  }
});

/**
 * 上传剧本文件到 resources 目录 - 用于打包时
 * POST /api/scripts/upload-build-script
 *
 * Body:
 * {
 *   "scriptData": { 完整的剧本数据 }
 * }
 */
router.post('/upload-build-script', async (req, res) => {
  try {
    const { scriptData } = req.body;

    if (!scriptData) {
      return res.status(400).json({
        success: false,
        message: '缺少剧本数据'
      });
    }

    // 保存剧本到 resources/script.json (与videos同级)
    const scriptFilePath = path.join(RESOURCES_BASE_DIR, 'script.json');
    await fs.writeJson(scriptFilePath, {
      ...scriptData,
      updatedAt: new Date().toISOString()
    }, { spaces: 2 });

    console.log(`✅ 剧本文件已保存到 ${scriptFilePath}`);

    res.json({
      success: true,
      message: '剧本文件上传成功',
      path: scriptFilePath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('上传剧本文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传剧本文件失败',
      error: error.message
    });
  }
});

export default router;
