"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { RefreshCw, ExternalLink } from "lucide-react";
import { ImageSource, MoodTile } from "@/lib/types";
import { seededPick, seededRandom } from "@/lib/hash";

const SOURCE_LABEL: Record<ImageSource, string> = {
  unsplash: "Unsplash",
  pexels: "Pexels",
  nimble: "Nimble Discovery",
  baseten: "Baseten AI",
};

const SOURCES: ImageSource[] = ["unsplash", "pexels", "nimble", "baseten"];

const PIN_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e", "#a855f7"];
const TAPE_COLORS = ["#a855f7cc", "#ec4899cc", "#22d3eecc", "#f5d90acc"];

interface MoodTileCardProps {
  tile: MoodTile;
  index: number;
  onRegenerate: (source: ImageSource) => void;
  regenerating: boolean;
}

export function MoodTileCard({ tile, index, onRegenerate, regenerating }: MoodTileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Deterministic per-tile "randomness" so every pin/piece of the board
  // looks scattered rather than gridded, without jittering on re-render.
  const rotation = (seededRandom(tile.id) - 0.5) * 14; // ~ -7deg to 7deg
  const jitterY = (seededRandom(tile.id + "y") - 0.5) * 18; // px
  const pinColor = seededPick(tile.id, PIN_COLORS);
  const tapeColor = seededPick(tile.id, TAPE_COLORS);
  const tapeRotation = (seededRandom(tile.id + "t") - 0.5) * 24;

  return (
    <Draggable draggableId={tile.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-6 break-inside-avoid"
          style={{
            aspectRatio: `${tile.width} / ${tile.height}`,
            marginTop: jitterY,
            ...provided.draggableProps.style,
          }}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, rotate: snapshot.isDragging ? 0 : rotation }}
            transition={{ duration: 0.25 }}
            className={`group relative w-full h-full ${
              snapshot.isDragging ? "z-20 drop-shadow-2xl" : "drop-shadow-lg"
            }`}
          >
            {tile.kind === "clipping" ? (
              <div className="relative w-full h-full bg-[#f3e6bd] paper-lines p-4 pt-7 flex flex-col justify-between shadow-[2px_4px_10px_rgba(0,0,0,0.35)]">
                <span
                  className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 border border-black/5 shadow-sm"
                  style={{ background: tapeColor, transform: `translateX(-50%) rotate(${tapeRotation}deg)` }}
                />
                <div className="flex flex-col gap-2 overflow-hidden">
                  <p className="font-handwritten text-2xl leading-tight text-[#3a2f1a] line-clamp-4">
                    {tile.title}
                  </p>
                  {tile.snippet && (
                    <p className="text-xs text-[#5a4a30]/80 leading-relaxed line-clamp-3">
                      {tile.snippet}
                    </p>
                  )}
                </div>
                {tile.credit && (
                  <span className="text-[10px] uppercase tracking-wide text-[#8a6d3a] truncate">
                    {tile.credit}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full bg-white p-2 pb-6 shadow-[2px_4px_10px_rgba(0,0,0,0.4)]">
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full shadow-md z-10"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, #fff8, transparent 40%), ${pinColor}`,
                  }}
                />
                <div className="w-full h-full overflow-hidden bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.imageUrl}
                    alt={tile.query}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {regenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <RefreshCw className="animate-spin text-white" size={20} />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
              <span className="text-[10px] uppercase tracking-wide text-white/80 drop-shadow">
                {SOURCE_LABEL[tile.source]}
              </span>
              <div className="flex items-center gap-1">
                {tile.sourceUrl && (
                  <a
                    href={tile.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-black/40 hover:bg-black/60"
                    title="View source"
                  >
                    <ExternalLink size={14} className="text-white" />
                  </a>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-1.5 rounded-md bg-black/40 hover:bg-black/60"
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
