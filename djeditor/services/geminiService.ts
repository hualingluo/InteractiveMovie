
import { Type, Modality } from "@google/genai";
import { StoryNode } from '../types';

// 获取中转配置 (Default)
const DEFAULT_API_BASE_URL = (process.env.API_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
const DEFAULT_AUTH_TOKEN = process.env.AUTH_TOKEN || '';

/**
 * 通用 Gemini API 中转请求函数
 * 支持动态指定 API Key 和 Base URL，方便对接不同的第三方中转站
 */
async function geminiFetch(
    endpoint: string, 
    payload: any = null, 
    method: string = 'POST', 
    config: { apiKey?: string; baseUrl?: string; authToken?: string; isAbsolute?: boolean; skipApiKey?: boolean } = {}
) {
    const apiKey = config.apiKey || process.env.API_KEY;
    const baseUrl = (config.baseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '');
    const authToken = config.authToken || DEFAULT_AUTH_TOKEN;

    let url = '';
    if (config.isAbsolute) {
        // According to user request, allow skipping the 'key' parameter in the URL
        if (config.skipApiKey) {
            url = endpoint;
        } else {
            url = endpoint.includes('?') ? `${endpoint}&key=${apiKey}` : `${endpoint}?key=${apiKey}`;
        }
    } else {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        url = `${baseUrl}/v1beta/${cleanEndpoint}?key=${apiKey}`;
    }
    
    const headers: Record<string, string> = {
        'x-goog-api-client': 'genai-js/1.34.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Set authorization header using either the provided authToken or the apiKey
    const finalToken = authToken || apiKey;
    if (finalToken) {
        headers['Authorization'] = finalToken.startsWith('Bearer ') 
            ? finalToken 
            : `Bearer ${finalToken}`;
    }

    const options: RequestInit = {
        method,
        headers,
    };

    if (payload && method !== 'GET') {
        options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        const error = new Error(errorMsg);
        (error as any).status = response.status;
        (error as any).details = errorData;
        throw error;
    }

    return response.json();
}

// --- 文本生成 ---

export const generateStoryStructure = async (theme: string, style: string, topology: string = 'linear'): Promise<Record<string, StoryNode> | null> => {
  if (!process.env.API_KEY) return null;
  
  let topologyInstruction = "";
  if (topology === 'linear') topologyInstruction = "TOPOLOGY TYPE A (Linear/Survival): Create a main straight line from Start to End.";
  else if (topology === 'serial') topologyInstruction = "TOPOLOGY TYPE B (Serial Tasks): Create a sequence of distinct problems.";
  else if (topology === 'web') topologyInstruction = "TOPOLOGY TYPE C (Complex Web): Create a highly interconnected graph.";
  else if (topology === 'divergent') topologyInstruction = "TOPOLOGY TYPE D (Divergent): Create a single main stem then multiple endings.";

  const prompt = `Create an interactive story structure in Simplified Chinese based on Theme: "${theme}" and Style: "${style}". \n\n${topologyInstruction}\n\nReturn a JSON array of node objects.`;

  try {
    const result = await geminiFetch(`models/gemini-3-flash-preview:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['scene', 'decision', 'ending'] },
                    content: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                label: { type: Type.STRING },
                                targetId: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ['id', 'title', 'type', 'content', 'options']
            }
        }
      }
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const nodeList = JSON.parse(text || '[]');
    const nodeMap: Record<string, StoryNode> = {};
    nodeList.forEach((node: any) => {
        node.mediaType = 'none';
        node.mediaSrc = '';
        node.audioSrc = '';
        nodeMap[node.id] = node;
    });
    return nodeMap;
  } catch (error) {
    console.error("Story Gen Error:", error);
    return null;
  }
};

export const polishNodeText = async (text: string, style: string): Promise<string> => {
    try {
        const result = await geminiFetch(`models/gemini-3-flash-preview:generateContent`, {
            contents: [{ parts: [{ text: `Rewrite the following story segment: "${text}" to style: "${style}". Simplified Chinese.` }] }]
        });
        return result.candidates?.[0]?.content?.parts?.[0]?.text || text;
    } catch (e) {
        return text;
    }
}

export const generatePlotChoices = async (currentContent: string, style: string): Promise<Array<{label: string, content: string}> | null> => {
    try {
        const result = await geminiFetch(`models/gemini-3-flash-preview:generateContent`, {
            contents: [{ parts: [{ text: `Based on: "${currentContent}", generate 2-3 logical story branches. Style: ${style}. Return JSON.` }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING },
                            content: { type: Type.STRING }
                        },
                        required: ['label', 'content']
                    }
                }
            }
        });
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(text || '[]');
    } catch (e) {
        return null;
    }
}

// --- 图片生成 ---

export const generateSceneImage = async (description: string, style: string): Promise<string | null> => {
    try {
        const result = await geminiFetch(`models/gemini-2.5-flash-image:generateContent`, {
            contents: [{ parts: [{ text: `Style: ${style}. Scene: ${description}` }] }],
            generationConfig: { imageConfig: { aspectRatio: "16:9" } }
        }, 'POST', {
            apiKey: (process.env as any).IMAGE_API_KEY,
            baseUrl: (process.env as any).IMAGE_API_BASE_URL
        });
        const base64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        return base64 ? `data:image/png;base64,${base64}` : null;
    } catch (e) {
        console.error("Image Proxy Error", e);
        return null;
    }
}

export const generateCharacterAvatar = async (name: string, description: string, style: string): Promise<string | null> => {
    try {
        const result = await geminiFetch(`models/gemini-2.5-flash-image:generateContent`, {
            contents: [{ parts: [{ text: `Character: ${name}. ${description}. Style: ${style}` }] }]
        }, 'POST', {
            apiKey: (process.env as any).IMAGE_API_KEY,
            baseUrl: (process.env as any).IMAGE_API_BASE_URL
        });
        const base64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        return base64 ? `data:image/png;base64,${base64}` : null;
    } catch (e) {
        return null;
    }
}

// --- 视频生成 ---

export const generateSceneVideo = async (description: string, style: string): Promise<string | null> => {
    const dedicatedVideoKey = (process.env as any).VIDEO_API_KEY;
    const defaultKey = process.env.API_KEY;
    const baseUrl = ((process.env as any).VIDEO_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
    
    // API 端点配置
    const VIDEO_CREATE_URL = `${baseUrl}/v1/video/create`;
    const VIDEO_QUERY_URL = `${baseUrl}/v1/video/query`;
    
    if (!dedicatedVideoKey && typeof window !== 'undefined' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) await window.aistudio.openSelectKey();
    }

    // 使用 veo3.1-fast
    const MODEL_NAME = "veo3.1-fast"; 
    const creationApiKey = dedicatedVideoKey || defaultKey;

    try {
        // 第一步：创建视频生成任务
        // 根据用户提供的 curl 示例调整 Payload
        let creationResult = await geminiFetch(VIDEO_CREATE_URL, {
            model: MODEL_NAME,
            prompt: `Cinematic movie shot, ${style}. Context: "${description}".`,
            enable_upsample: true,
            enhance_prompt: true,
            aspect_ratio: '16:9'
            // 如果有初始图片可以传 images: [url]
        }, 'POST', { 
            apiKey: creationApiKey, 
            isAbsolute: true,
            authToken: creationApiKey 
        });

        const taskId = creationResult.id;
        if (!taskId) {
            return null;
        }

        // 第二步：等待 10 秒钟再去调用查询接口 (根据用户需求)
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 第三步：轮询视频状态
        let queryResult = creationResult;
        let retryCount = 0;
        const maxRetries = 60; 

        while (queryResult.status === 'pending') {
            try {
                // 查询状态，geminiFetch 内部已包含 Content-Type 和 Accept 为 application/json
                queryResult = await geminiFetch(`${VIDEO_QUERY_URL}?id=${taskId}`, null, 'GET', { 
                    apiKey: defaultKey, 
                    isAbsolute: true,
                    authToken: defaultKey,
                    skipApiKey: true
                });
                
                if (queryResult.status === 'pending') {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
                retryCount++;
                if (retryCount > maxRetries) return null;
            } catch (err: any) {
                console.error("Polling error:", err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }
        }

        // 第四步：获取并返回视频 URL
        if (queryResult.status === 'succeeded' || queryResult.video_url) {
            return queryResult.video_url;
        }
        
        return null;
    } catch (e: any) {
        console.error("Video Generation Error:", e.message);
        return null;
    }
}

// --- 音频生成 ---

export const generateSceneAudio = async (description: string, type: 'bgm' | 'sfx'): Promise<string | null> => {
    try {
        const result = await geminiFetch(`models/gemini-2.5-flash-preview-tts:generateContent`, {
            contents: [{ parts: [{ text: `${type === 'bgm' ? 'Music' : 'SFX'}: ${description}` }] }],
            generationConfig: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            }
        });
        const base64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64 ? `data:audio/pcm;base64,${base64}` : null;
    } catch (e) {
        return null;
    }
}

export const decodePCM = async (base64: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) float32[i] = dataInt16[i] / 32768.0;
    const buffer = audioContext.createBuffer(1, float32.length, 24000); 
    buffer.getChannelData(0).set(float32);
    return buffer;
}
