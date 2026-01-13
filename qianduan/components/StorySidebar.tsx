import React, { useState } from 'react';
import { StoryNode, NodeType, Character } from '../types';
import * as Icons from './Icons';
import { mockUploadToOSS } from '../services/ossService';

interface Props {
  nodes: Record<string, StoryNode>;
  characters?: Record<string, Character>;
  onSelect: (id: string) => void;
  onAddCharacter?: () => void;
  onUpdateNodes?: (nodes: Record<string, StoryNode>) => void;
  selectedId: string | null;
}

export const StorySidebar: React.FC<Props> = ({ nodes, characters = {}, onSelect, onAddCharacter, onUpdateNodes, selectedId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'script' | 'cast'>('script');
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Filter Nodes
    const nodeList = (Object.values(nodes) as StoryNode[]).filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter Characters
    const charList = (Object.values(characters) as Character[]).filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 批量同步文件夹功能：实现从本地文件夹“上传”视频并匹配节点
    const handleWorkspaceSync = async () => {
        if (!('showDirectoryPicker' in window)) {
            alert("您的浏览器不支持文件夹访问 API，请使用 Chrome 或 Edge。");
            return;
        }

        try {
            setIsSyncing(true);
            const dirHandle = await (window as any).showDirectoryPicker();
            const updatedNodes = { ...nodes };
            let count = 0;

            // 遍历文件夹
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    // 仅处理视频格式
                    if (file.type.startsWith('video/')) {
                        const fileName = file.name.toLowerCase();
                        
                        // 尝试匹配节点 (基于标题或 ID)
                        const targetNode = Object.values(updatedNodes).find(n => 
                            fileName.includes(n.title.toLowerCase()) || 
                            fileName.includes(n.id.toLowerCase())
                        );

                        if (targetNode) {
                            // 模拟上传到 OSS 并获取持久化链接
                            const ossUrl = await mockUploadToOSS(file);
                            updatedNodes[targetNode.id] = {
                                ...targetNode,
                                mediaType: 'video',
                                mediaSrc: ossUrl
                            };
                            count++;
                        }
                    }
                }
            }

            if (onUpdateNodes) {
                onUpdateNodes(updatedNodes);
                alert(`同步完成：共匹配并模拟上传了 ${count} 个视频。`);
            }
        } catch (err) {
            console.error("Workspace sync failed", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const getTypeColor = (type: NodeType) => {
        switch(type) {
            case 'scene': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case 'decision': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
            case 'ending': return 'text-red-400 border-red-400/30 bg-red-400/10';
            default: return 'text-slate-400 border-slate-400/30';
        }
    };

    const getTypeLabel = (type: NodeType) => {
        switch(type) {
            case 'scene': return '剧情';
            case 'decision': return '选项';
            case 'ending': return '结局';
            default: return type;
        }
    };

    return (
        <div className="w-80 h-full bg-slate-900 border-r border-slate-700 flex flex-col z-20 shadow-xl">
            {/* Header / Tabs */}
            <div className="p-2 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
                <div className="flex bg-slate-950 p-1 rounded-lg mb-2">
                    <button 
                        onClick={() => setTab('script')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tab === 'script' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icons.GitBranch size={14} /> 故事剧本
                    </button>
                    <button 
                        onClick={() => setTab('cast')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tab === 'cast' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icons.User size={14} /> 角色资产
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder={tab === 'script' ? "搜索节点..." : "搜索角色..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 pl-9 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                        />
                        <div className="absolute left-3 top-2.5 text-slate-500">
                            <Icons.ZoomIn size={12} /> 
                        </div>
                    </div>
                    {tab === 'script' && (
                        <button 
                            onClick={handleWorkspaceSync}
                            disabled={isSyncing}
                            title="同步本地工作目录视频"
                            className={`p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition-all ${isSyncing ? 'animate-pulse' : ''}`}
                        >
                            {isSyncing ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Folder size={14} />}
                        </button>
                    )}
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                
                {/* Script View */}
                {tab === 'script' && (
                    <>
                        {nodeList.length === 0 && (
                            <div className="text-center text-slate-500 text-xs py-10">暂无内容</div>
                        )}
                        {nodeList.map(node => (
                            <div 
                                key={node.id}
                                onClick={() => onSelect(node.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-800 ${selectedId === node.id ? 'bg-slate-800 border-cyan-500/50 shadow-md shadow-cyan-900/20' : 'bg-slate-950/50 border-slate-800'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-slate-200 truncate pr-2">{node.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTypeColor(node.type)}`}>
                                        {getTypeLabel(node.type)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {node.content}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {node.mediaSrc && <Icons.Check size={10} className="text-cyan-400" />}
                                    {node.mediaType === 'image' && <Icons.Image size={10} className="text-pink-400" />}
                                    {node.mediaType === 'video' && <Icons.Video size={10} className="text-cyan-400" />}
                                    <span className="text-[10px] text-slate-600 ml-auto font-mono">{(node.options || []).length} 分支</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Cast View */}
                {tab === 'cast' && (
                     <>
                        <button 
                            onClick={onAddCharacter}
                            className="w-full py-2 border border-dashed border-slate-700 hover:border-pink-500 rounded-lg text-slate-500 hover:text-pink-400 text-xs flex items-center justify-center gap-2 mb-2 transition-colors"
                        >
                            <Icons.Plus size={14} /> 添加新角色
                        </button>

                        {charList.length === 0 && (
                            <div className="text-center text-slate-500 text-xs py-10">暂无角色资产</div>
                        )}
                        
                        {charList.map(char => (
                            <div key={char.id} className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-900 overflow-hidden border border-slate-700 flex-shrink-0">
                                    {char.avatarSrc ? (
                                        <img src={char.avatarSrc} alt={char.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Icons.User size={16}/></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-200 truncate">{char.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate">{char.description}</p>
                                </div>
                            </div>
                        ))}
                     </>
                )}
            </div>
        </div>
    );
};