-- ============================================
-- 互动电影系统 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `movie` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `movie`;

-- ============================================
-- 电影数据表
-- 用于存储互动电影的完整 JSON 数据
-- ============================================
CREATE TABLE IF NOT EXISTS `movie_data` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '电影数据ID',
  `name` VARCHAR(255) NOT NULL UNIQUE COMMENT '电影名称',
  `json_data` LONGTEXT NOT NULL COMMENT '电影JSON数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_name` (`name`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电影数据表';

-- ============================================
-- 系统配置表 (可选)
-- 用于存储系统级配置,包括 API Keys 等
-- ============================================
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键名',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '配置说明',
  `is_encrypted` TINYINT(1) DEFAULT 0 COMMENT '是否加密存储',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 插入默认配置 (可选)
-- ============================================
-- 注意: 实际使用时应该在后端环境变量中配置 GEMINI_API_KEY
-- 这里只是为了演示配置表的用法,不应该在代码中直接从数据库读取敏感信息
-- INSERT INTO `system_config` (`config_key`, `config_value`, `description`, `is_encrypted`)
-- VALUES
-- ('GEMINI_API_KEY', 'your-api-key-here', 'Gemini AI API Key', 1);

-- ============================================
-- 用户表 (可选,用于未来扩展)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `role` ENUM('admin', 'user', 'viewer') DEFAULT 'user' COMMENT '用户角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 构建任务表 (可选,用于追踪打包任务)
-- ============================================
CREATE TABLE IF NOT EXISTS `build_tasks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  `project_name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `project_path` VARCHAR(500) DEFAULT NULL COMMENT '项目路径',
  `status` ENUM('pending', 'building', 'success', 'failed') DEFAULT 'pending' COMMENT '任务状态',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `build_file_path` VARCHAR(500) DEFAULT NULL COMMENT '生成文件路径',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='构建任务表';

-- ============================================
-- 创作广场表 (Movies Square)
-- 用于存储发布到创作广场的互动电影项目
-- ============================================
CREATE TABLE IF NOT EXISTS `movies_square` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '发布电影ID',
  `project_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '项目唯一ID',
  `name` VARCHAR(255) NOT NULL COMMENT '电影名称',
  `description` TEXT DEFAULT NULL COMMENT '电影描述',
  `cover_url` VARCHAR(500) DEFAULT NULL COMMENT '封面图片URL',
  `author_id` INT UNSIGNED DEFAULT NULL COMMENT '作者用户ID',
  `author_name` VARCHAR(100) DEFAULT '匿名创作者' COMMENT '作者名称',
  `category` VARCHAR(50) DEFAULT '其他' COMMENT '电影分类',
  `tags` JSON DEFAULT NULL COMMENT '标签列表 (JSON数组)',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'published' COMMENT '发布状态',
  `view_count` INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
  `play_count` INT UNSIGNED DEFAULT 0 COMMENT '播放次数',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞次数',
  `favorite_count` INT UNSIGNED DEFAULT 0 COMMENT '收藏次数',
  `rating_avg` DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分 (0.00-5.00)',
  `rating_count` INT UNSIGNED DEFAULT 0 COMMENT '评分人数',
  `duration` INT UNSIGNED DEFAULT NULL COMMENT '预计时长(秒)',
  `node_count` INT UNSIGNED DEFAULT 0 COMMENT '剧情节点数量',
  `character_count` INT UNSIGNED DEFAULT 0 COMMENT '角色数量',
  `is_featured` TINYINT(1) DEFAULT 0 COMMENT '是否为精选作品',
  `is_verified` TINYINT(1) DEFAULT 0 COMMENT '是否为官方认证',
  `language` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
  `version` VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号',
  `project_data_path` VARCHAR(500) DEFAULT NULL COMMENT '完整项目数据文件路径',
  `published_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_author_id` (`author_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_published_at` (`published_at`),
  INDEX `idx_view_count` (`view_count`),
  INDEX `idx_rating_avg` (`rating_avg`),
  INDEX `idx_is_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作广场表';

