"use client";

import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { MoodTileCard } from "./MoodTileCard";
import { ImageSource, MoodTile } from "@/lib/types";

const COLUMN_COUNT = 4;

function distribute(tiles: MoodTile[], columnCount: number): MoodTile[][] {
  const columns: MoodTile[][] = Array.from({ length: columnCount }, () => []);
  tiles.forEach((tile, i) => columns[i % columnCount].push(tile));
  return columns;
}

interface MoodBoardGridProps {
  tiles: MoodTile[];
}

// Keyed by boardKey from the parent so a new board fully remounts this
// component (fresh column state) instead of reconciling in place.
export function MoodBoardGrid({ tiles }: MoodBoardGridProps) {
  const [columns, setColumns] = useState<MoodTile[][]>(() => distribute(tiles, COLUMN_COUNT));
  const [regenPos, setRegenPos] = useState<{ col: number; row: number } | null>(null);

  const handleRegenerate = async (colIndex: number, rowIndex: number, source: ImageSource) => {
    const currentTile = columns[colIndex][rowIndex];
    if (!currentTile) return;

    setRegenPos({ col: colIndex, row: rowIndex });
    try {
      const res = await fetch("/api/regenerate-tile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, query: currentTile.query }),
      });
      if (res.ok) {
        const { tile } = await res.json();
        setColumns((prev) => {
          const next = prev.map((col) => [...col]);
          next[colIndex][rowIndex] = tile;
          return next;
        });
      } else {
        const { error } = await res.json().catch(() => ({ error: "Regeneration failed." }));
        console.warn(error);
      }
    } finally {
      setRegenPos(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    setColumns((prev) => {
      const next = prev.map((col) => [...col]);
      const sourceCol = Number(source.droppableId.replace("col-", ""));
      const destCol = Number(destination.droppableId.replace("col-", ""));
      const [moved] = next[sourceCol].splice(source.index, 1);
      next[destCol].splice(destination.index, 0, moved);
      return next;
    });
  };

  if (tiles.length === 0) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        id="mood-board-export"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto p-4 rounded-2xl"
      >
        {columns.map((col, colIndex) => (
          <Droppable droppableId={`col-${colIndex}`} key={colIndex}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col">
                {col.map((tile, rowIndex) => (
                  <MoodTileCard
                    key={tile.id}
                    tile={tile}
                    index={rowIndex}
                    regenerating={regenPos?.col === colIndex && regenPos?.row === rowIndex}
                    onRegenerate={(source) => handleRegenerate(colIndex, rowIndex, source)}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
