"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { RefreshCw, ExternalLink } from "lucide-react";
import { ImageSource, MoodTile } from "@/lib/types";

const SOURCE_LABEL: Record<ImageSource, string> = {
  unsplash: "Unsplash",
  pexels: "Pexels",
  nimble: "Nimble Discovery",
  baseten: "Baseten AI",
};

const SOURCES: ImageSource[] = ["unsplash", "pexels", "nimble", "baseten"];

interface MoodTileCardProps {
  tile: MoodTile;
  index: number;
  onRegenerate: (source: ImageSource) => void;
  regenerating: boolean;
}

export function MoodTileCard({ tile, index, onRegenerate, regenerating }: MoodTileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Draggable draggableId={tile.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4 break-inside-avoid"
          style={{
            aspectRatio: `${tile.width} / ${tile.height}`,
            ...provided.draggableProps.style,
          }}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`group relative w-full h-full rounded-xl overflow-hidden border border-white/10 ${
              snapshot.isDragging ? "ring-2 ring-accent shadow-2xl" : ""
            }`}
          >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tile.imageUrl}
            alt={tile.query}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {regenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <RefreshCw className="animate-spin text-white" size={20} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-[10px] uppercase tracking-wide text-white/70">
              {SOURCE_LABEL[tile.source]}
            </span>
            <div className="flex items-center gap-1">
              {tile.sourceUrl && (
                <a
                  href={tile.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20"
                  title="View source"
                >
                  <ExternalLink size={14} className="text-white" />
                </a>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20"
                  title="Regenerate tile"
                >
                  <RefreshCw size={14} className="text-white" />
                </button>
                {menuOpen && (
                  <div className="absolute bottom-full right-0 mb-1 w-40 rounded-lg bg-[#141118] border border-white/10 shadow-xl overflow-hidden z-10">
                    {SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRegenerate(source);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                      >
                        Swap via {SOURCE_LABEL[source]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}
