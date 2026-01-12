
import React, { useEffect, useState } from 'react';
import * as Icons from './Icons';

interface Props {
  onClose: () => void;
}

// 定义后端 API 基础地址
const API_BASE_URL = 'http://localhost:3002';

interface BuildRun {
    id: number;
    buildId: string;
    status: string;
    conclusion: string | null;
    platform: string;
    createdAt: string;
    runUrl: string;
    duration: string;
    actor: string;
}

export const DownloadArtifactModal: React.FC<Props> = ({ onClose }) => {
  const [builds, setBuilds] = useState<BuildRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
      setLoading(true);
      setError('');
      try {
          // 直接请求指定的后端接口
          const response = await fetch(`${API_BASE_URL}/api/github/builds`);
          
          if (!response.ok) {
              const text = await response.text();
              throw new Error(`请求失败 (${response.status}): ${text}`);
          }
          
          const data = await response.json();
          
          if (data && data.success && Array.isArray(data.builds)) {
              setBuilds(data.builds);
          } else {
              setBuilds([]);
              if (!data.success) {
                  throw new Error(data.error || '获取数据格式错误');
              }
          }
      } catch (err: any) {
          console.error("Failed to fetch builds", err);
          setError(err.message || '无法连接到后端服务，请确认 http://localhost:3002 已启动');
      } finally {
          setLoading(false);
      }
  };

  const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
  };

  const getRelativeTime = (dateString: string) => {
      try {
          const date = new Date(dateString);
          const now = new Date();
          const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
          
          if (diffInSeconds < 60) return '刚刚';
          if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
          if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
          return `${Math.floor(diffInSeconds / 86400)}天前`;
      } catch (e) {
          return '';
      }
  };

  const handleDownload = (runId: number) => {
      // 使用 window.location.href 触发下载，避免打开新标签页
      // 前提是后端返回 Content-Disposition: attachment
      window.location.href = `${API_BASE_URL}/download/${runId}`;
  };

  const getPlatformIcon = (platform: string) => {
      const p = platform.toLowerCase();
      if (p.includes('android')) return <span className="text-lg" title="Android">🤖</span>;
      if (p.includes('windows')) return <span className="text-lg" title="Windows">🪟</span>;
      if (p.includes('ios')) return <span className="text-lg" title="iOS">🍎</span>;
      if (p.includes('web')) return <span className="text-lg" title="Web">🌐</span>;
      return <Icons.Box size={18} className="text-slate-400" />; 
  };

  const getStatusBadge = (status: string, conclusion: string | null) => {
      // 处理中
      if (status === 'queued' || status === 'waiting' || status === 'in_progress') {
          const isRunning = status === 'in_progress';
          return (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  isRunning 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                  {isRunning ? <Icons.Loader2 size={12} className="animate-spin" /> : <Icons.Clock size={12} />}
                  <span>{isRunning ? '构建中' : '排队中'}</span>
              </div>
          );
      }

      // 已完成
      if (status === 'completed') {
          if (conclusion === 'success') {
              return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icons.CheckCircle size={12} />
                      <span>成功</span>
                  </div>
              );
          }
          if (['failure', 'timed_out', 'cancelled'].includes(conclusion || '')) {
              return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      <Icons.XCircle size={12} />
                      <span>{conclusion === 'cancelled' ? '已取消' : '失败'}</span>
                  </div>
              );
          }
      }
      
      return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
              <span>{status}</span>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/95 flex justify-between items-center sticky top-0 z-10">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
                    <Icons.Package size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">构建历史中心</h2>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        已连接至本地服务: {API_BASE_URL}
                    </p>
                </div>
             </div>
             <div className="flex gap-3">
                <button 
                    onClick={fetchBuilds} 
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all text-xs font-medium border border-transparent hover:border-slate-700"
                >
                    <Icons.RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    刷新列表
                </button>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Icons.X size={20} />
                </button>
             </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto bg-slate-950/50 p-6 custom-scrollbar">
            {loading && builds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Icons.Loader2 size={40} className="animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">正在同步 GitHub 构建数据...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8 bg-red-900/5 border border-red-900/20 rounded-xl">
                    <div className="p-4 bg-red-500/10 rounded-full text-red-500 ring-4 ring-red-500/5">
                        <Icons.XCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-white font-medium mb-1">获取数据失败</h3>
                        <p className="text-sm text-red-300/70 max-w-md mx-auto mb-6">{error}</p>
                        <button 
                            onClick={fetchBuilds}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition-all"
                        >
                            重试连接
                        </button>
                    </div>
                </div>
            ) : builds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                        <Icons.Box size={32} className="opacity-20" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-400 mb-2">暂无构建记录</h3>
                    <p className="text-xs text-slate-600">触发构建后，记录将显示在这里。</p>
                </div>
            ) : (
                <div className="min-w-[800px]">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30 rounded-t-lg">
                        <div className="col-span-4 pl-2">构建任务 / 平台</div>
                        <div className="col-span-2">状态</div>
                        <div className="col-span-3">触发时间 / 耗时</div>
                        <div className="col-span-2">执行人</div>
                        <div className="col-span-1 text-right pr-2">操作</div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1 mt-1">
                        {builds.map((build) => (
                            <div key={build.id} className="grid grid-cols-12 gap-4 items-center bg-slate-900 hover:bg-slate-800 border border-slate-800/50 hover:border-slate-700 p-4 rounded-lg transition-all group">
                                
                                {/* Task Info */}
                                <div className="col-span-4 flex items-center gap-4 pl-2">
                                    <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-slate-600 transition-colors">
                                        {getPlatformIcon(build.platform)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-200 truncate" title={`Run ID: ${build.id}`}>
                                                #{build.id}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono border border-slate-700">
                                                {build.platform}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate" title={build.buildId}>
                                            Task: <span className="font-mono text-slate-400">{build.buildId.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                    {getStatusBadge(build.status, build.conclusion)}
                                </div>

                                {/* Time */}
                                <div className="col-span-3 flex flex-col gap-1">
                                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                                        <Icons.Clock size={12} className="text-slate-500" /> 
                                        {formatDate(build.createdAt)}
                                    </span>
                                    <span className="text-[10px] text-slate-500 pl-4">
                                        {getRelativeTime(build.createdAt)} • 耗时 {build.duration}
                                    </span>
                                </div>

                                {/* Actor */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] text-indigo-300 border border-indigo-500/20">
                                        {build.actor.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-slate-400 truncate">{build.actor}</span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end gap-2 pr-2">
                                    {build.status === 'completed' && build.conclusion === 'success' ? (
                                        <button 
                                            onClick={() => handleDownload(build.id)}
                                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg shadow-emerald-900/20 hover:scale-105 group/btn relative"
                                            title="下载构建产物"
                                        >
                                            <Icons.Download size={16} />
                                            <span className="absolute -top-8 right-0 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                下载 Artifact
                                            </span>
                                        </button>
                                    ) : (
                                        <a 
                                            href={build.runUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                                            title="查看 GitHub 日志"
                                        >
                                            <Icons.ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-center flex justify-between items-center px-6">
            <span className="text-[10px] text-slate-600">
                数据来源: GitHub Actions API
            </span>
            <a href="https://github.com/hualingluo/flutterPack/actions" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                前往 GitHub 管理 Workflow <Icons.ExternalLink size={10} />
            </a>
        </div>
      </div>
    </div>
  );
};
