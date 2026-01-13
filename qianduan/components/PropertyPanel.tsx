import React, { useState, useRef, useEffect } from 'react';
import { StoryNode, StoryOption, NodeType, MediaType, MonetizationType, UserRole } from '../types';
import * as Icons from './Icons';
import { generateSceneImage, generateSceneVideo, polishNodeText } from '../services/geminiService';
import { saveSingleNode, updateScriptJson, saveMediaFile, getMediaFileUrl, deleteMediaFile } from '../services/fileSystemService';

interface Props {
  node: StoryNode;
  allNodes: Record<string, StoryNode>;
  folderHandle?: any;
  onUpdate: (id: string, updates: Partial<StoryNode>) => void;
  onCreateNodes?: (newNodes: StoryNode[]) => void;
  onEditLayout?: (nodeId: string) => void;
  onClose: () => void;
  stylePrompt: string;
  userRole: UserRole;
}

export const PropertyPanel: React.FC<Props> = ({ node, allNodes, folderHandle, onUpdate, onCreateNodes, onEditLayout, onClose, stylePrompt, userRole }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 当节点媒体源改变时，加载媒体文件的 URL
  useEffect(() => {
    const loadMediaUrl = async () => {
      if (node.mediaSrc && folderHandle) {
        try {
          // 如果是相对路径（本地文件），使用 File System Access API 加载
          if (node.mediaSrc.startsWith('videos/') || node.mediaSrc.startsWith('images/')) {
            const url = await getMediaFileUrl(folderHandle, node.mediaSrc);
            setMediaUrl(url);
          } else {
            // 如果是完整 URL（如 AI 生成的），直接使用
            setMediaUrl(node.mediaSrc);
          }
        } catch (error) {
          console.error('加载媒体文件失败:', error);
          setMediaUrl('');
        }
      } else {
        setMediaUrl('');
      }
    };

    loadMediaUrl();

    // 清理函数：释放 URL 对象
    return () => {
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [node.mediaSrc, folderHandle]);

  const handleGenMedia = async (type: MediaType) => {
    setLoading(type);
    let result = null;
    if (type === 'image') result = await generateSceneImage(node.content, node.styleMode || 'late_shift');
    else if (type === 'video') result = await generateSceneVideo(node.content, node.styleMode || 'late_shift');
    if (result) onUpdate(node.id, { mediaType: type, mediaSrc: result });
    setLoading(null);
  };

  const handleDeleteMedia = async () => {
    if (!node.mediaSrc) return;

    // 如果是本地文件，删除文件系统中的文件
    if (folderHandle && (node.mediaSrc.startsWith('videos/') || node.mediaSrc.startsWith('images/'))) {
      try {
        await deleteMediaFile(folderHandle, node.mediaSrc);
      } catch (error) {
        console.error('删除媒体文件失败:', error);
        // 即使删除文件失败，也继续清除引用
      }
    }

    // 清除节点中的媒体引用
    onUpdate(node.id, { mediaSrc: '', mediaType: 'none' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: MediaType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!folderHandle) {
      alert('未找到项目文件夹，无法保存文件。请确保项目已正确加载。');
      return;
    }

    // 验证 mediaType
    if (type !== 'video' && type !== 'image') {
      alert('无效的媒体类型');
      return;
    }

    setLoading(`upload_${type}`);
    try {
      // 保存文件到本地文件夹
      const relativePath = await saveMediaFile(
        folderHandle,
        file,
        node.id,
        type as 'video' | 'image'
      );

      // 更新节点 JSON 状态，将相对路径存入 mediaSrc
      const updatedNode = { ...node, mediaType: type, mediaSrc: relativePath };
      onUpdate(node.id, { mediaType: type, mediaSrc: relativePath });

      // 同时保存节点文件
      await saveSingleNode(folderHandle, node.id, updatedNode);

      // 自动更新 script.json，确保所有节点数据同步
      await updateScriptJson(folderHandle, allNodes);

      console.log(`媒体文件已保存到本地: ${relativePath}`);
      console.log(`script.json 已自动更新`);
    } catch (err: any) {
      console.error('媒体文件保存失败:', err);
      alert(`保存失败: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const updateMonetization = (type: MonetizationType, updates: any = {}) => {
    onUpdate(node.id, {
        monetization: {
            type,
            price: node.monetization?.price || 1,
            adDescription: node.monetization?.adDescription || '观看广告解锁后续剧情',
            ...updates
        }
    });
  };

  const addOption = () => {
    const currentOptions = node.options || [];
    const newOpt: StoryOption = { id: `opt_${Date.now()}`, label: '新决策', targetId: '', isDefault: currentOptions.length === 0 };
    onUpdate(node.id, { options: [...currentOptions, newOpt] });
  };

  const updateOption = (idx: number, updates: Partial<StoryOption>) => {
    const currentOptions = [...(node.options || [])];
    currentOptions[idx] = { ...currentOptions[idx], ...updates };
    onUpdate(node.id, { options: currentOptions });
  };

  const handleSave = async () => {
    if (!folderHandle) {
      alert('未找到项目文件夹，无法保存');
      return;
    }

    setSaveStatus('saving');
    try {
      // 保存当前节点到 scenes/{nodeId}.json
      await saveSingleNode(folderHandle, node.id, node);

      // 更新 script.json
      await updateScriptJson(folderHandle, allNodes);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('保存失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-20">
      <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur relative overflow-hidden">
        {userRole === 'admin' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-600 to-yellow-400" />}
        <h2 className="font-black text-cyan-400 flex items-center gap-2 uppercase tracking-tighter italic">
          <Icons.Film size={18} /> 镜头属性 {userRole === 'admin' && <span className="text-[10px] text-amber-500 font-black ml-2 px-1 border border-amber-500 rounded">ADMIN</span>}
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><Icons.X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        {/* 1. 基础设定 */}
        <section className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">镜头标题</label>
                <input 
                    value={node.title} 
                    onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {(['scene', 'decision', 'ending'] as NodeType[]).map(t => (
                    <button 
                        key={t}
                        onClick={() => onUpdate(node.id, { type: t })}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${node.type === t ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                        {t === 'scene' ? '过场' : t === 'decision' ? '关键决策' : '结局'}
                    </button>
                ))}
            </div>
        </section>

        {/* 2. 媒体素材区 */}
        <section className="space-y-4">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">媒体素材 (Media Assets)</label>
            <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
            <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => videoInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
                    >
                        {loading === 'upload_video' ? <Icons.Loader2 className="animate-spin text-cyan-400" /> : <Icons.Upload className="text-slate-500 group-hover:text-cyan-400" size={20} />}
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">上传视频</span>
                    </button>
                    <button 
                        onClick={() => imageInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
                    >
                        {loading === 'upload_image' ? <Icons.Loader2 className="animate-spin text-cyan-400" /> : <Icons.Image className="text-slate-500 group-hover:text-cyan-400" size={20} />}
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">上传图片</span>
                    </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                        <Icons.Wand2 size={12} /> AI 智能制片
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleGenMedia('video')} disabled={!!loading} className="py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2">
                            {loading === 'video' ? <Icons.Loader2 size={12}/> : <Icons.Video size={12}/>} 生成镜头
                        </button>
                        <button onClick={() => handleGenMedia('image')} disabled={!!loading} className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2">
                            {loading === 'image' ? <Icons.Loader2 size={12}/> : <Icons.Image size={12}/>} 生成图片
                        </button>
                    </div>
                </div>
            </div>
            {node.mediaSrc && mediaUrl && (
               <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center shadow-2xl">
                   {node.mediaType === 'video' ? <video src={mediaUrl} className="w-full h-full object-cover" controls /> : <img src={mediaUrl} className="w-full h-full object-cover" />}
                   <div className="absolute top-2 right-2 group">
                        <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <button onClick={handleDeleteMedia} className="relative p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-all"><Icons.Trash2 size={18} /></button>
                   </div>
               </div>
            )}
        </section>

        {/* 3. 脚本内容 */}
        <section className="space-y-2">
          <div className="flex justify-between items-center">
             <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">剧本/台词</label>
             <button onClick={async () => {
                setLoading('polish');
                const p = await polishNodeText(node.content, node.styleMode || 'late_shift');
                onUpdate(node.id, { content: p });
                setLoading(null);
             }} className="text-[10px] text-purple-400 flex items-center gap-1">
                {loading === 'polish' ? <Icons.Loader2 size={10}/> : <Icons.Wand2 size={10}/>} AI 润色
             </button>
          </div>
          <textarea 
            value={node.content} 
            onChange={(e) => onUpdate(node.id, { content: e.target.value })}
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:border-cyan-500 outline-none resize-none leading-relaxed"
          />
        </section>

        {/* 4. 决策分支 */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">互动分支 (Branches)</label>
            <button onClick={addOption} className="p-1 bg-cyan-600/20 text-cyan-400 rounded hover:bg-cyan-600 hover:text-white transition-all"><Icons.Plus size={16} /></button>
          </div>
          <div className="space-y-3">
            {(node.options || []).map((opt, idx) => (
              <div key={opt.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative group">
                 <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-600">#0{idx+1}</span>
                     <button onClick={() => {
                        const newOpts = (node.options || []).filter((_, i) => i !== idx);
                        onUpdate(node.id, { options: newOpts });
                     }} className="text-slate-700 hover:text-red-500 transition-colors"><Icons.X size={14}/></button>
                 </div>
                 <input 
                    value={opt.label}
                    onChange={(e) => updateOption(idx, { label: e.target.value })}
                    placeholder="玩家看到的按钮文本..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-600"
                 />
                 <select 
                    value={opt.targetId}
                    onChange={(e) => updateOption(idx, { targetId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 outline-none"
                 >
                     <option value="">跳转到镜头...</option>
                     {(Object.values(allNodes) as StoryNode[]).filter(n => n.id !== node.id).map((n: StoryNode) => (
                         <option key={n.id} value={n.id}>{n.title}</option>
                     ))}
                 </select>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 变现与经济系统 (Conditionally Rendered for Admins Only) */}
        {userRole === 'admin' && (
            <section className="bg-slate-950 p-5 rounded-3xl border border-amber-500/20 space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-amber-500 uppercase font-black tracking-widest flex items-center gap-2">
                        <Icons.Zap size={12} className="text-amber-500" /> 变现引擎 (IAA+IAP)
                    </label>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${node.monetization?.type === 'paid' ? 'bg-purple-500/20 text-purple-400' : node.monetization?.type === 'ad' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {node.monetization?.type || 'free'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {(['free', 'ad', 'paid'] as MonetizationType[]).map(m => (
                        <button 
                            key={m}
                            onClick={() => updateMonetization(m)}
                            className={`py-2 flex flex-col items-center gap-1 rounded-xl border transition-all ${ (node.monetization?.type || 'free') === m ? 'bg-amber-500/10 border-amber-500/50 text-white' : 'bg-slate-900/50 border-transparent text-slate-600 hover:bg-slate-800'}`}
                        >
                            {m === 'free' && <Icons.Heart size={14} className={node.monetization?.type === 'free' || !node.monetization?.type ? 'text-emerald-400' : ''} />}
                            {m === 'ad' && <Icons.Play size={14} className={node.monetization?.type === 'ad' ? 'text-yellow-400' : ''} />}
                            {m === 'paid' && <Icons.Coins size={14} className={node.monetization?.type === 'paid' ? 'text-purple-400' : ''} />}
                            <span className="text-[10px] font-black uppercase">{m === 'free' ? '免费' : m === 'ad' ? '广告' : '付费'}</span>
                        </button>
                    ))}
                </div>

                {node.monetization?.type === 'paid' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] text-slate-500 font-bold mb-2 block uppercase tracking-tighter">解锁所需金币 (Tokens)</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number"
                                value={node.monetization.price}
                                onChange={(e) => updateMonetization('paid', { price: parseInt(e.target.value) })}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-black outline-none focus:border-amber-500"
                            />
                            <Icons.Coins className="text-purple-400" />
                        </div>
                    </div>
                )}

                {node.monetization?.type === 'ad' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] text-slate-500 font-bold mb-2 block uppercase tracking-tighter">广告提示语</label>
                        <input 
                            value={node.monetization.adDescription}
                            onChange={(e) => updateMonetization('ad', { adDescription: e.target.value })}
                            placeholder="例如：观看视频解锁隐藏剧情"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500"
                        />
                    </div>
                )}
            </section>
        )}
        
        {/* Extra spacer for scrolling */}
        <div className="h-10" />
      </div>

      {/* 保存按钮区域 */}
      <div className="p-5 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !folderHandle}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
            saveStatus === 'saving'
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : saveStatus === 'success'
              ? 'bg-emerald-600 text-white'
              : saveStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <Icons.Loader2 size={18} className="animate-spin" />
              保存中...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Icons.Check size={18} />
              保存成功
            </>
          ) : saveStatus === 'error' ? (
            <>
              <Icons.X size={18} />
              保存失败
            </>
          ) : (
            <>
              <Icons.Save size={18} />
              保存到文件
            </>
          )}
        </button>
        {!folderHandle && (
          <p className="text-[10px] text-slate-600 text-center mt-2">
            此项目未关联本地文件夹
          </p>
        )}
      </div>
    </div>
  );
};