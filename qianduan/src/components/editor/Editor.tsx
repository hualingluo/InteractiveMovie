import React, { useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ProjectData, UserRole } from '../../../types';
import { EditorToolbar } from './toolbar/EditorToolbar';
import { StoryCanvas } from './canvas/StoryCanvas';
import { StorySidebar } from '../../../components/StorySidebar';
import { PropertyPanel } from '../../../components/PropertyPanel';
import { PreviewPlayer } from '../../../components/PreviewPlayer';
import { LayoutEditorModal } from '../../../components/LayoutEditorModal';
import { CharacterManager } from '../../../components/CharacterManager';
import { NewProjectModal } from '../../../components/NewProjectModal';
import { useProjectPersistence } from '../../hooks/useProjectPersistence';
import { useNodeOperations } from '../../hooks/useNodeOperations';
import { buildWindowsExe, uploadBuildScript } from '../../../services/scriptApiService';

interface EditorProps {
  onBack: () => void;
  autoOpenNewProject?: boolean;
  initialData?: ProjectData;
  userRole: UserRole;
}

export const Editor: React.FC<EditorProps> = ({
  onBack,
  autoOpenNewProject,
  initialData,
  userRole
}) => {
  const { metadata, nodes, characters, projectPath, setFolderHandle, loadProject, setProjectPath } =
    useProjectStore();
  const {
    viewport,
    isPreviewOpen,
    layoutNodeId,
    isCharManagerOpen,
    isNewProjectOpen,
    setIsPublishing,
    setIsBuildingExe,
    setIsPreviewOpen,
    setLayoutNodeId,
    setIsCharManagerOpen,
    setIsNewProjectOpen
  } = useEditorStore();

  // 使用自定义 hooks
  const { handleExportJSON, handleSaveToBackend, handlePublish, uploadResourcesBeforeBuild, setProjectPath: setProjectPathFromHook } =
    useProjectPersistence();
  const { handleUpdateNode } = useNodeOperations();

  // 初始化项目数据
  useEffect(() => {
    if (initialData) {
      loadProject(initialData);
    }
  }, [initialData, loadProject]);

  // 初始化新建项目弹窗
  useEffect(() => {
    if (autoOpenNewProject && !initialData) {
      setIsNewProjectOpen(true);
    }
  }, [autoOpenNewProject, initialData, setIsNewProjectOpen]);

  // 预览起始节点
  const previewStartId = useMemo(() => {
    if (nodes['start']) return 'start';
    const keys = Object.keys(nodes);
    return keys.length > 0 ? keys[0] : null;
  }, [nodes]);

  // 处理发布
  const handlePublishWrapper = useCallback(async () => {
    setIsPublishing(true);
    try {
      await handlePublish();
    } finally {
      setIsPublishing(false);
    }
  }, [handlePublish, setIsPublishing]);

  // 处理打包 EXE
  const handleBuildExe = useCallback(async () => {
    try {
      // 1. 先上传剧本文件到 backend/resources/scripts/script.json
      console.log('📝 正在上传剧本文件到服务器...');
      const scriptData = {
        metadata,
        nodes,
        characters,
        viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
      };

      const uploadResult = await uploadBuildScript(scriptData);
      if (!uploadResult.success) {
        alert(`❌ 上传剧本文件失败: ${uploadResult.error}`);
        return;
      }
      console.log('✅ 剧本文件上传成功');

      // 2. 上传资源文件（视频、图片）
      console.log('📦 正在上传资源文件到服务器...');
      await uploadResourcesBeforeBuild();
      console.log('✅ 资源文件上传完成');

      // 3. 启动打包流程（不使用 projectPath，直接使用 resources/scripts/script.json）
      setIsBuildingExe(true);
      const result = await buildWindowsExe('');  // 空字符串表示使用 resources/scripts/script.json

      if (result.success) {
        alert(
          '✅ 打包任务已启动！请在后端控制台查看进度。\n\n打包完成后，EXE 文件将位于 Flutter 项目的 build/windows/x64/runner/Release 目录。'
        );
      } else {
        alert(`❌ 启动打包失败: ${result.message || result.error}`);
      }
    } catch (error: any) {
      console.error('打包失败:', error);
      alert(`❌ 打包失败: ${error.message}`);
    } finally {
      setIsBuildingExe(false);
    }
  }, [
    metadata,
    nodes,
    characters,
    viewport,
    uploadResourcesBeforeBuild,
    setIsBuildingExe
  ]);

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* 工具栏 */}
      <EditorToolbar
        onBack={onBack}
        onExportJSON={handleExportJSON}
        onSaveToBackend={handleSaveToBackend}
        onPublish={handlePublishWrapper}
        onBuildExe={handleBuildExe}
        userRole={userRole}
      />

      {/* 主内容区域 */}
      <div className="flex w-full h-full pt-20">
        {/* 侧边栏 */}
        <StorySidebar
          nodes={nodes}
          characters={characters}
          selectedId={useEditorStore.getState().selectedNodeId}
          onSelect={useEditorStore.getState().setSelectedNodeId}
          onAddCharacter={() => setIsCharManagerOpen(true)}
          onUpdateNodes={useProjectStore.getState().setNodes}
        />

        {/* 画布 */}
        <StoryCanvas />

        {/* 属性面板 */}
        {useEditorStore.getState().selectedNodeId &&
          nodes[useEditorStore.getState().selectedNodeId!] && (
            <PropertyPanel
              node={nodes[useEditorStore.getState().selectedNodeId!]}
              allNodes={nodes}
              folderHandle={useProjectStore.getState().folderHandle}
              onUpdate={handleUpdateNode}
              onEditLayout={setLayoutNodeId}
              onClose={() => useEditorStore.getState().setSelectedNodeId(null)}
              stylePrompt="Cinematic high contrast"
              userRole={userRole}
            />
          )}
      </div>

      {/* 弹窗 */}
      {isPreviewOpen && previewStartId && (
        <PreviewPlayer
          nodes={nodes}
          startId={previewStartId}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {layoutNodeId && nodes[layoutNodeId] && (
        <LayoutEditorModal
          node={nodes[layoutNodeId]}
          onSave={(id, lay) => {
            useProjectStore.getState().updateNode(id, { layout: lay });
            setLayoutNodeId(null);
          }}
          onClose={() => setLayoutNodeId(null)}
        />
      )}

      {isCharManagerOpen && (
        <CharacterManager
          onSave={(c) =>
            useProjectStore.getState().addCharacter(c)
          }
          onClose={() => setIsCharManagerOpen(false)}
        />
      )}

      {isNewProjectOpen && (
        <NewProjectModal
          onConfirm={(n, path, fh) => {
            useProjectStore.getState().setNodes(n);
            setProjectPath(path);
            setFolderHandle(fh);
          }}
          onClose={() => setIsNewProjectOpen(false)}
        />
      )}
    </div>
  );
};
