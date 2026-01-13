import { useCallback, useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore';

interface UseCanvasOperationsResult {
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

export const useCanvasOperations = (): UseCanvasOperationsResult => {
  const {
    viewport,
    isDraggingCanvas,
    dragStart,
    dragNodeId,
    setViewport,
    setIsDraggingCanvas,
    setDragStart,
    setDragNodeId
  } = useEditorStore();

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
    },
    [viewport, setIsDraggingCanvas, setDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingCanvas) {
        setViewport({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    },
    [isDraggingCanvas, dragStart, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    setDragNodeId(null);
  }, [setIsDraggingCanvas, setDragNodeId]);

  // 处理全局鼠标事件（确保拖拽不会因为鼠标移出画布而中断）
  useEffect(() => {
    if (isDraggingCanvas || dragNodeId) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDraggingCanvas) {
          setViewport({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
          });
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDraggingCanvas(false);
        setDragNodeId(null);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDraggingCanvas, dragNodeId, dragStart, setViewport, setIsDraggingCanvas, setDragNodeId]);

  return {
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
