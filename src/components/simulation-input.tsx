"use client";

import { motion } from "framer-motion";
import { AlertCircle, UploadCloud } from "lucide-react";
import { ParseIssue } from "@/lib/types";

interface SimulationInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  issues: ParseIssue[];
  isLoading?: boolean;
}

export function SimulationInput({
  value,
  onChange,
  onApply,
  issues,
  isLoading = false,
}: SimulationInputProps) {
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const hasErrors = errorCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl"
    >
      <div className="mb-2">
        <h3 className="text-sm font-bold text-white mb-1">Simulation Input</h3>
        <p className="text-xs text-slate-400 mb-2">
          Format:{" "}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 text-xs">
            D[num]-[zone]
          </code>{" "}
          or{" "}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 text-xs">
            D[num]-[from]-[to]
          </code>
        </p>
      </div>

      <div className="space-y-1 mb-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="D1-junction D2-start-junction\nD1-junction-goal D2-junction"
          className="w-full h-20 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-500 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
      </div>

      {issues.length > 0 && (
        <div className="mb-2 space-y-1">
          {issues.map((issue, index) => (
            <motion.div
              key={`${issue.lineNumber}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                issue.severity === "error"
                  ? "bg-red-900/30 border border-red-700/50 text-red-300"
                  : "bg-yellow-900/30 border border-yellow-700/50 text-yellow-300"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">
                  {issue.severity === "error" ? "Error" : "Warning"}
                </span>
                {issue.lineNumber > 0 && (
                  <span className="opacity-75"> (Line {issue.lineNumber})</span>
                )}
                <p className="mt-0.5">{issue.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-700">
          <div className="text-xs text-slate-400 mb-0.5">Lines</div>
          <div className="text-lg font-bold text-white">
            {value.split("\n").filter((line) => line.trim()).length}
          </div>
        </div>
        <div className="bg-red-900/30 rounded-lg p-2 text-center border border-red-700/50">
          <div className="text-xs text-red-300 mb-0.5">Errors</div>
          <div className="text-lg font-bold text-red-400">{errorCount}</div>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-2 text-center border border-yellow-700/50">
          <div className="text-xs text-yellow-300 mb-0.5">Warnings</div>
          <div className="text-lg font-bold text-yellow-400">
            {warningCount}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: hasErrors ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onApply}
        disabled={hasErrors || isLoading}
        className={`w-full py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
          hasErrors || isLoading
            ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
        }`}
      >
        <UploadCloud className="w-4 h-4" />
        {isLoading ? "Applying..." : "Apply"}
      </motion.button>
    </motion.div>
  );
}