-- ============================================
-- 电影评论表 (Movie Comments)
-- 用于存储创作广场中电影的评论
-- ============================================
CREATE TABLE IF NOT EXISTS `movie_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
  `movie_id` INT UNSIGNED NOT NULL COMMENT '电影ID',
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT '评论用户ID',
  `user_name` VARCHAR(100) DEFAULT '匿名用户' COMMENT '评论用户名',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父评论ID (用于回复)',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `status` ENUM('pending', 'approved', 'rejected', 'deleted') DEFAULT 'approved' COMMENT '审核状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_movie_id` (`movie_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`movie_id`) REFERENCES `movies_square`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电影评论表';

-- ============================================
-- 用户收藏表 (User Favorites)
-- 用于存储用户收藏的电影
-- ============================================
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `movie_id` INT UNSIGNED NOT NULL COMMENT '电影ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',

  UNIQUE KEY `unique_user_movie` (`user_id`, `movie_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_movie_id` (`movie_id`),
  FOREIGN KEY (`movie_id`) REFERENCES `movies_square`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- ============================================
-- 用户评分表 (User Ratings)
-- 用于存储用户对电影的评分
-- ============================================
CREATE TABLE IF NOT EXISTS `user_ratings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '评分ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `movie_id` INT UNSIGNED NOT NULL COMMENT '电影ID',
  `rating` TINYINT UNSIGNED NOT NULL COMMENT '评分 (1-5)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评分时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY `unique_user_movie_rating` (`user_id`, `movie_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_movie_id` (`movie_id`),
  INDEX `idx_rating` (`rating`),
  FOREIGN KEY (`movie_id`) REFERENCES `movies_square`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户评分表';

-- ============================================
-- 显示表结构
-- ============================================
SHOW TABLES;

-- ============================================
-- 插入模拟数据
-- ============================================

-- 插入 movies_square 模拟数据
INSERT INTO `movies_square` (
  `project_id`,
  `name`,
  `description`,
  `cover_url`,
  `author_id`,
  `author_name`,
  `category`,
  `tags`,
  `status`,
  `view_count`,
  `play_count`,
  `like_count`,
  `favorite_count`,
  `rating_avg`,
  `rating_count`,
  `duration`,
  `node_count`,
  `character_count`,
  `is_featured`,
  `is_verified`,
  `language`,
  `version`
) VALUES
('proj_001', '星际迷航：未知的边界', '在2157年，人类首次发现虫洞技术。你将扮演一名年轻的飞船船长，在银河系中探索未知星球，与外星文明建立联系，并揭开一个古老的宇宙秘密。你的每一个选择都将决定人类文明的命运。', 'https://example.com/covers/star-trek.jpg', 1, '星际探索者', '科幻', '["科幻", "冒险", "太空", "外星文明"]', 'published', 15234, 8923, 1245, 678, 4.5, 234, 3600, 45, 8, 1, 1, 'zh-CN', '1.0.0'),

('proj_002', '暮光之城：爱情抉择', '作为一名普通的大学生，你意外发现自己处于吸血鬼与狼人的世界中心。你将面临艰难的选择：是选择神秘优雅的吸血鬼爱德华，还是选择温暖热情的狼人雅各布？每个分支都有不同的结局等待发现。', 'https://example.com/covers/twilight.jpg', 2, '浪漫小说家', '爱情', '["爱情", "奇幻", "悬疑", "多结局"]', 'published', 28456, 15672, 3421, 2103, 4.8, 567, 5400, 38, 6, 1, 0, 'zh-CN', '1.2.0'),

('proj_003', '逃离密室：生死时刻', '你在一间封闭的密室中醒来，四周充满了危险的机关。你必须利用有限的资源和线索，在限定时间内解开谜题，逃出生天。每一关都是对智慧和勇气的考验，失败的代价是生命。', 'https://example.com/covers/escape-room.jpg', 3, '解谜大师', '悬疑', '["悬疑", "解谜", "逃脱", "惊悚"]', 'published', 8765, 5432, 987, 432, 4.2, 156, 2400, 25, 3, 0, 1, 'zh-CN', '1.0.0'),

('proj_004', '武林外传：江湖之路', '明朝万历年间，你来到七侠镇的同福客栈。在这里，你将遇到白展堂、佟湘玉等一众江湖豪杰。你是选择成为一名侠肝义胆的侠客，还是精明能干的商人，抑或是深藏不露的高手？江湖路远，全凭你的选择。', 'https://example.com/covers/wulin.jpg', 4, '武侠迷', '武侠', '["武侠", "古装", "喜剧", "江湖"]', 'published', 19876, 12453, 2876, 1534, 4.7, 445, 4800, 52, 12, 1, 0, 'zh-CN', '2.0.0'),

('proj_005', '都市传说：午夜凶铃', '当你接到一个神秘的午夜电话时，噩梦开始了。你必须在七天内解开诅咒的真相，否则将面临可怕的后果。探索城市的阴暗角落，揭开尘封的秘密，挑战心理承受能力的极限。', 'https://example.com/covers/horror.jpg', 5, '恐怖爱好者', '恐怖', '["恐怖", "悬疑", "心理", "超自然"]', 'published', 12345, 6789, 876, 345, 4.0, 189, 3000, 30, 5, 0, 0, 'zh-CN', '1.0.0'),

('proj_006', '魔法学院：觉醒之路', '11岁那年，你收到了霍格沃茨魔法学校的录取通知书。作为麻瓜家庭出身的学生，你将在魔法世界学习咒语、魔药制作，并对抗即将到来的黑暗势力。分院帽会将你分到哪个学院？你的魔法天赋将如何觉醒？', 'https://example.com/covers/magic-school.jpg', 6, '魔法学徒', '奇幻', '["奇幻", "魔法", "校园", "冒险"]', 'published', 34567, 21890, 4567, 2876, 4.9, 678, 6000, 65, 15, 1, 1, 'zh-CN', '1.5.0'),

('proj_007', '美食猎人：味蕾之旅', '作为一名美食评论家，你周游世界寻找传说中的美食。从巴黎的高级餐厅到日本的街头小吃，从四川的麻辣火锅到意大利的手工面食。你的评价将决定餐厅的兴衰，你的味蕾将开启一段难忘的旅程。', 'https://example.com/covers/food-hunter.jpg', 7, '美食家', '生活', '["美食", "旅行", "生活", "文化"]', 'published', 6543, 3210, 543, 234, 4.3, 87, 2400, 20, 8, 0, 0, 'zh-CN', '1.0.0'),

('proj_008', '电竞少年：荣耀之路', '从网吧联赛到世界冠军，这是一个关于梦想、友谊和拼搏的故事。你将扮演一名职业电竞选手，在荣耀的战场上与队友并肩作战，面对强大的对手和内心的挣扎。你能否登顶世界之巅？', 'https://example.com/covers/esports.jpg', 8, '电竞少年', '电竞', '["电竞", "竞技", "青春", "团队"]', 'published', 45678, 28765, 5678, 3456, 4.6, 892, 4200, 40, 10, 1, 0, 'zh-CN', '1.0.0'),

('proj_009', '历史穿越：三国风云', '意外穿越到三国时代，你将在这个英雄辈出的年代找到自己的位置。是选择辅佐刘备匡扶汉室，还是投靠曹操一统天下，抑或是自立为王？你的历史知识将帮助你在乱世中生存，并改变历史的进程。', 'https://example.com/covers/three-kingdoms.jpg', 9, '历史学者', '历史', '["历史", "穿越", "战争", "策略"]', 'published', 23456, 14567, 2345, 1234, 4.4, 345, 5400, 55, 20, 1, 0, 'zh-CN', '1.0.0'),

('proj_010', '侦探事务所：真相之谜', '作为一名私人侦探，你接手了一桩看似普通的失踪案。然而，随着调查的深入，你发现这背后隐藏着一个巨大的阴谋。收集线索、审讯嫌疑人、还原真相，你能否在凶手再次出手前解开谜团？', 'https://example.com/covers/detective.jpg', 10, '推理达人', '推理', '["推理", "悬疑", "犯罪", "侦探"]', 'published', 16789, 10234, 1876, 965, 4.5, 267, 3600, 35, 12, 0, 1, 'zh-CN', '1.1.0'),

-- 草稿状态的项目
('proj_011', '末日求生：最后的避难所', '在丧尸爆发的世界里，你必须带领一群幸存者在废墟中生存。寻找资源、建立防御、面对感染者和其他幸存者的威胁。这个项目仍在开发中。', 'https://example.com/covers/zombie.jpg', 3, '解谜大师', '末世', '["末世", "丧尸", "生存", "冒险"]', 'draft', 0, 0, 0, 0, 0.0, 0, NULL, 60, 10, 0, 0, 'zh-CN', '0.8.0'),

-- 已归档的项目
('proj_012', '童话重述：小红帽', '经典童话的现代改编版本。你将扮演小红帽，在前往外婆家的路上做出各种选择。这是项目的早期版本，已被新版本替代。', 'https://example.com/covers/red-hood.jpg', 11, '童话作家', '童话', '["童话", "儿童", "冒险", "教育"]', 'archived', 3456, 1234, 234, 123, 3.8, 45, 1800, 15, 4, 0, 0, 'zh-CN', '1.0.0');

-- 插入 movie_comments 模拟数据
INSERT INTO `movie_comments` (
  `movie_id`,
  `user_id`,
  `user_name`,
  `content`,
  `parent_id`,
  `like_count`,
  `status`
) VALUES
-- 项目1的评论
(1, 101, '星际粉丝', '太棒了！剧情设计非常精彩，每个分支都有自己的特色，特别是最后的结局完全出乎我的意料！', NULL, 234, 'approved'),
(1, 102, '科幻迷', '画面效果很棒，但是如果能增加更多外星种族的互动就更好了。期待续作！', NULL, 156, 'approved'),
(1, 103, '游戏玩家', '我玩了三遍，每次都选择不同的路线，真是太有意思了！强烈推荐！', NULL, 189, 'approved'),
(1, 101, '星际粉丝', '同意楼上，作者大大辛苦了！', 2, 45, 'approved'),

-- 项目2的评论
(2, 201, '浪漫主义者', '作为暮光之城的粉丝，这个互动版本让我太惊喜了！终于可以自己选择结局了～', NULL, 567, 'approved'),
(2, 202, '爱德华党', '当然选爱德华啊！他和女主的爱情太感人了！', NULL, 345, 'approved'),
(2, 203, '雅各布党', '我站雅各布！他才是最适合女主的人选！', NULL, 298, 'approved'),
(2, 201, '浪漫主义者', '哈哈，两个都很棒，这就是互动电影的魅力所在！', 3, 123, 'approved'),

-- 项目6的评论
(6, 601, '哈利波特迷', '这个让我想起了霍格沃茨的时光！分院帽把我分到了格兰芬多，太激动了！', NULL, 876, 'approved'),
(6, 602, '魔法学院新生', '咒语系统很有趣，学习了！希望后续能增加更多魔法课程。', NULL, 234, 'approved'),

-- 项目8的评论
(8, 801, '电竞老玩家', '作为一个打了十年LOL的玩家，这个作品真的让我回忆起了青春！', NULL, 445, 'approved'),
(8, 802, '路人粉', '不懂电竞的我也能玩得很开心，剧情很感人。', NULL, 167, 'approved'),
(8, 801, '电竞老玩家', '是的！这就是电竞精神的魅力！', 10, 89, 'approved');

-- 插入 user_favorites 模拟数据
INSERT INTO `user_favorites` (
  `user_id`,
  `movie_id`
) VALUES
-- 用户101的收藏
(101, 1), (101, 2), (101, 6), (101, 8),
-- 用户102的收藏
(102, 1), (102, 3), (102, 4), (102, 10),
-- 用户201的收藏
(201, 2), (201, 6), (201, 7),
-- 用户301的收藏
(301, 4), (301, 5), (301, 9),
-- 用户601的收藏
(601, 1), (601, 6), (601, 8), (601, 9), (601, 10),
-- 用户801的收藏
(801, 2), (801, 8), (801, 10);

-- 插入 user_ratings 模拟数据
INSERT INTO `user_ratings` (
  `user_id`,
  `movie_id`,
  `rating`
) VALUES
-- 项目1的评分
(101, 1, 5), (102, 1, 4), (103, 1, 5), (104, 1, 5), (105, 1, 4),
(106, 1, 5), (107, 1, 4), (108, 1, 5), (109, 1, 5), (110, 1, 4),
-- 项目2的评分
(201, 2, 5), (202, 2, 5), (203, 2, 4), (204, 2, 5), (205, 2, 5),
(206, 2, 5), (207, 2, 4), (208, 2, 5), (209, 2, 5), (210, 2, 5),
-- 项目3的评分
(301, 3, 4), (302, 3, 4), (303, 3, 5), (304, 3, 4), (305, 3, 4),
-- 项目6的评分
(601, 6, 5), (602, 6, 5), (603, 6, 5), (604, 6, 5), (605, 6, 5),
(606, 6, 5), (607, 6, 5), (608, 6, 4), (609, 6, 5), (610, 6, 5),
-- 项目8的评分
(801, 8, 5), (802, 8, 4), (803, 8, 5), (804, 8, 5), (805, 8, 4);

-- ============================================
-- 完成
-- ============================================
SELECT 'Database initialization completed successfully!' AS message;
SELECT 'Sample data inserted successfully!' AS message;
