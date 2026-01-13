
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Editor } from './src/components/editor';
import { ProjectData, ProjectMetadata, UserRole } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [autoOpenNew, setAutoOpenNew] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [publishedProjects, setPublishedProjects] = useState<ProjectMetadata[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('creator');

  // 从本地存储加载所有已发布的项目
  useEffect(() => {
    const saved = localStorage.getItem('douju_published_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPublishedProjects(parsed);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, [view]);

  const handleCreateProject = () => {
      setEditingProject(null);
      setAutoOpenNew(true);
      setView('editor');
  };

  const handleOpenProject = (metadata: ProjectMetadata) => {
      const savedData = localStorage.getItem(`douju_project_data_${metadata.id}`);
      if (savedData) {
          try {
              const projectData: ProjectData = JSON.parse(savedData);
              setEditingProject(projectData);
              setAutoOpenNew(false);
              setView('editor');
          } catch (e) {
              alert("读取剧本数据失败");
          }
      } else {
          setEditingProject(null);
          setAutoOpenNew(false);
          setView('editor');
      }
  };

  const handleExitEditor = () => {
      setEditingProject(null);
      setView('dashboard');
  };

  if (view === 'editor') {
      return (
          <Editor 
            onBack={handleExitEditor} 
            autoOpenNewProject={autoOpenNew}
            initialData={editingProject || undefined}
            userRole={userRole}
          />
      );
  }

  return (
    <Dashboard 
        onCreateProject={handleCreateProject} 
        onOpenProject={handleOpenProject}
        userProjects={publishedProjects}
        userRole={userRole}
        onRoleChange={setUserRole}
    />
  );
};

export default App;
