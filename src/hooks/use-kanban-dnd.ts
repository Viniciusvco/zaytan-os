import { useState, useCallback, DragEvent } from "react";

export function useKanbanDnD<T extends string>(onMove: (itemId: string, newStatus: T) => void) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<T | null>(null);

  const handleDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, colKey: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent, colKey: T) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onMove(id, colKey);
    setDraggedId(null);
    setDragOverCol(null);
  }, [onMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  return { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd };
}
