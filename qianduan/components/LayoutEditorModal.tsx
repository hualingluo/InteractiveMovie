import React, { useState, useRef } from 'react';
import { StoryNode, ElementPosition } from '../types';
import * as Icons from './Icons';
import { generateSceneImage } from '../services/geminiService';

interface Props {
  node: StoryNode;
  onSave: (nodeId: string, layout: any) => void;
  onClose: () => void;
}

export const LayoutEditorModal: React.FC<Props> = ({ node, onSave, onClose }) => {
    const [textPos, setTextPos] = useState<ElementPosition>(node.layout?.textPos || { x: 10, y: 65, w: 50, h: 20 });
    const [optionsPos, setOptionsPos] = useState<ElementPosition>(node.layout?.optionsPos || { x: 65, y: 65, w: 30, h: 30 });
    const [uiBg, setUiBg] = useState(node.layout?.uiBackgroundSrc || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [dragging, setDragging] = useState<'text' | 'options' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleGenerateUI = async () => {
        setIsGenerating(true);
        const prompt = `A highly artistic, futuristic game UI frame, transparent center, neon cyan borders, high tech symbols, for a ${node.title} scene.`;
        // Fix: Use a valid StyleMode ('late_shift', 'meibao', or 'shengshi') instead of "Abstract UI Concept"
        const result = await generateSceneImage(prompt, node.styleMode || 'late_shift');
        if (result) setUiBg(result);
        setIsGenerating(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        if (dragging === 'text') setTextPos(prev => ({ ...prev, x, y }));
        else setOptionsPos(prev => ({ ...prev, x, y }));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-7xl flex justify-between items-center mb-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Icons.LayoutDashboard className="text-cyan-500" /> UI 艺术实验室
                    </h2>
                    <button 
                        onClick={handleGenerateUI}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-purple-900/40"
                    >
                        {isGenerating ? <Icons.Loader2 className="animate-spin" /> : <Icons.Wand2 size={14} />} AI 生成艺术框架
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-bold cursor-pointer transition-all">
                        <Icons.Upload size={14} /> 导入 UI 贴图
                        <input type="file" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if(f) {
                                const r = new FileReader();
                                r.onload = (ev) => setUiBg(ev.target?.result as string);
                                r.readAsDataURL(f);
                            }
                        }} />
                    </label>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-slate-400 font-bold">取消</button>
                    <button 
                        onClick={() => onSave(node.id, { textPos, optionsPos, uiBackgroundSrc: uiBg })}
                        className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-black shadow-xl"
                    >
                        保存视觉设定
                    </button>
                </div>
            </div>

            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setDragging(null)}
                className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
            >
                {/* 预览画面 */}
                {node.mediaSrc ? (
                    <img src={node.mediaSrc} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
                ) : <div className="absolute inset-0 bg-slate-900 pointer-events-none" />}

                {/* UI 装饰层 */}
                {uiBg && <img src={uiBg} className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 opacity-80" />}

                {/* 文本区 */}
                <div 
                    onMouseDown={() => setDragging('text')}
                    style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, width: `${textPos.w}%` }}
                    className={`absolute cursor-move p-4 rounded-xl border-2 border-dashed z-20 ${dragging === 'text' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/20 bg-black/40'} backdrop-blur-md`}
                >
                    <h3 className="font-black text-white mb-2">{node.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2">{node.content}</p>
                </div>

                {/* 选项区 */}
                <div 
                    onMouseDown={() => setDragging('options')}
                    style={{ left: `${optionsPos.x}%`, top: `${optionsPos.y}%`, width: `${optionsPos.w}%` }}
                    className={`absolute cursor-move p-4 rounded-xl border-2 border-dashed z-20 ${dragging === 'options' ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-black/40'} backdrop-blur-md space-y-2`}
                >
                    <div className="h-8 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold">示例选项 A</div>
                    <div className="h-8 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold">示例选项 B</div>
                </div>
            </div>
            <p className="mt-4 text-slate-500 text-xs font-medium uppercase tracking-widest">TIP: 拖拽区块以改变交互位置，点击 AI 按钮自动美化边框</p>
        </div>
    );
};