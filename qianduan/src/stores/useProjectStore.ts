import { create } from 'zustand';
import { StoryNode, Character, ProjectData, ProjectMetadata, StyleMode, InteractivityType, LayoutType } from '../../types';

interface ProjectState {
  // 项目数据
  metadata: ProjectMetadata;
  nodes: Record<string, StoryNode>;
  characters: Record<string, Character>;
  projectPath: string | null; // 后端存储路径
  folderHandle: any; // 本地文件夹句柄

  // 设置方法
  setMetadata: (metadata: ProjectMetadata) => void;
  setNodes: (nodes: Record<string, StoryNode>) => void;
  setCharacters: (characters: Record<string, Character>) => void;
  setProjectPath: (path: string | null) => void;
  setFolderHandle: (handle: any) => void;

  // 节点操作
  addNode: (node: StoryNode) => void;
  updateNode: (id: string, updates: Partial<StoryNode>) => void;
  deleteNode: (id: string) => void;

  // 角色操作
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  // 加载项目
  loadProject: (data: ProjectData) => void;
  resetProject: () => void;
}

const createDefaultMetadata = (): ProjectMetadata => ({
  id: `p_${Date.now()}`,
  name: '我的新剧本',
  author: '游客创作者',
  coverUrl: '',
  description: '这是一个使用抖剧 DOUJU 创建的互动剧本。',
  likes: 0,
  views: 0,
  remixCount: 0,
  status: 'draft',
  styleMode: 'late_shift',
  interactivity: 'classic',
  layout: 'cinematic',
  createdAt: new Date().toLocaleDateString()
});

const createDefaultNodes = (): Record<string, StoryNode> => ({
  start: {
    id: 'start',
    title: '序章',
    type: 'scene',
    content: '在此开始创作...',
    mediaType: 'none',
    mediaSrc: '',
    audioSrc: '',
    x: 100,
    y: 100,
    options: []
  }
});

export const useProjectStore = create<ProjectState>((set) => ({
  // 初始状态
  metadata: createDefaultMetadata(),
  nodes: createDefaultNodes(),
  characters: {},
  projectPath: null,
  folderHandle: null,

  // 设置方法
  setMetadata: (metadata) => set({ metadata }),
  setNodes: (nodes) => set({ nodes }),
  setCharacters: (characters) => set({ characters }),
  setProjectPath: (projectPath) => set({ projectPath }),
  setFolderHandle: (folderHandle) => set({ folderHandle }),

  // 节点操作
  addNode: (node) =>
    set((state) => ({
      nodes: { ...state.nodes, [node.id]: node }
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], ...updates }
      }
    })),

  deleteNode: (id) =>
    set((state) => {
      const newNodes = { ...state.nodes };
      delete newNodes[id];
      return { nodes: newNodes };
    }),

  // 角色操作
  addCharacter: (character) =>
    set((state) => ({
      characters: { ...state.characters, [character.id]: character }
    })),

  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: { ...state.characters[id], ...updates }
      }
    })),

  deleteCharacter: (id) =>
    set((state) => {
      const newCharacters = { ...state.characters };
      delete newCharacters[id];
      return { characters: newCharacters };
    }),

  // 加载项目
  loadProject: (data) =>
    set({
      metadata: data.metadata,
      nodes: data.nodes,
      characters: data.characters,
      folderHandle: null // folderHandle 不在 ProjectData 中持久化
    }),

  resetProject: () =>
    set({
      metadata: createDefaultMetadata(),
      nodes: createDefaultNodes(),
      characters: {},
      projectPath: null,
      folderHandle: null
    })
}));
