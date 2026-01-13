
import React, { useState, useRef } from 'react';
import * as Icons from './Icons';
import { generateStoryStructure } from '../services/geminiService';
import { saveScriptToBackend, uploadScriptFile } from '../services/scriptApiService';
import { selectFolder, saveScriptNodes } from '../services/fileSystemService';
import { StoryNode, StyleMode, InteractivityType, LayoutType } from '../types';

interface Props {
  onConfirm: (nodes: Record<string, StoryNode>, projectPath: string, folderHandle: any) => void;
  onClose: () => void;
}

const TOPOLOGIES = [
  { id: 'linear', title: '直线求生 (Linear)', desc: '经典单向推进，死亡节点回归。' },
  { id: 'loop', title: '无限循环 (Loop)', desc: '在同一时间内循环，需解密跳出。' },
  { id: 'web', title: '交叉网状 (Web)', desc: '多角色、多线索高度互联。' },
  { id: 'parallel', title: '平行宇宙 (Parallel)', desc: '选择可导致截然不同的世界状态。' }
];

const SYSTEMS: { id: InteractivityType; title: string; desc: string; icon: any }[] = [
  { id: 'classic', title: '经典抉择', desc: '基于剧情转折点的文字选项。', icon: Icons.GitBranch },
  { id: 'qte', title: '即时反应 (QTE)', desc: '限时触发的高强度操作感。', icon: Icons.Zap },
  { id: 'investigation', title: '搜证解谜', desc: '在场景中寻找线索并点击互动。', icon: Icons.Search },
  { id: 'emotion', title: '情感连结', desc: '根据好感度决定角色后续行为。', icon: Icons.Heart }
];

const LAYOUTS: { id: LayoutType; title: string; desc: string; icon: any }[] = [
  { id: 'cinematic', title: '21:9 宽画幅', desc: '极致的电影院沉浸体验。', icon: Icons.Monitor },
  { id: 'vertical', title: '9:16 竖屏', desc: '适配短视频时代的沉浸视角。', icon: Icons.Smartphone },
  { id: 'minimalist', title: '沉浸极简', desc: '去UI化，完全融入画面。', icon: Icons.Eye }
];

const GENRES = ["科幻惊悚 (Sci-Fi)", "赛博朋克 (Cyberpunk)", "都市恋爱 (Romance)", "古装权谋 (Epic)", "现代悬疑 (Mystery)"];

