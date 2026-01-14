
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StoryNode, StoryOption, StyleMode } from '../types';
import * as Icons from './Icons';
import { getMediaFileUrl } from '../services/fileSystemService';

interface Props {
  nodes: Record<string, StoryNode>;
  startId: string;
  folderHandle?: any;
  mediaUrls?: Record<string, string>;
  onClose: () => void;
}

export const PreviewPlayer: React.FC<Props> = ({ nodes, startId, folderHandle, mediaUrls = {}, onClose }) => {
  const [currentId, setCurrentId] = useState(startId);
  const [showOptions, setShowOptions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100);
  const [isLocked, setIsLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [localMediaUrls, setLocalMediaUrls] = useState<Record<string, string>>({});
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const node = nodes[currentId];
  const styleMode: StyleMode = node?.styleMode || 'late_shift';

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  // 加载本地媒体文件
  useEffect(() => {
    const loadLocalMedia = async () => {
      if (!folderHandle || !node?.mediaSrc) return;

      // 如果已经有 mediaUrls，优先使用
      if (mediaUrls[currentId]) {
        return;
      }

      // 如果 mediaSrc 是相对路径且不是 http/https/blob URL
      if (node.mediaSrc &&
          !node.mediaSrc.startsWith('http') &&
          !node.mediaSrc.startsWith('blob:') &&
          !node.mediaSrc.startsWith('data:')) {
        setIsLoadingMedia(true);
        setMediaError(false);
        try {
          const url = await getMediaFileUrl(folderHandle, node.mediaSrc);
          setLocalMediaUrls(prev => ({ ...prev, [currentId]: url }));
        } catch (error) {
          console.warn(`无法加载本地媒体文件 ${node.mediaSrc}:`, error);
          setMediaError(true);
        } finally {
          setIsLoadingMedia(false);
        }
      }
    };

    loadLocalMedia();
  }, [currentId, node, folderHandle]);

  // 获取当前节点的媒体 URL
  const currentMediaUrl = useMemo(() => {
    return mediaUrls[currentId] || localMediaUrls[currentId] || node?.mediaSrc;
  }, [currentId, mediaUrls, localMediaUrls, node]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'KeyR') {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  useEffect(() => {
    // 商业化锁定检查
    if (node && (node.monetization?.type === 'ad' || node.monetization?.type === 'paid') && !unlockedIds.has(currentId)) {
        setIsLocked(true);
        if (videoRef.current) videoRef.current.pause();
    } else {
        setIsLocked(false);
    }

    setShowOptions(false);
    setTimeLeft(100);
    if (timerRef.current) clearInterval(timerRef.current);

    if (node && node.mediaType !== 'video' && node.options.length > 0 && !isLocked) {
        const autoShowTimer = setTimeout(() => {
            setShowOptions(true);
            startDecisionTimer(node.interactiveSettings?.decisionTriggerTime || 5);
        }, 3000); 
        return () => clearTimeout(autoShowTimer);
    }
  }, [currentId, node, isLocked]);

  const handleUnlock = async () => {
    setUnlocking(true);
    // 模拟广告播放或购买流程
    await new Promise(r => setTimeout(r, 2000));
    setUnlockedIds(prev => new Set([...prev, currentId]));
    setIsLocked(false);
    setUnlocking(false);
    if (videoRef.current) videoRef.current.play();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !node || isLocked) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration) return;
    
    const triggerTime = node.interactiveSettings?.decisionTriggerTime || 5;
    if (duration - currentTime <= triggerTime && !showOptions && node.options.length > 0) {
      setShowOptions(true);
      startDecisionTimer(triggerTime);
    }
  };

  const startDecisionTimer = (seconds: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const step = 100 / (seconds * 20);
      let current = 100;
      timerRef.current = window.setInterval(() => {
          current -= step;
          setTimeLeft(current);
          if (current <= 0) {
              clearInterval(timerRef.current!);
              handleTimeout();
          }
      }, 50);
  };

  const handleTimeout = () => {
      const defaultOpt = node.options.find(o => o.isDefault) || node.options[0];
      if (defaultOpt && defaultOpt.targetId) handleSelect(defaultOpt.targetId);
  };

  const handleSelect = (targetId: string) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (nodes[targetId]) {
          setCurrentId(targetId);
      } else {
          setCurrentId(""); 
      }
  };

  const THEMES = {
      late_shift: {
          accent: 'bg-cyan-500',
          bg: 'bg-black/40',
          btn: 'hover:bg-white text-white hover:text-black border-white/10',
          label: 'text-cyan-500',
          font: 'italic font-black',
          title: 'Decision Point'
      },
      meibao: {
          accent: 'bg-pink-500',
          bg: 'bg-pink-900/40',
          btn: 'hover:bg-pink-500 text-white border-pink-500/30',
          label: 'text-pink-300',
          font: 'font-bold',
          title: '心跳瞬间'
      },
      shengshi: {
          accent: 'bg-amber-600',
          bg: 'bg-amber-950/60',
          btn: 'hover:bg-amber-600 text-amber-100 border-amber-800',
          label: 'text-amber-500',
          font: 'font-serif font-bold',
          title: '命途抉择'
      }
  };

  const theme = THEMES[styleMode];

  if (!node) return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
          <Icons.Skull size={64} className="text-red-500 mb-6 animate-pulse" />
          <h2 className="text-4xl font-black mb-8 italic text-center">剧终 / THE END</h2>
          <button onClick={onClose} className="px-12 py-4 bg-white text-black rounded-full font-black hover:scale-105 transition-all">返回</button>
      </div>
  );

  return (
    <div className={`fixed inset-0 z-50 bg-black text-white font-sans overflow-hidden select-none`}>
      <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full aspect-[21/9] bg-slate-900 overflow-hidden shadow-2xl">
              {isLoadingMedia ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <Icons.Loader2 className="animate-spin text-white/50" size={48} />
                  <p className="text-white/50 text-sm">加载媒体文件中...</p>
                </div>
              ) : mediaError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <Icons.Video size={48} className="text-red-500/50" />
                  <p className="text-red-400 text-sm">无法加载媒体文件</p>
                  <p className="text-white/30 text-xs">{node?.mediaSrc}</p>
                </div>
              ) : node.mediaType === 'video' && node.mediaSrc ? (
                  <video
                    ref={videoRef}
                    src={currentMediaUrl}
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
                    onError={() => setMediaError(true)}
                    className="w-full h-full object-cover"
                  />
              ) : (
                  <img src={currentMediaUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000'} className="w-full h-full object-cover opacity-80" />
              )}
              {styleMode === 'shengshi' && <div className="absolute inset-0 border-[40px] border-double border-amber-900/20 pointer-events-none" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent pointer-events-none" />
          </div>
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/20 rounded-full z-50 transition-all"><Icons.X size={24} /></button>

      {/* 播放控制按钮 */}
      <div className="absolute top-8 left-8 flex gap-2 z-50">
        <button
          onClick={() => {
            if (videoRef.current) {
              if (videoRef.current.paused) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
            }
          }}
          className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-all"
          title="播放/暂停"
        >
          <Icons.Play size={24} />
        </button>
        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play();
            }
          }}
          className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-all"
          title="重新播放"
        >
          <Icons.Monitor size={24} />
        </button>
        <button
          onClick={() => {
            // 跳转到开始节点
            const startNodeId = Object.keys(nodes).find(id => id === 'start') || Object.keys(nodes)[0];
            if (startNodeId) {
              setCurrentId(startNodeId);
            }
          }}
          className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-all"
          title="返回开始"
        >
          <Icons.ChevronLeft size={24} />
        </button>
      </div>

      {/* 节点信息显示 */}
      <div className="absolute bottom-8 right-8 text-right z-40">
        <p className="text-xs text-white/50 font-mono">节点 ID: {currentId}</p>
        <p className="text-xs text-white/50 font-mono">类型: {node?.mediaType || '无'}</p>
        {currentMediaUrl && !currentMediaUrl.startsWith('http') && (
          <p className="text-xs text-green-500 font-mono mt-1">✓ 本地文件</p>
        )}
        <div className="mt-2 text-xs text-white/30 font-mono space-y-0.5">
          <p>空格: 播放/暂停</p>
          <p>R: 重新播放</p>
          <p>ESC: 关闭</p>
        </div>
      </div>

      {/* 商业化锁定蒙层 */}
      {isLocked && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] p-8 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                      {node.monetization?.type === 'paid' ? <Icons.Coins size={40} className="text-white" /> : <Icons.Zap size={40} className="text-white" />}
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 italic uppercase">内容锁定</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                      {node.monetization?.type === 'paid' 
                        ? `解锁此精彩片段需要支付 ${node.monetization.price} 金币。` 
                        : node.monetization?.adDescription || '解锁后即可继续观看后续精彩内容'}
                  </p>
                  <button 
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full py-4 bg-white text-slate-950 rounded-full font-black text-sm flex items-center justify-center gap-3 hover:bg-cyan-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                      {unlocking ? (
                          <Icons.Loader2 className="animate-spin" />
                      ) : (
                          node.monetization?.type === 'paid' ? <><Icons.Coins size={18} /> 立即支付解锁</> : <><Icons.Play size={18} /> 观看视频解锁</>
                      )}
                  </button>
                  <button onClick={onClose} className="mt-4 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">暂不解锁，返回首页</button>
              </div>
          </div>
      )}

      <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-4xl transition-all duration-700 transform ${showOptions && !isLocked ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className={`px-10 py-8 ${theme.bg} backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl`}>
              <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-end">
                      <div>
                          <p className={`text-xs font-bold tracking-[0.2em] ${theme.label} uppercase mb-2`}>{theme.title}</p>
                          <h2 className={`text-2xl ${theme.font} text-white`}>{node.title}</h2>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      {node.options.map((opt) => (
                          <button key={opt.id} onClick={() => handleSelect(opt.targetId)} className={`p-6 bg-white/5 border ${theme.btn} rounded-2xl font-bold text-lg text-left transition-all`}>
                              {opt.label}
                          </button>
                      ))}
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${theme.accent} transition-all duration-50 linear`} style={{ width: `${timeLeft}%` }} />
                  </div>
              </div>
          </div>
      </div>

      {!showOptions && !isLocked && (
          <div className={`absolute bottom-12 left-12 max-w-xl ${styleMode === 'shengshi' ? 'font-serif' : ''} transition-all duration-1000 animate-in fade-in slide-in-from-bottom-4`}>
               <p className="text-xl text-white/90 drop-shadow-md bg-black/20 p-4 rounded-lg backdrop-blur-sm">{node.content}</p>
          </div>
      )}
    </div>
  );
};
