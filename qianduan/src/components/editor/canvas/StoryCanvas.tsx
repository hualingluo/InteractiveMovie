import React, { useEffect, useCallback } from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';
import { ConnectionLines } from './ConnectionLines';
import { NodeRenderer } from './NodeRenderer';
import { getMediaFileUrl } from '../../../../services/fileSystemService';
import * as Icons from '../../../../components/Icons';

export const StoryCanvas: React.FC = () => {
  const { nodes, folderHandle, updateNode } = useProjectStore();
  const {
    viewport,
    selectedNodeId,
    isDraggingCanvas,
    dragNodeId,
    dragStart,
    mediaUrls,
    setMediaUrls,
    setSelectedNodeId,
    setIsDraggingCanvas,
    setDragStart,
    setDragNodeId,
    setViewport
  } = useEditorStore();

  // 加载媒体文件 URL
  const loadMediaUrls = useCallback(async () => {
    if (!folderHandle) return;

    const urls: Record<string, string> = {};

    for (const [nodeId, node] of Object.entries(nodes)) {
      if (node.mediaSrc) {
        try {
          // 如果是相对路径（本地文件），使用 File System Access API 加载
          if (node.mediaSrc.startsWith('videos/') || node.mediaSrc.startsWith('images/')) {
            const url = await getMediaFileUrl(folderHandle, node.mediaSrc);
            urls[nodeId] = url;
          } else {
            // 如果是完整 URL（如 AI 生成的），直接使用
            urls[nodeId] = node.mediaSrc;
          }
        } catch (error) {
          console.error(`加载节点 ${nodeId} 的媒体文件失败:`, error);
        }
      }
    }

    setMediaUrls(urls);
  }, [nodes, folderHandle, setMediaUrls]);

  // 当 nodes 或 folderHandle 改变时重新加载媒体 URL
  useEffect(() => {
    loadMediaUrls();

    // 清理函数：释放所有 blob URL
    return () => {
      Object.values(mediaUrls).forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [loadMediaUrls]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      // 更新画布视口位置
      setViewport({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (dragNodeId) {
      // 更新节点位置
      updateNode(dragNodeId, {
        x: nodes[dragNodeId].x + e.movementX / viewport.zoom,
        y: nodes[dragNodeId].y + e.movementY / viewport.zoom
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragNodeId(null);
  };

  return (
    <div
      className="relative flex-1 bg-[#050505] overflow-hidden cursor-grab active:cursor-grabbing grid-bg"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className="absolute transform-gpu origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: '100%',
          height: '100%'
        }}
      >
        {/* 连接线 */}
        <ConnectionLines nodes={nodes} />

        {/* 节点渲染 */}
        {Object.values(nodes).map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            mediaUrl={mediaUrls[node.id]}
            onSelect={setSelectedNodeId}
            onDragStart={setDragNodeId}
          />
        ))}
      </div>

      {/* 缩放控制 */}
      <CanvasControls />
    </div>
  );
};

const CanvasControls: React.FC = () => {
  const { viewport, zoomIn, zoomOut } = useEditorStore();

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-slate-900/80 backdrop-blur border border-white/5 rounded-2xl shadow-2xl">
      <button
        onClick={zoomOut}
        className="p-3 text-slate-400 hover:text-white"
      >
        <Icons.ZoomOut size={20} />
      </button>
      <div className="flex items-center text-[10px] font-black text-slate-500 w-12 justify-center">
        {Math.round(viewport.zoom * 100)}%
      </div>
      <button
        onClick={zoomIn}
        className="p-3 text-slate-400 hover:text-white"
      >
        <Icons.ZoomIn size={20} />
      </button>
    </div>
  );
};
