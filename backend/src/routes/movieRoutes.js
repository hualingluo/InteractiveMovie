import express from 'express';
import MovieData from '../models/MovieData.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/movies/import
 * 从JSON文件导入电影数据到数据库
 * Body: { name: "电影名称", filePath: "文件路径(可选)" }
 */
router.post('/import', async (req, res) => {
  try {
    const { name, filePath } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请提供电影名称'
      });
    }

    // 如果提供了文件路径,从文件读取
    if (filePath) {
      try {
        const fullPath = path.resolve(filePath);
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        const result = await MovieData.create(name, jsonData);

        if (result.success) {
          return res.status(201).json({
            success: true,
            message: `成功从文件导入电影数据: ${name}`,
            data: {
              id: result.id,
              name: name
            }
          });
        } else {
          return res.status(400).json(result);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `读取或解析文件失败: ${error.message}`
        });
      }
    }

    // 如果请求体直接包含data
    if (req.body.data) {
      const result = await MovieData.create(name, req.body.data);

      if (result.success) {
        return res.status(201).json({
          success: true,
          message: `成功创建电影数据: ${name}`,
          data: {
            id: result.id,
            name: name
          }
        });
      } else {
        return res.status(400).json(result);
      }
    }

    return res.status(400).json({
      success: false,
      message: '请提供文件路径(filePath)或直接提供数据(data)'
    });
  } catch (error) {
    console.error('导入电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * POST /api/movies
 * 创建新的电影数据(直接从请求体获取JSON数据)
 * Body: { name: "电影名称", data: {...} }
 */
router.post('/', async (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name || !data) {
      return res.status(400).json({
        success: false,
        message: '请提供电影名称和数据'
      });
    }

    const result = await MovieData.create(name, data);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: `成功创建电影数据: ${name}`,
        data: {
          id: result.id,
          name: name
        }
      });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('创建电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * GET /api/movies
 * 获取所有电影列表(不含完整JSON数据)
 */
router.get('/', async (req, res) => {
  try {
    const movies = await MovieData.getAll();

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('获取电影列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/name/:name
 * 根据名称获取电影数据
 */
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const movie = await MovieData.getByName(name);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `未找到名称为 "${name}" 的电影数据`
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('获取电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/:id
 * 根据ID获取电影数据
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await MovieData.getById(parseInt(id));

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${id} 的电影数据`
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('获取电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * PUT /api/movies/name/:name
 * 根据名称更新电影数据
 * Body: { data: {...} }
 */
router.put('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: '请提供更新数据'
      });
    }

    const result = await MovieData.update(name, data);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('更新电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * PUT /api/movies/:id
 * 根据ID更新电影数据
 * Body: { data: {...} }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: '请提供更新数据'
      });
    }

    const result = await MovieData.updateById(parseInt(id), data);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('更新电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * DELETE /api/movies/name/:name
 * 根据名称删除电影数据
 */
router.delete('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await MovieData.delete(name);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * DELETE /api/movies/:id
 * 根据ID删除电影数据
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MovieData.deleteById(parseInt(id));

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除电影数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

export default router;