export const NewProjectModal: React.FC<Props> = ({ onConfirm, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'import' | 'empty'>('ai');
  const [topology, setTopology] = useState('linear');
  const [system, setSystem] = useState<InteractivityType>('classic');
  const [layout, setLayout] = useState<LayoutType>('cinematic');
  const [genre, setGenre] = useState(GENRES[0]);
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderStatus, setFolderStatus] = useState<'idle' | 'selecting' | 'selected' | 'error'>('idle');
  const [folderError, setFolderError] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setImportError('');
    }
  };

  const handleImportSubmit = async () => {
    if (!uploadFile) {
      setImportError('请选择一个剧本文件');
      return;
    }

    setLoading(true);
    setImportError('');

    try {
      setFolderStatus('selecting');

      // 步骤1：先让用户选择保存文件夹
      const folderHandle = await selectFolder();

      if (!folderHandle) {
        setImportError('已取消文件夹选择');
        setFolderStatus('error');
        setLoading(false);
        return;
      }

      setFolderStatus('selected');

      // 步骤2：上传文件到后端
      const uploadResult = await uploadScriptFile(uploadFile);

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.message || '上传失败');
      }

      // 步骤3：从上传结果中获取剧本数据
      const nodes = uploadResult.data.scriptData.nodes;
      const projectPath = uploadResult.data.path;

      if (nodes) {
        // 步骤4：保存到本地文件系统
        await saveScriptNodes(folderHandle, nodes);

        // 步骤5：回调并关闭
        onConfirm(nodes, projectPath, folderHandle);
        onClose();
      } else {
        throw new Error('剧本数据格式错误：缺少 nodes');
      }
    } catch (error: any) {
      console.error('导入剧本错误:', error);
      setImportError(error.message || '导入失败，请重试');
      setFolderStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!theme) return;
    setLoading(true);
    setFolderError('');

    try {
      setFolderStatus('selecting');

      // 步骤1：先让用户选择保存文件夹
      const folderHandle = await selectFolder();

      if (!folderHandle) {
        setFolderError('已取消文件夹选择');
        setFolderStatus('error');
        setLoading(false);
        return;
      }

      setFolderStatus('selected');

      // 步骤2：生成剧本结构
      let styleMode: StyleMode = 'late_shift';
      if (genre.includes('恋爱')) styleMode = 'meibao';
      else if (genre.includes('古装') || genre.includes('Epic')) styleMode = 'shengshi';

      const nodes = await generateStoryStructure(theme, styleMode, topology, system);

      if (nodes) {
        // 步骤3：应用布局到所有生成的节点
        Object.values(nodes).forEach(node => {
          node.layout = {
            type: layout,
            textPos: layout === 'vertical' ? { x: 5, y: 70, w: 90, h: 20 } : { x: 10, y: 75, w: 50, h: 20 },
            optionsPos: layout === 'vertical' ? { x: 5, y: 40, w: 90, h: 30 } : { x: 65, y: 65, w: 30, h: 30 },
            uiBackgroundSrc: ''
          };
        });

        // 步骤4：保存到本地文件系统
        await saveScriptNodes(folderHandle, nodes);

        // 步骤5：同时保存到后端（用于云端同步）
        const projectPath = `project_${Date.now()}`;
        const projectData = {
          metadata: {
            id: `p_${Date.now()}`,
            name: theme.substring(0, 30),
            description: theme,
            styleMode,
            interactivity: system,
            layout,
            createdAt: new Date().toISOString()
          },
          nodes,
          characters: {},
          viewport: { x: 0, y: 0, zoom: 1 }
        };

        const saveResult = await saveScriptToBackend(projectPath, projectData);

        if (saveResult.success) {
          // 步骤6：回调并关闭
          onConfirm(nodes, projectPath, folderHandle);
          onClose();
        } else {
          // 本地保存成功，但后端保存失败，仍然允许继续
          onConfirm(nodes, projectPath, folderHandle);
          onClose();
        }
      } else {
        setFolderError('剧本生成失败，请重试');
        setFolderStatus('error');
      }
    } catch (error: any) {
      console.error('制片计划错误:', error);
      setFolderError(error.message || '操作失败，请重试');
      setFolderStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-50 flex items-center justify-center p-6">
      <div className="bg-[#020617] border border-white/5 w-full max-w-6xl h-[85vh] rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <div className="w-72 bg-slate-950/40 p-8 border-r border-white/5 flex flex-col gap-4">
            <div className="mb-8">
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Production Pipeline</span>
                <h2 className="text-xl font-black text-white italic">DOUJU PRO</h2>
            </div>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'ai' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <Icons.Wand2 size={20} /> AI 智能制片
            </button>
            <button onClick={() => setActiveTab('import')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'import' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
                <Icons.Upload size={20} /> 导入本地剧本
            </button>
            <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 leading-relaxed">使用 Gemini 3 引擎进行万亿级参数的剧情拓扑模拟，确保您的每一个选择都具有逻辑必然性。</p>
            </div>
        </div>

        {/* Configuration Panel */}
        <div className="flex-1 p-16 overflow-y-auto custom-scrollbar relative flex flex-col">
            <button onClick={onClose} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"><Icons.X size={28} /></button>

            {activeTab === 'ai' ? (
                <>
                    <header className="mb-12">
                        <h1 className="text-4xl font-black text-white mb-3 italic tracking-tighter uppercase">Project <span className="text-cyan-500">Initialization</span></h1>
                        <p className="text-slate-400 font-medium">定制您的互动剧系统结构与交互逻辑。</p>
                    </header>

                    <div className="space-y-16">
                        {/* 1. Topology */}
                        <section>
                            <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">01</span>
                                叙事结构 (Narrative Topology)
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                {TOPOLOGIES.map(t => (
                                    <button key={t.id} onClick={() => setTopology(t.id)} className={`p-6 rounded-3xl border text-left transition-all ${topology === t.id ? 'bg-cyan-500/5 border-cyan-500 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}>
                                        <div className="text-sm font-black text-white mb-2">{t.title}</div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. Systems & Layout */}
                        <div className="grid grid-cols-2 gap-12">
                            <section>
                                <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">02</span>
                                    交互系统 (Game Mechanics)
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {SYSTEMS.map(s => (
                                        <button key={s.id} onClick={() => setSystem(s.id)} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${system === s.id ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                                            <s.icon size={18} />
                                            <div className="text-xs font-black">{s.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">03</span>
                                    UI 布局 (Visual Layout)
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {LAYOUTS.map(l => (
                                        <button key={l.id} onClick={() => setLayout(l.id)} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${layout === l.id ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                                            <l.icon size={18} />
                                            <div className="text-xs font-black">{l.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* 3. Theme */}
                        <section>
                            <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">04</span>
                                核心剧本梗概 (Core Prompt)
                            </h3>
                            <div className="flex gap-4 mb-4">
                                {GENRES.map(g => (
                                    <button key={g} onClick={() => setGenre(g)} className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all ${genre === g ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="输入您故事的灵魂..."
                                className="w-full h-40 bg-slate-900/40 border border-white/5 rounded-[32px] p-8 text-white text-lg focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-slate-700"
                            />
                        </section>

                        {/* Folder Selection Status */}
                        {folderStatus === 'selecting' && (
                            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Folder size={20} className="text-blue-400 animate-pulse" />
                                <span className="text-sm text-blue-300">请先选择一个文件夹来保存项目...</span>
                            </div>
                        )}
                        {folderStatus === 'selected' && (
                            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Wand2 size={20} className="text-green-400 animate-pulse" />
                                <span className="text-sm text-green-300">正在生成剧本并保存文件...</span>
                            </div>
                        )}
                        {folderError && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Skull size={20} className="text-red-400" />
                                <span className="text-sm text-red-300">{folderError}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !theme}
                            className="w-full py-8 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-[32px] font-black text-xl transition-all shadow-2xl shadow-cyan-900/40 flex items-center justify-center gap-4 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                folderStatus === 'selecting' ? (
                                    <>
                                        <Icons.Folder size={24} className="animate-pulse" />
                                        等待选择文件夹...
                                    </>
                                ) : folderStatus === 'selected' ? (
                                    <>
                                        <Icons.Wand2 className="animate-pulse" size={24} />
                                        正在生成剧本...
                                    </>
                                ) : (
                                    <>
                                        <Icons.Loader2 className="animate-spin" size={24} />
                                        处理中...
                                    </>
                                )
                            ) : (
                                <>开启制片计划 (Start Production)</>
                            )}
                        </button>
                        <div className="h-10" />
                    </div>
                </>
            ) : activeTab === 'import' ? (
                <>
                    <header className="mb-12">
                        <h1 className="text-4xl font-black text-white mb-3 italic tracking-tighter uppercase">Import <span className="text-indigo-500">Script</span></h1>
                        <p className="text-slate-400 font-medium">上传本地剧本文件并导入到项目中。</p>
                    </header>

                    <div className="space-y-8">
                        {/* File Upload Area */}
                        <section>
                            <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">01</span>
                                选择剧本文件
                            </h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Icons.Upload size={48} className="mx-auto mb-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                <p className="text-white font-black text-lg mb-2">
                                    {uploadFile ? uploadFile.name : '点击或拖拽文件到此处'}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    支持 .json 格式的剧本文件
                                </p>
                            </div>
                        </section>

                        {/* Import Status */}
                        {folderStatus === 'selecting' && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Folder size={20} className="text-blue-400 animate-pulse" />
                                <span className="text-sm text-blue-300">请先选择一个文件夹来保存项目...</span>
                            </div>
                        )}
                        {folderStatus === 'selected' && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Wand2 size={20} className="text-green-400 animate-pulse" />
                                <span className="text-sm text-green-300">正在导入剧本并保存文件...</span>
                            </div>
                        )}
                        {importError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <Icons.Skull size={20} className="text-red-400" />
                                <span className="text-sm text-red-300">{importError}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleImportSubmit}
                            disabled={loading || !uploadFile}
                            className="w-full py-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-[32px] font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-4 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                folderStatus === 'selecting' ? (
                                    <>
                                        <Icons.Folder size={24} className="animate-pulse" />
                                        等待选择文件夹...
                                    </>
                                ) : folderStatus === 'selected' ? (
                                    <>
                                        <Icons.Loader2 className="animate-spin" size={24} />
                                        正在导入剧本...
                                    </>
                                ) : (
                                    <>
                                        <Icons.Loader2 className="animate-spin" size={24} />
                                        处理中...
                                    </>
                                )
                            ) : (
                                <>导入剧本文件</>
                            )}
                        </button>
                        <div className="h-10" />
                    </div>
                </>
            ) : null}
        </div>
      </div>
    </div>
  );
};
