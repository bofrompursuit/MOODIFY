"use client";

import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { MoodTileCard } from "./MoodTileCard";
import { ImageSource, MoodTile } from "@/lib/types";

const COLUMN_COUNT = 6;

function distribute(tiles: MoodTile[], columnCount: number): MoodTile[][] {
  const columns: MoodTile[][] = Array.from({ length: columnCount }, () => []);
  tiles.forEach((tile, i) => columns[i % columnCount].push(tile));
  return columns;
}

// A few different vertical offsets, cycled per column, so the board reads
// as scattered rather than a neat grid of even columns.
const COLUMN_OFFSETS = ["0rem", "2.5rem", "1rem", "3rem", "0.5rem", "2rem"];

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
        className="corkboard grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full max-w-[100rem] mx-auto p-8 md:p-12"
      >
        {columns.map((col, colIndex) => (
          <Droppable droppableId={`col-${colIndex}`} key={colIndex}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col"
                style={{ marginTop: COLUMN_OFFSETS[colIndex % COLUMN_OFFSETS.length] }}
              >
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
