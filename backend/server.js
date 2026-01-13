import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFlutterBuild } from './src/services/build/flutterBuilder.js';
import { buildExe } from './src/services/build/flutterBuilderNew.js';
import scriptRoutes from './src/routes/scriptRoutes.js';

// --- 路径变量配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// --- 中间件 ---
// 允许跨域请求
app.use(cors());
// 解析 JSON 请求体
app.use(express.json());
// 托管 public 文件夹下的静态资源 (如 index.html, css, js)
app.use(express.static('public'));

// --- 基础路由 ---

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 剧本管理路由
app.use('/api/scripts', scriptRoutes);

// 默认首页路由 (如果 public 里没有 index.html)
app.get('/', (req, res) => {
  res.send('Node.js 项目已成功启动');
});

// app.post('/api/start-build', async (req, res) => {
//     try {
//         const result = await runBuildTask(req.body);
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// server.js
let isBuilding = false; // 简单的锁，防止重复触发
app.get('/api/start-build', (req, res) => {
    if (isBuilding) {
        return res.json({ success: false, message: '当前已有打包任务在运行中，请勿重复触发' });
    }

    // 1. 立即给前端响应
    res.json({ success: true, message: '打包任务已在后台启动，请观察控制台输出' });

    // 2. 在后台异步执行，不使用 await 阻塞响应
    isBuilding = true;
    runFlutterBuild ('async-task-' + Date.now())
        .then(result => {
            console.log('后台打包完成:', result);
        })
        .catch(err => {
            console.error('后台打包失败:', err.message);
        })
        .finally(() => {
            isBuilding = false; // 任务结束，释放锁
        });
});

// server.js
app.get('/api/start-build-new', async (req, res) => {
    if (isBuilding) {
        return res.json({ success: false, message: '当前已有打包任务在运行中，请勿重复触发' });
    }

    const { projectPath } = req.query;

    if (!projectPath) {
        return res.status(400).json({ success: false, message: '缺少项目路径参数' });
    }

    // 1. 立即给前端响应
    res.json({ success: true, message: '打包任务已在后台启动，请观察控制台输出' });

    // 2. 在后台异步执行，不使用 await 阻塞响应
    isBuilding = true;
    buildExe(projectPath)
        .then(result => {
            console.log('后台打包完成:', result);
        })
        .catch(err => {
            console.error('后台打包失败:', err.message);
        })
        .finally(() => {
            isBuilding = false; // 任务结束，释放锁
        });
});

// --- 启动服务 ---
app.listen(PORT, () => {
  console.log(`\n==================================`);
  console.log(`🚀 服务已启动!`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`==================================\n`);
});