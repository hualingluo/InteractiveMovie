import { GoogleGenAI, Type } from "@google/genai";
import { StoryNode, NodeType, StyleMode, InteractivityType } from '../types';
import { getGeminiApiKey } from './configService';

// Global instance for general text and image tasks (gemini-3-flash and gemini-2.5-flash-image)
let ai: GoogleGenAI | null = null;

/**
 * 初始化 AI 实例
 */
const initializeAI = async (): Promise<GoogleGenAI> => {
  if (!ai) {
    const apiKey = await getGeminiApiKey();
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const STYLE_PROMPTS: Record<StyleMode, string> = {
  late_shift: "风格：美式硬核悬疑《夜班》。台词极简、冷酷，充满即时决策压力。场景多发生在都市夜景、停车场、仓库。",
  meibao: "风格：中式现代恋爱《完蛋！我被美女包围了！》。第一人称 POV 视角，台词俏皮、生活化，选项要体现个性和好感度变化，充满暧昧或喜剧张力。",
  shengshi: "风格：中式古风权谋《盛世天下》。辞藻华美，多用排比和古风用词。场景多为宫廷、战壕、古道。选项涉及权衡利弊、天下大义。"
};

export const generateStoryStructure = async (
  theme: string, 
  styleMode: StyleMode, 
  topology: string = 'linear',
  interactivity: InteractivityType = 'classic'
): Promise<Record<string, StoryNode> | null> => {
  const prompt = `
    你是一位全球顶尖的互动电影编剧和系统架构师。
    正在创作一个项目：
    主题：${theme}
    叙事风格：${STYLE_PROMPTS[styleMode]}
    
    系统要求：
    1. 结构：生成 6-10 个关键剧情节点。
    2. 拓扑模式：${topology} (如为 Loop 则包含回溯路径)。
    3. 交互机制：${interactivity}。
    
    请根据这些高级设定，构建一个逻辑严密、充满戏剧张力的拓扑树。
    返回 JSON 对象数组。
    节点属性：id, title, content, type(scene/decision/ending/interrupt), x, y, options[{id, label, targetId, isDefault}]
  `;

  const nodeSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['scene', 'decision', 'ending', 'interrupt'] },
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
            targetId: { type: Type.STRING },
            isDefault: { type: Type.BOOLEAN }
          }
        }
      }
    },
    required: ['id', 'title', 'content', 'options']
  };

  try {
    const aiInstance = await initializeAI();
    // 显式使用 gemini-3-flash-preview 模型处理制片计划生成
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: nodeSchema }
      }
    });

    // 遵循 SDK 规范：使用 .text 属性
    const rawText = response.text.trim();
    const nodeList = JSON.parse(rawText) as any[];
    const nodeMap: Record<string, StoryNode> = {};
    nodeList.forEach((node, index) => {
        nodeMap[node.id] = {
            ...node,
            x: node.x || 100 + (index * 300),
            y: node.y || 100,
            mediaType: 'none',
            mediaSrc: '',
            audioSrc: '',
            styleMode,
            interactivity,
            interactiveSettings: { 
                decisionTriggerTime: interactivity === 'qte' ? 2 : 7, 
                autoTransition: true, 
                duration: 15 
            }
        };
    });
    return nodeMap;
  } catch (error) {
    console.error("Story Gen Error:", error);
    return null;
  }
};

export const generateSceneVideo = async (description: string, styleMode: StyleMode): Promise<string | null> => {
    try {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) await (window as any).aistudio.openSelectKey();
        }
        const apiKey = await getGeminiApiKey();
        const videoAi = new GoogleGenAI({ apiKey });
        const styleVisual = {
            late_shift: "Dark neon noir, anamorphic lens flares, high contrast, gritty cinematic.",
            meibao: "Bright, high-key lighting, soft focus, first person perspective (POV), colorful modern lifestyle.",
            shengshi: "Ancient China epic, golden hour, traditional palace architecture, grand cinematography."
        };

        let operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic movie shot, 21:9, ${styleVisual[styleMode]}. Scene: ${description}`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });

        while (!operation.done) {
            await new Promise(r => setTimeout(r, 10000));
            operation = await videoAi.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            const res = await fetch(`${videoUri}&key=${apiKey}`);
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e: any) { return null; }
};

export const polishNodeText = async (text: string, styleMode: StyleMode): Promise<string> => {
    try {
        const aiInstance = await initializeAI();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `作为编剧，按以下风格润色这段台词：${STYLE_PROMPTS[styleMode]}。原文：${text}`,
        });
        return response.text || text;
    } catch (e) { return text; }
};

export const generateSceneImage = async (description: string, styleMode: StyleMode): Promise<string | null> => {
    try {
        const aiInstance = await initializeAI();
        const styleVisual = {
            late_shift: "Cyberpunk neon crime style, realistic movie frame, 21:9.",
            meibao: "Realistic high-quality cinematography, bright romantic lighting, POV shot, 21:9.",
            shengshi: "Ancient Chinese realistic cinematic epic, grand palace, 21:9."
        };
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `Interaction movie still, ${styleVisual[styleMode]}. Scene: ${description}`,
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};

export const generateCharacterAvatar = async (name: string, description: string, style: string): Promise<string | null> => {
    try {
        const aiInstance = await initializeAI();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `角色定妆照，电影写实感。角色：${name}, 描述：${description}, 风格：${style}`,
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};