import React from 'react';
import { StoryNode } from '../../../types';

interface NodeRendererProps {
  node: StoryNode;
  isSelected: boolean;
  mediaUrl?: string;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  mediaUrl,
  onSelect,
  onDragStart
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart(node.id);
    onSelect(node.id);
  };

  const typeColor =
    node.type === 'scene'
      ? 'bg-cyan-500'
      : node.type === 'interrupt'
      ? 'bg-red-500'
      : 'bg-purple-500';

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ left: node.x, top: node.y }}
      className={`absolute w-64 rounded-3xl backdrop-blur-3xl transition-all duration-300 group ${
        isSelected
          ? 'bg-indigo-900/30 border-2 border-indigo-500 shadow-2xl z-30'
          : 'bg-slate-900/60 border border-white/5 z-10'
      }`}
    >
      {/* 类型指示条 */}
      <div className={`h-1.5 w-full rounded-t-3xl ${typeColor}`} />

      {/* 内容区域 */}
      <div className="p-5 cursor-pointer">
        <h3 className="text-sm font-black text-white truncate mb-1">
          {node.title}
        </h3>
        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed h-8">
          {node.content}
        </p>

        {/* 媒体预览 */}
        {node.mediaSrc && mediaUrl && (
          <div className="mt-4 aspect-video w-full rounded-2xl bg-black overflow-hidden border border-white/5 relative">
            {node.mediaType === 'video' ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={mediaUrl}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                alt=""
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
