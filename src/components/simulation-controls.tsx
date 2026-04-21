"use client";

import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface SimulationControlsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentFrame: number;
  maxFrames: number;
  onFrameChange: (frame: number) => void;
  totalDrones: number;
  completedDrones: number;
  hasMap?: boolean;
  hasSimulationIssues?: boolean;
  errorMessage?: string;
}

export function SimulationControls({
  isRunning,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
  currentFrame,
  maxFrames,
  onFrameChange,
  totalDrones,
  completedDrones,
  hasMap = false,
  hasSimulationIssues = false,
  errorMessage = "",
}: SimulationControlsProps) {
  const speedOptions = [0.01, 0.25, 1, 1.5, 2];
  const maxFrameIndex = Math.max(0, maxFrames - 1);
  const progress =
    maxFrameIndex > 0 ? (currentFrame / maxFrameIndex) * 100 : 100;

  const canPlay = hasMap && !hasSimulationIssues && totalDrones > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Drone Simulation</h3>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2 mb-3">
        <motion.button
          whileHover={canPlay ? { scale: 1.1 } : {}}
          whileTap={canPlay ? { scale: 0.95 } : {}}
          onClick={canPlay ? onPlayPause : undefined}
          disabled={!canPlay}
          className={`p-2 rounded-lg transition-all shadow-lg ${
            canPlay
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white cursor-pointer"
              : "bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
          }`}
          title={
            !canPlay ? errorMessage || "Setup map and simulation first" : ""
          }
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        <div className="flex-1 text-right text-xs text-slate-400">
          Frame {currentFrame} / {maxFrameIndex}
        </div>
      </div>

      {/* Error Message */}
      {!canPlay && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 bg-red-900/30 border border-red-700/50 rounded-lg p-2 text-xs text-red-300"
        >
          {!hasMap
            ? "❌ No map loaded. Add a map first."
            : !totalDrones
              ? "❌ No drones detected. Add drone movements."
              : hasSimulationIssues
                ? "❌ Simulation has errors. Fix them to play."
                : errorMessage || "❌ Cannot start simulation"}
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-300">Timeline:</span>
          <span className="text-xs text-amber-400">
            {Math.round(progress)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={maxFrameIndex}
          value={currentFrame}
          onChange={(e) => onFrameChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Speed Control */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-300">Speed:</span>
          <span className="text-xs font-bold text-cyan-400">{speed}x</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {speedOptions.map((option) => (
            <motion.button
              key={option}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSpeedChange(option)}
              className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
                Math.abs(speed - option) < 0.01
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {option}x
            </motion.button>
          ))}
        </div>
      </div>

      {/* Drone Status */}
      <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">End Zone:</span>
          <div className="flex items-center gap-1">
            <div className="text-lg font-bold text-green-400">
              {completedDrones}
            </div>
            <span className="text-xs text-slate-400">/ {totalDrones}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
