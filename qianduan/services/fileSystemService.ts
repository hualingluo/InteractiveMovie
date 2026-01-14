/**
 * 文件系统服务 - 用于处理文件夹选择和文件保存
 * 使用 File System Access API
 */

export interface FolderHandle {
  requestPermission: (mode: 'readwrite' | 'read') => Promise<PermissionState>;
  getDirectoryHandle: (name: string, options: { create: boolean }) => Promise<any>;
  getFileHandle: (name: string, options: { create: boolean }) => Promise<any>;
}

export interface FileSystemHandle {
  createWritable: () => Promise<FileSystemWritableFileStream>;
  getFile: () => Promise<File>;
}

/**
 * 让用户选择一个文件夹用于保存剧本
 * @returns 目录句柄或null
 */
export const selectFolder = async (): Promise<FolderHandle | null> => {
  try {
    // 检查浏览器是否支持 File System Access API
    if (!('showDirectoryPicker' in window)) {
      throw new Error('您的浏览器不支持文件夹选择功能，请使用 Chrome、Edge 或其他基于 Chromium 的浏览器。');
    }

    const directoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });

    // 请求权限
    const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error('未获得文件夹访问权限');
    }

    return directoryHandle;
  } catch (error: any) {
    // 用户取消了选择
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('选择文件夹失败:', error);
    throw error;
  }
};

/**
 * 将剧本数据保存为JSON文件到指定文件夹
 * @param directoryHandle 目录句柄
 * @param filename 文件名
 * @param data 文件数据
 */
export const saveScriptToFile = async (
  directoryHandle: FolderHandle,
  filename: string,
  data: any
): Promise<void> => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await (fileHandle as FileSystemHandle).createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (error) {
    console.error('保存文件失败:', error);
    throw error;
  }
};

/**
 * 保存剧本的所有节点到多个文件
 * @param directoryHandle 目录句柄
 * @param nodes 剧本节点数据
 */
export const saveScriptNodes = async (
  directoryHandle: FolderHandle,
  nodes: Record<string, any>
): Promise<void> => {
  try {
    // 保存完整的剧本数据到 script.json
    await saveScriptToFile(directoryHandle, 'script.json', {
      nodes,
      metadata: {
        createdAt: new Date().toISOString(),
        totalNodes: Object.keys(nodes).length
      }
    });

    // 可选：为每个节点创建单独的文件
    const scenesDir = await directoryHandle.getDirectoryHandle('scenes', { create: true });
    for (const [nodeId, node] of Object.entries(nodes)) {
      await saveScriptToFile(scenesDir, `${nodeId}.json`, node);
    }

    console.log('剧本保存成功');
  } catch (error) {
    console.error('保存剧本节点失败:', error);
    throw error;
  }
};

/**
 * 保存单个节点到 scenes 文件夹
 * @param directoryHandle 目录句柄
 * @param nodeId 节点ID
 * @param nodeData 节点数据
 */
export const saveSingleNode = async (
  directoryHandle: FolderHandle,
  nodeId: string,
  nodeData: any
): Promise<void> => {
  try {
    const scenesDir = await directoryHandle.getDirectoryHandle('scenes', { create: true });
    await saveScriptToFile(scenesDir, `${nodeId}.json`, nodeData);
    console.log(`节点 ${nodeId} 保存成功`);
  } catch (error) {
    console.error(`保存节点 ${nodeId} 失败:`, error);
    throw error;
  }
};

/**
 * 更新完整的剧本数据（包含所有节点）
 * @param directoryHandle 目录句柄
 * @param nodes 所有节点数据
 */
export const updateScriptJson = async (
  directoryHandle: FolderHandle,
  nodes: Record<string, any>
): Promise<void> => {
  try {
    await saveScriptToFile(directoryHandle, 'script.json', {
      nodes,
      metadata: {
        updatedAt: new Date().toISOString(),
        totalNodes: Object.keys(nodes).length
      }
    });
    console.log('script.json 更新成功');
  } catch (error) {
    console.error('更新 script.json 失败:', error);
    throw error;
  }
};

/**
 * 保存媒体文件到本地文件夹
 * @param directoryHandle 目录句柄
 * @param file 文件对象
 * @param nodeId 节点ID
 * @param mediaType 媒体类型 'video' | 'image'
 * @returns 相对路径，用于在 JSON 中引用
 */
export const saveMediaFile = async (
  directoryHandle: FolderHandle,
  file: File,
  nodeId: string,
  mediaType: 'video' | 'image'
): Promise<string> => {
  try {
    // 创建 videos 或 images 文件夹
    const mediaFolderName = mediaType === 'image' ? 'images' : 'videos';
    const mediaDir = await directoryHandle.getDirectoryHandle(mediaFolderName, { create: true });

    // 生成文件名
    const fileExtension = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
    const fileName = `${nodeId}.${fileExtension}`;

    // 获取或创建文件句柄
    const fileHandle = await mediaDir.getFileHandle(fileName, { create: true });
    const writable = await (fileHandle as FileSystemHandle).createWritable();

    // 写入文件内容
    await writable.write(file);
    await writable.close();

    // 返回相对路径
    const relativePath = `${mediaFolderName}/${fileName}`;
    console.log(`${mediaType} 文件保存成功: ${relativePath}`);

    return relativePath;
  } catch (error) {
    console.error(`保存${mediaType}文件失败:`, error);
    throw error;
  }
};

/**
 * 从本地文件夹读取媒体文件
 * @param directoryHandle 目录句柄
 * @param relativePath 相对路径（如 'videos/node_1.mp4'）
 * @returns 文件 URL
 */
export const getMediaFileUrl = async (
  directoryHandle: FolderHandle,
  relativePath: string
): Promise<string> => {
  try {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop() || '';
    const folderName = pathParts.pop() || '';

    const mediaDir = await directoryHandle.getDirectoryHandle(folderName, { create: false });
    const fileHandle = await mediaDir.getFileHandle(fileName, { create: false });
    const file = await (fileHandle as FileSystemHandle).getFile();

    return URL.createObjectURL(file);
  } catch (error) {
    console.error('读取媒体文件失败:', error);
    throw error;
  }
};

/**
 * 删除本地文件夹中的媒体文件
 * @param directoryHandle 目录句柄
 * @param relativePath 相对路径（如 'videos/node_1.mp4'）
 */
export const deleteMediaFile = async (
  directoryHandle: FolderHandle,
  relativePath: string
): Promise<void> => {
  try {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop() || '';
    const folderName = pathParts.pop() || '';

    const mediaDir = await directoryHandle.getDirectoryHandle(folderName, { create: false });
    await mediaDir.removeEntry(fileName);

    console.log(`媒体文件已删除: ${relativePath}`);
  } catch (error) {
    console.error(`删除媒体文件失败 (${relativePath}):`, error);
    throw error;
  }
};

