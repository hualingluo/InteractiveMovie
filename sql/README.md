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
