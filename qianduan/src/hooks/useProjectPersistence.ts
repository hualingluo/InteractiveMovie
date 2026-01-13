import { useCallback } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useEditorStore } from '../stores/useEditorStore';
import { ProjectData, ProjectMetadata } from '../types';
import { saveScriptToBackend, uploadResourceFiles } from '../../services/scriptApiService';
import { saveScriptNodes } from '../../services/fileSystemService';

export const useProjectPersistence = () => {
  const { metadata, nodes, characters, folderHandle, projectPath, setProjectPath } =
    useProjectStore();
  const { viewport } = useEditorStore();

  const handleExportJSON = useCallback(() => {
    const exportData: ProjectData = {
      metadata,
      nodes,
      characters,
      viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.name}_script.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [metadata, nodes, characters, viewport]);

  const handleSaveToBackend = useCallback(async () => {
    const projectData: ProjectData = {
      metadata,
      nodes,
      characters,
      viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
    };

    // 先保存到本地文件系统（如果有 folderHandle）
    if (folderHandle) {
      try {
        await saveScriptNodes(folderHandle, nodes);
      } catch (error) {
        console.error('本地保存失败:', error);
      }
    }

    // 再保存到后端（如果有 projectPath）
    if (projectPath) {
      console.log('📝 正在保存剧本到后端，路径:', projectPath);
      const result = await saveScriptToBackend(projectPath, projectData);
      console.log('📝 保存结果:', result);
      if (result.success) {
        // 不显示 alert，让调用方处理
        console.log('✅ 剧本保存成功！路径:', result.path);
      } else {
        alert(`❌ 保存失败: ${result.message || result.error}`);
      }
    } else {
      console.warn('⚠️ projectPath 为空，无法保存到后端');
    }
  }, [metadata, nodes, characters, viewport, folderHandle, projectPath]);

  const handlePublish = useCallback(async () => {
    const finalMetadata: ProjectMetadata = {
      ...metadata,
      name: nodes['start']?.title || metadata.name,
      coverUrl: nodes['start']?.mediaSrc || metadata.coverUrl,
      status: 'published'
    };

    const projectData: ProjectData = {
      metadata: finalMetadata,
      nodes,
      characters,
      viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
    };

    localStorage.setItem(
      `douju_project_data_${metadata.id}`,
      JSON.stringify(projectData)
    );

    const savedList = localStorage.getItem('douju_published_projects');
    let publishedList: ProjectMetadata[] = savedList ? JSON.parse(savedList) : [];
    const existingIndex = publishedList.findIndex((p) => p.id === metadata.id);

    if (existingIndex > -1) {
      publishedList[existingIndex] = finalMetadata;
    } else {
      publishedList.unshift(finalMetadata);
    }

    localStorage.setItem(
      'douju_published_projects',
      JSON.stringify(publishedList)
    );

    await new Promise((r) => setTimeout(r, 1500));
    alert('✨ 发布成功！您的剧本现在已进入创作广场。');

    return finalMetadata;
  }, [metadata, nodes, characters, viewport]);

  // 上传资源文件到后端
  const uploadResourcesBeforeBuild = useCallback(async () => {
    if (!folderHandle) {
      console.log('没有本地文件夹句柄，跳过资源上传');
      return { success: true };
    }

    try {
      // 收集所有需要上传的视频和图片
      const videoFiles: File[] = [];
      const imageFiles: File[] = [];
      const processedPaths = new Set<string>();

      for (const node of Object.values(nodes)) {
        const mediaSrc = node.mediaSrc;
        if (!mediaSrc) continue;

        // 跳过已经处理过的文件
        if (processedPaths.has(mediaSrc)) continue;

        // 处理本地视频和图片
        if (mediaSrc.startsWith('videos/') || mediaSrc.startsWith('images/')) {
          try {
            // 从本地文件夹读取文件
            const pathParts = mediaSrc.split('/');
            const fileName = pathParts.pop() || '';
            const folderName = pathParts.pop() || '';

            const mediaDir = await folderHandle.getDirectoryHandle(folderName);
            const fileHandle = await mediaDir.getFileHandle(fileName);
            const file = await fileHandle.getFile();

            if (mediaSrc.startsWith('videos/')) {
              videoFiles.push(file);
            } else if (mediaSrc.startsWith('images/')) {
              imageFiles.push(file);
            }

            processedPaths.add(mediaSrc);
          } catch (error) {
            console.warn(`无法读取文件 ${mediaSrc}:`, error);
          }
        }
      }

      // 如果有文件需要上传，则上传
      if (videoFiles.length > 0 || imageFiles.length > 0) {
        console.log(
          `📦 准备上传 ${videoFiles.length} 个视频和 ${imageFiles.length} 个图片到服务器...`
        );
        const uploadResult = await uploadResourceFiles(videoFiles, imageFiles);

        if (!uploadResult.success) {
          console.warn('资源文件上传失败:', uploadResult.message);
          // 继续打包流程，不阻塞
        } else {
          console.log('✅ 资源文件上传成功');
        }
      } else {
        console.log('没有需要上传的资源文件');
      }

      return { success: true };
    } catch (error: any) {
      console.warn('上传资源文件时出错:', error);
      return { success: true }; // 不阻塞打包流程
    }
  }, [folderHandle, nodes]);

  return {
    handleExportJSON,
    handleSaveToBackend,
    handlePublish,
    uploadResourcesBeforeBuild,
    setProjectPath
  };
};
