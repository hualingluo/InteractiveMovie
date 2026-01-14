// 配置服务 - 从后端获取配置信息

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

let cachedGeminiKey: string | null = null;

/**
 * 从后端获取 Gemini API Key
 */
export const getGeminiApiKey = async (): Promise<string> => {
  // 如果已经有缓存的 key,直接返回
  if (cachedGeminiKey) {
    return cachedGeminiKey;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/config/gemini-key`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Gemini API key: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.apiKey) {
      throw new Error('No API key returned from server');
    }

    // 缓存 key
    cachedGeminiKey = data.apiKey;
    return data.apiKey;
  } catch (error) {
    console.error('Error fetching Gemini API key:', error);
    throw error;
  }
};

/**
 * 清除缓存的 API Key (用于登出或刷新等场景)
 */
export const clearCachedApiKey = (): void => {
  cachedGeminiKey = null;
};
