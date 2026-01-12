# Flutter 互动电影构建系统

这是一个 Node.js 后端服务，可以通过 JSON 配置文件动态构建 Flutter 互动电影应用。

## 功能特性

- 📤 上传 JSON 配置文件
- 🤖 自动修改 Flutter 项目中的 rawJson 内容
- 🔨 支持多平台构建（Android APK、Windows EXE、Web）
- 📊 实时构建状态查询
- 📥 构建完成后自动提供下载
- 🎨 友好的 Web 界面

## 系统要求

### 后端环境
- Node.js 16+
- npm 或 yarn

### Flutter 构建环境
- Flutter SDK
- Android SDK (构建 APK)
- Visual Studio (构建 Windows 应用)

## 安装步骤

1. **安装依赖**
```bash
cd backend
npm install
```

2. **配置 Flutter 路径**

打开 `server.js`，确保 `flutterProjectPath` 指向正确的 Flutter 项目路径：
```javascript
const flutterProjectPath = path.join(__dirname, '../flutter_player');
```

3. **启动服务器**
```bash
npm start
```

开发模式（自动重启）：
```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

## 使用方法

### Web 界面

1. 打开浏览器访问 `http://localhost:3000`
2. 选择构建平台（Android/Windows/Web）
3. 上传 JSON 配置文件
4. 点击"开始构建"
5. 等待构建完成并下载

### API 接口

#### 1. 上传 JSON 并构建
```bash
POST /api/build
Content-Type: multipart/form-data

参数:
- json: JSON 文件
- platform: 构建平台 (apk/windows/web)，默认 apk

返回:
{
  "success": true,
  "buildId": "uuid",
  "message": "构建已开始",
  "statusUrl": "/api/build/status/{buildId}"
}
```

#### 2. 查询构建状态
```bash
GET /api/build/status/:buildId

返回:
{
  "status": "building" | "completed" | "failed",
  "result": { ... },
  "timestamp": "2024-01-08T..."
}
```

#### 3. 下载构建文件
```bash
GET /api/build/download/:buildId
```

#### 4. 获取所有构建历史
```bash
GET /api/builds
```

## JSON 文件格式

上传的 JSON 必须符合以下格式：

```json
{
  "nodes": {
    "start": {
      "id": "start",
      "title": "节点标题",
      "content": "节点内容描述",
      "mediaSrc": "视频URL",
      "options": [
        {
          "label": "选项文本",
          "targetId": "目标节点ID"
        }
      ]
    }
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

**必需字段:**
- `nodes`: 包含所有节点对象
- `viewport`: 视口配置
- `start`: 必须存在一个 ID 为 "start" 的起始节点

## 目录结构

```
backend/
├── server.js           # 主服务器文件
├── package.json        # 依赖配置
├── uploads/            # 临时上传文件（自动清理）
├── builds/             # 构建输出目录
│   ├── {buildId}.json  # 构建状态文件
│   └── {buildId}/      # 构建产物
└── public/
    └── index.html      # Web 界面
```

## 工作流程

1. 用户上传 JSON 文件
2. 服务器验证 JSON 格式
3. 服务器自动修改 Flutter 项目的 `lib/main.dart` 文件
4. 替换 `rawJson` 常量的内容为上传的 JSON
5. 执行 Flutter 构建命令
6. 将构建产物复制到输出目录
7. 提供下载链接

## 注意事项

- 构建过程可能需要几分钟，请耐心等待
- 确保 Flutter 环境已正确配置
- Windows 构建需要 Visual Studio 安装 C++ 桌面开发工具
- 首次构建可能需要更长时间（Flutter 下载依赖）

## 故障排除

### 构建失败
- 检查 Flutter 环境：`flutter doctor`
- 确认有足够的磁盘空间
- 查看服务器日志获取详细错误信息

### 下载失败
- 确认构建状态为 `completed`
- 检查 `builds/` 目录权限

### JSON 验证失败
- 确保包含 `nodes` 和 `viewport` 字段
- 确保存在 `start` 节点
- 检查 JSON 语法是否正确

## 技术栈

- **后端**: Node.js + Express
- **文件上传**: Multer
- **构建**: Flutter CLI
- **前端**: 原生 HTML/CSS/JavaScript

## 许可证

MIT