/**
 * 剧本 API 服务 - 通过后端接口保存和加载剧本
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export interface SaveScriptResponse {
  success: boolean;
  message?: string;
  path?: string;
  timestamp?: string;
  error?: string;
}

export interface LoadScriptResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface ScriptProject {
  name: string;
  metadata: any;
  nodeCount: number;
  updatedAt: string;
}

/**
 * 保存剧本到后端
 * @param folderPath 项目文件夹路径（相对于 scripts-storage 目录）
 * @param scriptData 剧本数据
 */
export const saveScriptToBackend = async (
  folderPath: string,
  scriptData: any
): Promise<SaveScriptResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scripts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folderPath,
        scriptData
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '保存失败');
    }

    return result;
  } catch (error: any) {
    console.error('保存剧本到后端失败:', error);
    return {
      success: false,
      message: '保存失败',
      error: error.message
    };
  }
};

/**
 * 从后端加载剧本
 * @param folderPath 项目文件夹路径
 */
export const loadScriptFromBackend = async (
  folderPath: string
): Promise<LoadScriptResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scripts/load?path=${encodeURIComponent(folderPath)}`
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '加载失败');
    }

    return result;
  } catch (error: any) {
    console.error('从后端加载剧本失败:', error);
    return {
      success: false,
      message: '加载失败',
      error: error.message
    };
  }
};

/**
 * 获取所有剧本项目列表
 */
export const listScriptProjects = async (): Promise<{
  success: boolean;
  projects?: ScriptProject[];
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scripts/list`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '获取列表失败');
    }

    return result;
  } catch (error: any) {
    console.error('获取剧本列表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 删除剧本项目
 * @param folderPath 项目文件夹路径
 */
export const deleteScriptProject = async (
  folderPath: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scripts/delete?path=${encodeURIComponent(folderPath)}`,
      {
        method: 'DELETE'
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '删除失败');
    }

    return result;
  } catch (error: any) {
    console.error('删除剧本项目失败:', error);
    return {
      success: false,
      message: '删除失败',
      error: error.message
    };
  }
};

export interface UploadScriptResponse {
  success: boolean;
  message?: string;
  data?: {
    path: string;
    scriptData: any;
    timestamp: string;
  };
  error?: string;
}

/**
 * 上传剧本文件（仅 JSON）
 * @param file 剧本文件 (File)
 * @param projectName 项目名称 (可选)
 */
export const uploadScriptFile = async (
  file: File,
  projectName?: string
): Promise<UploadScriptResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (projectName) {
      formData.append('projectName', projectName);
    }

    const response = await fetch(`${API_BASE_URL}/api/scripts/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '上传失败');
    }

    return result;
  } catch (error: any) {
    console.error('上传剧本文件失败:', error);
    return {
      success: false,
      message: '上传失败',
      error: error.message
    };
  }
};

export interface UploadResourcesResponse {
  success: boolean;
  message?: string;
  data?: {
    uploadedVideos: string[];
    uploadedImages: string[];
    timestamp: string;
  };
  error?: string;
}

/**
 * 上传资源文件（视频和图片）- 用于打包时
 * @param videos 视频文件数组 (File[])
 * @param images 图片文件数组 (File[])
 */
export const uploadResourceFiles = async (
  videos: File[] = [],
  images: File[] = []
): Promise<UploadResourcesResponse> => {
  try {
    const formData = new FormData();

    // 添加视频文件
    videos.forEach(video => {
      formData.append('videos', video);
    });

    // 添加图片文件
    images.forEach(image => {
      formData.append('images', image);
    });

    const response = await fetch(`${API_BASE_URL}/api/scripts/upload-resources`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '上传资源失败');
    }

    return result;
  } catch (error: any) {
    console.error('上传资源文件失败:', error);
    return {
      success: false,
      message: '上传资源失败',
      error: error.message
    };
  }
};

export interface BuildExeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 上传剧本文件到 resources/scripts 目录 - 用于打包时
 * @param scriptData 剧本数据
 */
export const uploadBuildScript = async (
  scriptData: any
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scripts/upload-build-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scriptData
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '上传剧本失败');
    }

    return result;
  } catch (error: any) {
    console.error('上传剧本文件失败:', error);
    return {
      success: false,
      message: '上传剧本失败',
      error: error.message
    };
  }
};

export interface BuildExeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 打包成 Windows EXE
 * @param projectPath 项目路径（可选，如果不提供则使用 resources/scripts/script.json）
 */
export const buildWindowsExe = async (
  projectPath: string
): Promise<BuildExeResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/start-build-new?projectPath=${encodeURIComponent(projectPath)}`
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '启动打包失败');
    }

    return result;
  } catch (error: any) {
    console.error('打包 EXE 失败:', error);
    return {
      success: false,
      message: '启动打包失败',
      error: error.message
    };
  }
};
