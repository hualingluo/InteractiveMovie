# SQL 文件夹

本文件夹包含数据库初始化和管理的 SQL 脚本。

## 文件说明

### `init_database.sql`
数据库初始化脚本,包含以下内容:

- 创建 `movie` 数据库
- 创建主要数据表:
  - `movie_data`: 存储互动电影的 JSON 数据
  - `system_config`: 系统配置表(用于存储 API Keys 等配置)
  - `users`: 用户表(预留,用于未来扩展)
  - `build_tasks`: 构建任务表(用于追踪 Flutter 打包任务)
  - **`movies_square`**: 创作广场表 ⭐
  - **`movie_comments`**: 电影评论表 ⭐
  - **`user_favorites`**: 用户收藏表 ⭐
  - **`user_ratings`**: 用户评分表 ⭐

## 使用方法

### 1. 创建数据库

在 MySQL 命令行或客户端工具中执行:

```bash
mysql -u root -p < sql/init_database.sql
```

或者在 MySQL 客户端中:

```sql
source /path/to/sql/init_database.sql;
```

### 2. 配置环境变量

在后端项目根目录创建 `.env` 文件,配置数据库连接信息:

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=movie

# Gemini API Key 配置
GEMINI_API_KEY=your_gemini_api_key_here

# 服务器配置
PORT=3002
```

### 3. 验证数据库连接

启动后端服务后,会自动测试数据库连接:

```bash
cd backend
npm start
```

看到以下输出表示连接成功:
```
✅ 数据库连接成功
```

## 数据表结构

### movie_data 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| name | VARCHAR(255) | 电影名称,唯一 |
| json_data | LONGTEXT | 电影的完整 JSON 数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### system_config 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| config_key | VARCHAR(100) | 配置键名,唯一 |
| config_value | TEXT | 配置值 |
| description | VARCHAR(500) | 配置说明 |
| is_encrypted | TINYINT(1) | 是否加密存储 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### users 表 (预留)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| username | VARCHAR(50) | 用户名,唯一 |
| email | VARCHAR(100) | 邮箱,唯一 |
| password_hash | VARCHAR(255) | 密码哈希 |
| role | ENUM | 用户角色 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### build_tasks 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| project_name | VARCHAR(255) | 项目名称 |
| project_path | VARCHAR(500) | 项目路径 |
| status | ENUM | 任务状态 |
| error_message | TEXT | 错误信息 |
| build_file_path | VARCHAR(500) | 生成文件路径 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### movies_square 表 ⭐ 创作广场核心表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| project_id | VARCHAR(100) | 项目唯一ID |
| name | VARCHAR(255) | 电影名称 |
| description | TEXT | 电影描述 |
| cover_url | VARCHAR(500) | 封面图片URL |
| author_id | INT UNSIGNED | 作者用户ID |
| author_name | VARCHAR(100) | 作者名称 |
| category | VARCHAR(50) | 电影分类 |
| tags | JSON | 标签列表(JSON数组) |
| status | ENUM | 发布状态(draft/published/archived) |
| view_count | INT UNSIGNED | 浏览次数 |
| play_count | INT UNSIGNED | 播放次数 |
| like_count | INT UNSIGNED | 点赞次数 |
| favorite_count | INT UNSIGNED | 收藏次数 |
| rating_avg | DECIMAL(3,2) | 平均评分(0.00-5.00) |
| rating_count | INT UNSIGNED | 评分人数 |
| duration | INT UNSIGNED | 预计时长(秒) |
| node_count | INT UNSIGNED | 剧情节点数量 |
| character_count | INT UNSIGNED | 角色数量 |
| is_featured | TINYINT(1) | 是否为精选作品 |
| is_verified | TINYINT(1) | 是否为官方认证 |
| language | VARCHAR(10) | 语言 |
| version | VARCHAR(20) | 版本号 |
| project_data_path | VARCHAR(500) | 完整项目数据文件路径 |
| published_at | TIMESTAMP | 发布时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### movie_comments 表 ⭐ 电影评论表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| movie_id | INT UNSIGNED | 电影ID |
| user_id | INT UNSIGNED | 评论用户ID |
| user_name | VARCHAR(100) | 评论用户名 |
| content | TEXT | 评论内容 |
| parent_id | INT UNSIGNED | 父评论ID(用于回复) |
| like_count | INT UNSIGNED | 点赞数 |
| status | ENUM | 审核状态 |
| created_at | TIMESTAMP | 评论时间 |
| updated_at | TIMESTAMP | 更新时间 |

### user_favorites 表 ⭐ 用户收藏表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| user_id | INT UNSIGNED | 用户ID |
| movie_id | INT UNSIGNED | 电影ID |
| created_at | TIMESTAMP | 收藏时间 |

### user_ratings 表 ⭐ 用户评分表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键,自增 |
| user_id | INT UNSIGNED | 用户ID |
| movie_id | INT UNSIGNED | 电影ID |
| rating | TINYINT UNSIGNED | 评分(1-5) |
| created_at | TIMESTAMP | 评分时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 安全建议

1. **不要在数据库中直接存储 API Keys**: 推荐使用环境变量或密钥管理服务
2. **定期备份**: 建议设置定期备份策略
3. **权限管理**: 为数据库用户配置最小必要权限
4. **加密敏感数据**: 对于必须存储的敏感信息,使用加密存储

## 维护说明

如需修改数据库结构,请:
1. 创建新的迁移 SQL 文件 (如 `migration_v1.0.1.sql`)
2. 在文件开头注明修改内容和日期
3. 更新本 README 文档
