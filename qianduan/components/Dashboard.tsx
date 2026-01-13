
import React, { useState, useMemo } from 'react';
import * as Icons from './Icons';
import { ProjectMetadata, UserRole } from '../types';

interface DashboardProps {
  onCreateProject: () => void;
  onOpenProject: (project: ProjectMetadata) => void;
  userProjects: ProjectMetadata[];
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const MOCK_PLAZA: ProjectMetadata[] = [
  {
    id: 'p1',
    name: '霓虹边缘：觉醒',
    author: 'AIGC_Master',
    coverUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800',
    description: '在赛博朋克的废墟中寻找最后的真相。',
    likes: 1240,
    views: 8900,
    remixCount: 45,
    status: 'published',
    styleMode: 'late_shift',
    interactivity: 'classic',
    layout: 'cinematic',
    createdAt: '2024-03-20'
  },
  {
    id: 'p2',
    name: '心动告白：落樱时节',
    author: 'Sakura_Love',
    coverUrl: 'https://images.unsplash.com/photo-1524114664604-cd813336829e?auto=format&fit=crop&q=80&w=800',
    description: '中式现代恋爱互动，每一个选择都牵动心弦。',
    likes: 3500,
    views: 24000,
    remixCount: 120,
    status: 'published',
    styleMode: 'meibao',
    interactivity: 'emotion',
    layout: 'vertical',
    createdAt: '2024-03-18'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onCreateProject, onOpenProject, userProjects, userRole, onRoleChange }) => {
  const [activeTab, setActiveTab] = useState<'mine' | 'plaza' | 'assets'>('plaza');

  const allProjects = useMemo(() => {
      const users = userProjects.map(p => ({ ...p, isUser: true }));
      return [...users, ...MOCK_PLAZA];
  }, [userProjects]);

  const mineProjects = useMemo(() => {
      return userProjects;
  }, [userProjects]);

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="h-24 flex items-center gap-4 px-10 border-b border-white/5">
           <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
               <Icons.Film className="text-white w-5 h-5" />
           </div>
           <span className="font-black text-2xl tracking-tighter text-white uppercase italic">DOUJU</span>
        </div>
        
        <div className="flex-1 py-10 px-6 space-y-2">
            <button 
                onClick={() => setActiveTab('plaza')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'plaza' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
                <Icons.Globe size={20} /> 创作广场 (Plaza)
            </button>
            <button 
                onClick={() => setActiveTab('mine')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'mine' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
                <Icons.LayoutDashboard size={20} /> 我的制片厂
            </button>
            <button 
                onClick={() => setActiveTab('assets')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'assets' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
                <Icons.User size={20} /> 资产中心
            </button>
        </div>

        {/* Identity Selector Section */}
        <div className="p-6 border-t border-white/5 space-y-4">
            <div className="bg-slate-950/80 p-2 rounded-2xl border border-white/5 flex">
                <button 
                    onClick={() => onRoleChange('creator')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${userRole === 'creator' ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Icons.User size={12} /> 创作者
                </button>
                <button 
                    onClick={() => onRoleChange('admin')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${userRole === 'admin' ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-white shadow-lg shadow-amber-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Icons.Zap size={12} /> 超级管理员
                </button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${userRole === 'admin' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                    {userRole === 'admin' ? <Icons.Zap size={20} /> : <Icons.User size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-white truncate">{userRole === 'admin' ? '超级管理员' : '游客创作者'}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {userRole === 'admin' ? 'Admin Access' : 'AIGC Level 1'}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-[#020617] overflow-hidden relative">
          <div className={`absolute top-0 left-0 right-0 h-1 z-50 transition-all ${userRole === 'admin' ? 'bg-amber-500 opacity-100' : 'opacity-0'}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(6,182,212,0.1),_transparent)] pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'plaza' && (
                  <section className="animate-in fade-in duration-700">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Discovery <span className="text-cyan-500">Plaza</span></h1>
                            <p className="text-slate-400 font-medium">探索全球创作者利用 AIGC 技术构建的互动电影世界。</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {allProjects.map((project: any) => (
                            <div key={project.id} className="group relative bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden hover:border-cyan-500/40 transition-all duration-500 shadow-2xl">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img src={project.coverUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent" />
                                    
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                                            {project.styleMode === 'late_shift' ? '硬核悬疑' : project.styleMode === 'meibao' ? '甜蜜恋爱' : '史诗古风'}
                                        </div>
                                        {project.isUser && (
                                            <div className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest">
                                                我的作品
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={() => onOpenProject(project)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-950 shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                                            <Icons.Play size={32} fill="currentColor" className="ml-1" />
                                        </div>
                                        <div className="absolute bottom-6 font-black text-white text-xs uppercase tracking-[0.2em]">点击进入编辑/播放</div>
                                    </button>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-xl font-black text-white mb-2">{project.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                            {project.author[0]}
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">@{project.author}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6">{project.description}</p>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Icons.Heart size={14} /> <span className="text-xs font-bold">{project.likes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Icons.Play size={14} /> <span className="text-xs font-bold">{project.views}</span>
                                            </div>
                                        </div>
                                        <button className="flex items-center gap-2 text-xs font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest">
                                            <Icons.Share2 size={14} /> Remix
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </section>
                )}

                {activeTab === 'mine' && (
                  <section className="animate-in slide-in-from-bottom-8 duration-700">
                     <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">My <span className="text-indigo-500">Studio</span></h1>
                            <p className="text-slate-400 font-medium">管理您的互动剧本。使用 AIGC 工具加速创作流程。</p>
                        </div>
                        <button onClick={onCreateProject} className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-black hover:scale-105 transition-all shadow-2xl shadow-indigo-900/40 flex items-center gap-3">
                            <Icons.Plus size={24} /> 开启新剧本
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         <div 
                            onClick={onCreateProject}
                            className="aspect-[4/5] bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-6 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group"
                         >
                            <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-all">
                                <Icons.Plus size={32} />
                            </div>
                            <span className="font-black text-sm uppercase tracking-widest">新建 AIGC 项目</span>
                         </div>
                         
                         {mineProjects.map(project => (
                             <div key={project.id} onClick={() => onOpenProject(project)} className="aspect-[4/5] bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden group cursor-pointer relative shadow-2xl">
                                 <img src={project.coverUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
                                 <div className="absolute bottom-6 left-6 right-6">
                                     <h3 className="text-lg font-black text-white mb-1">{project.name}</h3>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{project.createdAt}</p>
                                 </div>
                             </div>
                         ))}
                    </div>
                  </section>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};
