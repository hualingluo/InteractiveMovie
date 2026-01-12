
import React from 'react';
import * as Icons from './Icons';

interface Props {
  nodeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<Props> = ({ nodeTitle, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full text-red-500">
            <Icons.Trash2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">确认删除节点？</h3>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          您确定要删除 <span className="text-red-400 font-semibold">"{nodeTitle}"</span> 吗？此操作将移除该节点的所有剧情内容及相关连线，且无法撤销。
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            保留节点
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};
