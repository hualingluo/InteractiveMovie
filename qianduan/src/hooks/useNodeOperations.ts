import { useCallback } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useEditorStore } from '../stores/useEditorStore';
import { StoryNode, NodeType } from '../types';

export const useNodeOperations = () => {
  const { nodes, addNode, updateNode } = useProjectStore();
  const { viewport, setIsNewProjectOpen, setSelectedNodeId } = useEditorStore();

  const handleAddNode = useCallback(
    (type: NodeType = 'scene') => {
      const id = `node_${Date.now()}`;
      const newNode: StoryNode = {
        id,
        title: '新剧情镜头',
        type,
        content: '使用 AI 润色或直接输入剧本...',
        mediaType: 'none',
        mediaSrc: '',
        audioSrc: '',
        x: -viewport.x + 400,
        y: -viewport.y + 200,
        options: []
      };

      addNode(newNode);
      setSelectedNodeId(id);
    },
    [viewport, addNode, setSelectedNodeId]
  );

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<StoryNode>) => {
      updateNode(id, updates);
    },
    [updateNode]
  );

  const handleDragStart = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

  const handleNodeDrag = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      updateNode(nodeId, {
        x: nodes[nodeId].x + e.movementX / viewport.zoom,
        y: nodes[nodeId].y + e.movementY / viewport.zoom
      });
    },
    [nodes, viewport.zoom, updateNode]
  );

  return {
    handleAddNode,
    handleUpdateNode,
    handleDragStart,
    handleNodeDrag
  };
};
