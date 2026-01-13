import React from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';
import { NodeType, ProjectData } from '../../../types';
import * as Icons from '../../../../components/Icons';

interface EditorToolbarProps {
  onBack: () => void;
  onExportJSON: () => void;
  onSaveToBackend: () => Promise<void>;
  onPublish: () => Promise<void>;
  onBuildExe: () => Promise<void>;
  userRole: 'creator' | 'admin';
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onBack,
  onExportJSON,
  onSaveToBackend,
  onPublish,
  onBuildExe,
  userRole
}) => {
  const { metadata, addNode } = useProjectStore();
  const {
    viewport,
    isPublishing,
    isBuildingExe,
    setIsPreviewOpen,
    setIsNewProjectOpen
  } = useEditorStore();

  const handleAddNode = () => {
    const id = `node_${Date.now()}`;
    addNode({
      id,
      title: '新剧情镜头',
      type: 'scene',
      content: '使用 AI 润色或直接输入剧本...',
      mediaType: 'none',
      mediaSrc: '',
      audioSrc: '',
      x: -viewport.x + 400,
      y: -viewport.y + 200,
      options: []
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-slate-950/50 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10 z-40 shadow-2xl">
      {/* 角色指示条 */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-all ${
          userRole === 'admin' ? 'bg-amber-500' : 'bg-transparent'
        }`}
      />

      {/* 左侧：返回和标题 */}
      <div className="flex items-center gap-6">
        <button
          onClick={onBack}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
        >
          <Icons.ChevronLeft size={20} />
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-black text-white uppercase tracking-tight">
            CINE-GENESIS <span className="text-slate-500 italic">Studio</span>
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                userRole === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {metadata.name} | {userRole === 'admin' ? '超级管理模式' : '创作者模式'}
            </span>
          </div>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* 添加节点 */}
          <button
            onClick={handleAddNode}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all shadow-lg"
            title="添加节点"
          >
            <Icons.Plus size={18} />
          </button>

          {/* 导出 JSON */}
          <button
            onClick={onExportJSON}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all shadow-lg"
            title="导出剧本 JSON"
          >
            <Icons.Download size={18} />
          </button>

          {/* 保存到后端 */}
          <button
            onClick={onSaveToBackend}
            className="p-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all shadow-lg flex items-center gap-2"
            title="保存到后端"
          >
            <Icons.Save size={18} />
          </button>

          {/* 播放测试 */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-8 py-3 bg-white text-slate-950 hover:bg-cyan-50 rounded-full text-xs font-black transition-all flex items-center gap-2 shadow-xl"
          >
            <Icons.Play size={16} fill="currentColor" /> 播放测试
          </button>

          {/* 发布到广场 */}
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full text-xs font-black transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/20"
          >
            {isPublishing ? (
              <Icons.Loader2 size={16} className="animate-spin" />
            ) : (
              <Icons.Globe size={16} />
            )}{' '}
            发布到广场
          </button>

          {/* 打包 EXE */}
          <button
            onClick={onBuildExe}
            disabled={isBuildingExe}
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full text-xs font-black transition-all flex items-center gap-2 shadow-xl shadow-emerald-900/20"
          >
            {isBuildingExe ? (
              <Icons.Loader2 size={16} className="animate-spin" />
            ) : (
              <Icons.Download size={16} />
            )}{' '}
            打包 EXE
          </button>
        </div>
      </div>
    </div>
  );
};
