
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StoryNode, Character, ProjectData, ElementPosition } from './types';
import { NewProjectModal } from './components/NewProjectModal';
import { PropertyPanel } from './components/PropertyPanel';
import { PreviewPlayer } from './components/PreviewPlayer';
import { LayoutEditorModal } from './components/LayoutEditorModal';
import { StorySidebar } from './components/StorySidebar';
import { CharacterManager } from './components/CharacterManager';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BuildPackageModal } from './components/BuildPackageModal';
import { DownloadArtifactModal } from './components/DownloadArtifactModal';
import * as Icons from './components/Icons';

const STORAGE_KEY = 'cine_genesis_project_data';

const INITIAL_NODES: Record<string, StoryNode> = {
  "start": {
    id: "start",
    title: "序章：苏醒",
    type: "scene",
    content: "你在一个冷冻舱中醒来。警报声在耳边回荡，空气中弥漫着臭氧和铁锈的味道。控制台闪烁着微弱的红光，你什么都想不起来。",
    mediaType: "none",
    mediaSrc: "",
    audioSrc: "",
    x: 100,
    y: 300,
    options: [
      { id: "o1", label: "检查控制台", targetId: "n2" },
      { id: "o2", label: "强行打开舱门", targetId: "n3" }
    ]
  },
  "n2": {
    id: "n2",
    title: "系统日志",
    type: "decision",
    content: "控制台屏幕闪烁不定。上面显示着 '致命错误：船体破损'。你发现了一段未发送的求救信号。",
    mediaType: "none",
    mediaSrc: "",
    audioSrc: "",
    x: 500,
    y: 200,
    options: []
  },
  "n3": {
    id: "n3",
    title: "黑暗走廊",
    type: "scene",
    content: "舱门在火花中滑开。走廊一片漆黑，远处的应急灯忽明忽暗，仿佛有什么东西在阴影中移动。",
    mediaType: "none",
    mediaSrc: "",
    audioSrc: "",
    x: 500,
    y: 400,
    options: []
  }
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Record<string, StoryNode>>(INITIAL_NODES);
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCharManagerOpen, setIsCharManagerOpen] = useState(false);
  const [isBuildPackageOpen, setIsBuildPackageOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [layoutEditorNodeId, setLayoutEditorNodeId] = useState<string | null>(null);
  const [nodeIdToDelete, setNodeIdToDelete] = useState<string | null>(null);
  
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        if (data.nodes) setNodes(data.nodes);
        if (data.characters) setCharacters(data.characters);
        if (data.viewport) {
          setPan({ x: data.viewport.x, y: data.viewport.y });
          setZoom(data.viewport.zoom);
        }
      } catch (e) {
        console.error("Failed to load saved project", e);
      }
    }
  }, []);

  // Auto-save to LocalStorage
  useEffect(() => {
    const data: ProjectData = { nodes, characters, viewport: { x: pan.x, y: pan.y, zoom } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [nodes, characters, pan, zoom]);

  const connections = useMemo(() => {
    const lines: React.ReactElement[] = [];
    Object.values(nodes).forEach((node: StoryNode) => {
      node.options.forEach(opt => {
        const target = nodes[opt.targetId];
        if (target) {
          const sx = node.x + 240;
          const sy = node.y + 60;
          const tx = target.x;
          const ty = target.y + 60;
          
          const path = `M ${sx} ${sy} C ${sx + 100} ${sy}, ${tx - 100} ${ty}, ${tx} ${ty}`;
          lines.push(
            <g key={`${node.id}-${opt.id}`}>
                <path d={path} fill="none" stroke="#0891b2" strokeWidth="2" className="opacity-40" />
                <circle cx={tx} cy={ty} r="3" fill="#0891b2" />
            </g>
          );
        }
      });
    });
    return lines;
  }, [nodes]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'svg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (dragNodeId) {
      setNodes(prev => ({
        ...prev,
        [dragNodeId]: {
          ...prev[dragNodeId],
          x: prev[dragNodeId].x + e.movementX / zoom,
          y: prev[dragNodeId].y + e.movementY / zoom
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragNodeId(null);
  };

  const addNode = () => {
    const id = `node_${Date.now()}`;
    const newNode: StoryNode = {
      id,
      title: "新剧情节点",
      type: "scene",
      content: "在此处输入中文剧情描述...",
      mediaType: "none",
      mediaSrc: "",
      audioSrc: "",
      x: -pan.x + 400,
      y: -pan.y + 300,
      options: []
    };
    setNodes({ ...nodes, [id]: newNode });
    setSelectedId(id);
  };

  const deleteNodeRequest = (id: string) => {
    if (id === 'start') {
        alert("根节点 'start' 不能被删除。");
        return;
    }
    setNodeIdToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (!nodeIdToDelete) return;
    const id = nodeIdToDelete;

    setNodes(prev => {
        const updated = { ...prev };
        delete updated[id];
        Object.keys(updated).forEach(nodeKey => {
            updated[nodeKey] = {
                ...updated[nodeKey],
                options: updated[nodeKey].options.map(opt => 
                    opt.targetId === id ? { ...opt, targetId: '' } : opt
                )
            };
        });
        return updated;
    });

    if (selectedId === id) {
        setSelectedId(null);
    }
    setNodeIdToDelete(null);
  };

  const handleUpdateNode = (id: string, updates: Partial<StoryNode>) => {
    setNodes(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const handleCreateNodes = (newNodes: StoryNode[]) => {
      setNodes(prev => {
          const updated = { ...prev };
          newNodes.forEach(node => {
              updated[node.id] = node;
          });
          return updated;
      });
  };

  const handleSaveLayout = (nodeId: string, layout: { textPos: ElementPosition, optionsPos: ElementPosition }) => {
      setNodes(prev => ({
          ...prev,
          [nodeId]: {
              ...prev[nodeId],
              ...layout
          }
      }));
  };

  const handleSaveCharacter = (char: Character) => {
      setCharacters(prev => ({ ...prev, [char.id]: char }));
  };

  const exportProject = () => {
    const data: ProjectData = { nodes, characters, viewport: { x: pan.x, y: pan.y, zoom } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cine-genesis-project.json';
    a.click();
  };

  const handleNewProject = (newNodes: Record<string, StoryNode>) => {
      setNodes(newNodes);
      setCharacters({});
      setPan({ x: 0, y: 0 });
      setSelectedId(null);
      localStorage.removeItem(STORAGE_KEY);
  };

  const handleSidebarSelect = (id: string) => {
      setSelectedId(id);
      const node = nodes[id];
      if (node) {
          const sidebarWidth = 320; 
          const centerX = (window.innerWidth - sidebarWidth) / 2;
          const centerY = window.innerHeight / 2;
          setPan({
              x: centerX - (node.x + 120) * zoom, 
              y: centerY - (node.y + 100) * zoom
          });
      }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Icons.Film className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white">CINE-GENESIS</h1>
            <p className="text-[10px] text-cyan-400 font-mono tracking-widest">AIGC 互动电影编辑器</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsNewProjectOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
                <Icons.Plus size={16} /> 新建剧本
            </button>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <button onClick={addNode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors border border-slate-700">
                <Icons.Plus size={14} /> 新建节点
            </button>
            <button onClick={exportProject} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors border border-slate-700">
                <Icons.Save size={14} /> 导出工程
            </button>
            <button
                onClick={() => setIsBuildPackageOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white transition-colors border border-purple-500 shadow-lg shadow-purple-900/20"
            >
                <Icons.Package size={14} /> 打包应用
            </button>
            <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs text-whiteQl transition-colors border border-orange-500 shadow-lg shadow-orange-900/20"
            >
                <Icons.Download size={14} /> 下载成品
            </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full text-white font-medium shadow-lg shadow-blue-500/25 transition-transform hover:scale-105">
            <Icons.Play size={16} fill="currentColor" /> 试玩预览
          </button>
        </div>
      </div>

      <div className="flex w-full h-full pt-16">
          <StorySidebar 
             nodes={nodes} 
             characters={characters}
             selectedId={selectedId} 
             onSelect={handleSidebarSelect}
             onAddCharacter={() => setIsCharManagerOpen(true)}
          />

          <div 
            className="relative flex-1 bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing grid-bg"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div 
                className="absolute transform-gpu origin-top-left transition-transform duration-75 ease-out"
                style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    width: '100%', 
                    height: '100%'
                }}
            >
                <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none overflow-visible">
                    {connections}
                </svg>

                {Object.values(nodes).map((node: StoryNode) => (
                    <div
                        key={node.id}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragNodeId(node.id);
                            setSelectedId(node.id);
                        }}
                        style={{ left: node.x, top: node.y }}
                        className={`absolute w-60 rounded-xl backdrop-blur-md transition-shadow duration-200 group node-enter
                            ${selectedId === node.id 
                                ? 'bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] z-30' 
                                : 'bg-slate-900/60 border border-slate-700 hover:border-slate-500 z-10'}`}
                    >
                        <div className={`h-1.5 w-full rounded-t-xl ${node.type === 'scene' ? 'bg-blue-500' : node.type === 'decision' ? 'bg-purple-500' : 'bg-red-500'}`} />
                        <div className="p-4 cursor-pointer relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteNodeRequest(node.id); }}
                                className="absolute top-2 right-2 p-1.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-20"
                                title="删除节点"
                            >
                                <Icons.Trash2 size={12} />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] uppercase font-mono text-slate-500">{node.type === 'scene' ? '剧情' : node.type === 'decision' ? '选项' : '结局'}</span>
                                <div className="flex gap-1 pr-6">
                                    {node.mediaType !== 'none' && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                                    {node.audioSrc && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-100 truncate mb-1">{node.title}</h3>
                            <div className="max-h-32 overflow-y-auto pr-1 mb-1 scrollbar-thin">
                                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{node.content}</p>
                            </div>
                            {node.mediaSrc && (
                                <div className="mt-3 h-20 w-full rounded bg-black/50 overflow-hidden border border-slate-800">
                                    {node.mediaType === 'video' ? (
                                        <video src={node.mediaSrc} className="w-full h-full object-cover opacity-70" />
                                    ) : (
                                        <img src={node.mediaSrc} className="w-full h-full object-cover opacity-70" alt="preview" />
                                    )}
                                </div>
                            )}
                        </div>
                        {node.options.length > 0 && (
                            <div className="absolute -right-1 top-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
                        )}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-xl z-50">
                <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-700 rounded text-slate-300"><Icons.ZoomIn size={18}/></button>
                <span className="text-center text-[10px] font-mono text-slate-500">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 hover:bg-slate-700 rounded text-slate-300"><Icons.ZoomOut size={18}/></button>
            </div>
          </div>

          {selectedId && nodes[selectedId] && (
            <PropertyPanel 
                node={nodes[selectedId]} 
                allNodes={nodes}
                onUpdate={handleUpdateNode}
                onCreateNodes={handleCreateNodes}
                onDelete={deleteNodeRequest}
                onEditLayout={setLayoutEditorNodeId}
                onClose={() => setSelectedId(null)}
                stylePrompt="Sci-Fi Cinematic" 
            />
          )}
      </div>

      {isNewProjectOpen && (
          <NewProjectModal 
            onConfirm={handleNewProject}
            onClose={() => setIsNewProjectOpen(false)}
          />
      )}

      {isPreviewOpen && (
          <PreviewPlayer 
            nodes={nodes}
            startId="start"
            onClose={() => setIsPreviewOpen(false)}
          />
      )}

      {layoutEditorNodeId && nodes[layoutEditorNodeId] && (
          <LayoutEditorModal 
            node={nodes[layoutEditorNodeId]}
            onSave={handleSaveLayout}
            onClose={() => setLayoutEditorNodeId(null)}
          />
      )}

      {isCharManagerOpen && (
          <CharacterManager 
            onSave={handleSaveCharacter}
            onClose={() => setIsCharManagerOpen(false)}
          />
      )}

      {nodeIdToDelete && nodes[nodeIdToDelete] && (
          <DeleteConfirmModal
            nodeTitle={nodes[nodeIdToDelete].title}
            onConfirm={handleConfirmDelete}
            onCancel={() => setNodeIdToDelete(null)}
          />
      )}

      {isBuildPackageOpen && (
          <BuildPackageModal
            isOpen={isBuildPackageOpen}
            onClose={() => setIsBuildPackageOpen(false)}
            projectData={{ nodes, characters, viewport: { x: pan.x, y: pan.y, zoom } }}
          />
      )}

      {isDownloadModalOpen && (
          <DownloadArtifactModal 
            onClose={() => setIsDownloadModalOpen(false)}
          />
      )}

    </div>
  );
};

export default App;
