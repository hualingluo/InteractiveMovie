import { create } from 'zustand';

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface EditorState {
  // 视口状态
  viewport: Viewport;
  selectedNodeId: string | null;

  // 拖拽状态
  isDraggingCanvas: boolean;
  dragStart: { x: number; y: number };
  dragNodeId: string | null;

  // UI 状态
  isPreviewOpen: boolean;
  layoutNodeId: string | null;
  isCharManagerOpen: boolean;
  isNewProjectOpen: boolean;
  isPublishing: boolean;
  isBuildingExe: boolean;

  // 媒体 URL 缓存
  mediaUrls: Record<string, string>;

  // 设置方法
  setViewport: (viewport: Partial<Viewport>) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsDraggingCanvas: (isDragging: boolean) => void;
  setDragStart: (start: { x: number; y: number }) => void;
  setDragNodeId: (id: string | null) => void;

  // UI 状态切换
  setIsPreviewOpen: (isOpen: boolean) => void;
  setLayoutNodeId: (id: string | null) => void;
  setIsCharManagerOpen: (isOpen: boolean) => void;
  setIsNewProjectOpen: (isOpen: boolean) => void;
  setIsPublishing: (isPublishing: boolean) => void;
  setIsBuildingExe: (isBuilding: boolean) => void;

  // 媒体 URL 管理
  setMediaUrls: (urls: Record<string, string>) => void;
  setMediaUrl: (nodeId: string, url: string) => void;

  // 缩放控制
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // 重置状态
  resetEditor: () => void;
}

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1
};

export const useEditorStore = create<EditorState>((set) => ({
  // 初始状态
  viewport: initialViewport,
  selectedNodeId: null,
  isDraggingCanvas: false,
  dragStart: { x: 0, y: 0 },
  dragNodeId: null,
  isPreviewOpen: false,
  layoutNodeId: null,
  isCharManagerOpen: false,
  isNewProjectOpen: false,
  isPublishing: false,
  isBuildingExe: false,
  mediaUrls: {},

  // 设置方法
  setViewport: (newViewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...newViewport }
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setIsDraggingCanvas: (isDragging) => set({ isDraggingCanvas: isDragging }),

  setDragStart: (start) => set({ dragStart: start }),

  setDragNodeId: (id) => set({ dragNodeId: id }),

  // UI 状态切换
  setIsPreviewOpen: (isOpen) => set({ isPreviewOpen: isOpen }),
  setLayoutNodeId: (id) => set({ layoutNodeId: id }),
  setIsCharManagerOpen: (isOpen) => set({ isCharManagerOpen: isOpen }),
  setIsNewProjectOpen: (isOpen) => set({ isNewProjectOpen: isOpen }),
  setIsPublishing: (isPublishing) => set({ isPublishing }),
  setIsBuildingExe: (isBuilding) => set({ isBuildingExe: isBuilding }),

  // 媒体 URL 管理
  setMediaUrls: (urls) => set({ mediaUrls: urls }),
  setMediaUrl: (nodeId, url) =>
    set((state) => ({
      mediaUrls: { ...state.mediaUrls, [nodeId]: url }
    })),

  // 缩放控制
  zoomIn: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(2, state.viewport.zoom + 0.1)
      }
    })),

  zoomOut: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(0.2, state.viewport.zoom - 0.1)
      }
    })),

  resetZoom: () =>
    set((state) => ({
      viewport: { ...state.viewport, zoom: 1 }
    })),

  // 重置状态
  resetEditor: () =>
    set({
      viewport: initialViewport,
      selectedNodeId: null,
      isDraggingCanvas: false,
      dragStart: { x: 0, y: 0 },
      dragNodeId: null,
      isPreviewOpen: false,
      layoutNodeId: null,
      isCharManagerOpen: false,
      isNewProjectOpen: false,
      isPublishing: false,
      isBuildingExe: false,
      mediaUrls: {}
    })
}));
