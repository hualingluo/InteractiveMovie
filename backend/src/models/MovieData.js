import pool from '../config/database.js';

/**
 * 安全地解析JSON数据
 * @param {any} data - 可能是字符串或对象
 * @returns {object} 解析后的对象
 */
function safeJsonParse(data) {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  return data;
}

/**
 * 电影数据模型类
 * 负责处理 movie_data 表的所有数据库操作
 */
class MovieData {
  /**
   * 创建电影数据
   * @param {string} name - 电影名称
   * @param {object} jsonData - JSON数据
   * @returns {Promise<object>} 创建的结果
   */
  static async create(name, jsonData) {
    try {
      const sql = 'INSERT INTO movie_data (name, json_data) VALUES (?, ?)';
      const [result] = await pool.execute(sql, [name, JSON.stringify(jsonData)]);
      return {
        success: true,
        id: result.insertId,
        message: '电影数据创建成功'
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          message: '电影名称已存在,请使用其他名称或更新操作'
        };
      }
      throw error;
    }
  }

  /**
   * 根据名称获取电影数据
   * @param {string} name - 电影名称
   * @returns {Promise<object|null>} 电影数据或null
   */
  static async getByName(name) {
    try {
      const sql = 'SELECT id, name, json_data, created_at, updated_at FROM movie_data WHERE name = ?';
      const [rows] = await pool.execute(sql, [name]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        data: safeJsonParse(row.json_data),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取电影数据
   * @param {number} id - 电影ID
   * @returns {Promise<object|null>} 电影数据或null
   */
  static async getById(id) {
    try {
      const sql = 'SELECT id, name, json_data, created_at, updated_at FROM movie_data WHERE id = ?';
      const [rows] = await pool.execute(sql, [id]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        data: safeJsonParse(row.json_data),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取所有电影列表(不含JSON数据)
   * @returns {Promise<Array>} 电影列表
   */
  static async getAll() {
    try {
      const sql = 'SELECT id, name, created_at, updated_at FROM movie_data ORDER BY created_at DESC';
      const [rows] = await pool.execute(sql);

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新电影数据
   * @param {string} name - 电影名称
   * @param {object} jsonData - 新的JSON数据
   * @returns {Promise<object>} 更新结果
   */
  static async update(name, jsonData) {
    try {
      const sql = 'UPDATE movie_data SET json_data = ? WHERE name = ?';
      const [result] = await pool.execute(sql, [JSON.stringify(jsonData), name]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '未找到指定的电影数据'
        };
      }

      return {
        success: true,
        message: '电影数据更新成功',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID更新电影数据
   * @param {number} id - 电影ID
   * @param {object} jsonData - 新的JSON数据
   * @returns {Promise<object>} 更新结果
   */
  static async updateById(id, jsonData) {
    try {
      const sql = 'UPDATE movie_data SET json_data = ? WHERE id = ?';
      const [result] = await pool.execute(sql, [JSON.stringify(jsonData), id]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '未找到指定的电影数据'
        };
      }

      return {
        success: true,
        message: '电影数据更新成功',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除电影数据
   * @param {string} name - 电影名称
   * @returns {Promise<object>} 删除结果
   */
  static async delete(name) {
    try {
      const sql = 'DELETE FROM movie_data WHERE name = ?';
      const [result] = await pool.execute(sql, [name]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '未找到指定的电影数据'
        };
      }

      return {
        success: true,
        message: '电影数据删除成功',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID删除电影数据
   * @param {number} id - 电影ID
   * @returns {Promise<object>} 删除结果
   */
  static async deleteById(id) {
    try {
      const sql = 'DELETE FROM movie_data WHERE id = ?';
      const [result] = await pool.execute(sql, [id]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '未找到指定的电影数据'
        };
      }

      return {
        success: true,
        message: '电影数据删除成功',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查电影名称是否存在
   * @param {string} name - 电影名称
   * @returns {Promise<boolean>} 是否存在
   */
  static async exists(name) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM movie_data WHERE name = ?';
      const [rows] = await pool.execute(sql, [name]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default MovieData;
