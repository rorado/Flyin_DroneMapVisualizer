"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { ParsedConnection, ParsedNode } from "@/lib/types";
import {
  getNodeAccent,
  getNodeDomId,
  getNodeGradient,
  getNodeRadius,
  SvgViewBox,
} from "@/components/map-visualizer-utils";

export type MapCanvasProps = {
  nodes: ParsedNode[];
  connections: ParsedConnection[];
  viewBox: SvgViewBox;
  nodeByName: Map<string, ParsedNode>;
  hoveredNode: string | null;
  hoveredConnection: string | null;
  connectedNodeNames: Set<string> | null;
  pathNodeNames: Set<string> | null;
  pathConnectionIds: Set<string> | null;
  isPanning: boolean;
  onNodeHover: (name: string) => void;
  onNodeLeave: () => void;
  onConnectionHover: (id: string) => void;
  onConnectionLeave: () => void;
  onMapWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onMapPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onMapPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onMapPointerEnd: (event: React.PointerEvent<SVGSVGElement>) => void;
};

export const MapCanvas = forwardRef<SVGSVGElement, MapCanvasProps>(
  function MapCanvas(
    {
      nodes,
      connections,
      viewBox,
      nodeByName,
      hoveredNode,
      hoveredConnection,
      connectedNodeNames,
      pathNodeNames,
      pathConnectionIds,
      isPanning,
      onNodeHover,
      onNodeLeave,
      onConnectionHover,
      onConnectionLeave,
      onMapWheel,
      onMapPointerDown,
      onMapPointerMove,
      onMapPointerEnd,
    },
    ref,
  ) {
    const xStep = Math.max(viewBox.width / 4, 1);
    const yStep = Math.max(viewBox.height / 4, 1);
    const xMarks = [0, 1, 2, 3, 4].map((index) => viewBox.minX + index * xStep);
    const yMarks = [0, 1, 2, 3, 4].map((index) => viewBox.minY + index * yStep);

    return (
      <motion.svg
        ref={ref}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        className={`h-full w-full touch-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        role="img"
        aria-label="Drone map visualization"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onWheel={onMapWheel}
        onPointerDown={onMapPointerDown}
        onPointerMove={onMapPointerMove}
        onPointerUp={onMapPointerEnd}
        onPointerCancel={onMapPointerEnd}
        onPointerLeave={onMapPointerEnd}
      >
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path
              d="M 1 0 L 0 0 0 1"
              fill="none"
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="0.03"
            />
          </pattern>

          <linearGradient
            id="backgroundGlow"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(14,165,233,0.15)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.04)" />
          </linearGradient>

          {nodes.map((node) => {
            const [start, end] = getNodeGradient(node);
            const nodeDomId = getNodeDomId(node);
            return (
              <linearGradient
                key={`${nodeDomId}-gradient`}
                id={`node-gradient-${nodeDomId}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={start} />
                <stop offset="100%" stopColor={end} />
              </linearGradient>
            );
          })}

          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="0.35"
              floodColor="rgba(56,189,248,0.45)"
            />
          </filter>
        </defs>

        <rect
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
          fill="#020617"
        />
        <rect
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#backgroundGlow)"
          opacity="0.8"
        />
        <rect
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#grid)"
          opacity="0.8"
        />

        {xMarks.map((tick, index) => (
          <g key={`x-${index}`} opacity="0.45">
            <line
              x1={tick}
              y1={viewBox.minY}
              x2={tick}
              y2={viewBox.minY + viewBox.height}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="0.04"
            />
            <text
              x={tick}
              y={viewBox.minY + 0.55}
              fill="rgba(226,232,240,0.55)"
              fontSize="0.42"
              textAnchor="middle"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {yMarks.map((tick, index) => (
          <g key={`y-${index}`} opacity="0.45">
            <line
              x1={viewBox.minX}
              y1={tick}
              x2={viewBox.minX + viewBox.width}
              y2={tick}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="0.04"
            />
            <text
              x={viewBox.minX + 0.4}
              y={tick + 0.14}
              fill="rgba(226,232,240,0.55)"
              fontSize="0.42"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {connections.map((connection) => {
            const from = nodeByName.get(connection.from);
            const to = nodeByName.get(connection.to);

            if (!from || !to) {
              return null;
            }

            const isPathConnection = pathConnectionIds
              ? pathConnectionIds.has(connection.id)
              : false;
            const isHovered = hoveredConnection === connection.id;
            const isRelated =
              hoveredConnection === connection.id ||
              hoveredNode === connection.from ||
              hoveredNode === connection.to ||
              isPathConnection ||
              (connectedNodeNames
                ? connectedNodeNames.has(connection.from) &&
                  connectedNodeNames.has(connection.to)
                : true);

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const lineWidth =
              connection.maxLinkCapacity && connection.maxLinkCapacity > 1
                ? 0.13
                : 0.07;

            return (
              <g key={connection.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    isHovered
                      ? "#f8fafc"
                      : isPathConnection
                        ? "#10b981"
                        : "rgba(148,163,184,0.8)"
                  }
                  strokeWidth={
                    isHovered || isPathConnection ? lineWidth * 1.8 : lineWidth
                  }
                  opacity={isRelated ? 1 : 0.18}
                  strokeLinecap="round"
                  filter={isHovered ? "url(#softGlow)" : undefined}
                  onMouseEnter={() => onConnectionHover(connection.id)}
                  onMouseLeave={onConnectionLeave}
                  className="transition-all duration-200"
                />

                {connection.maxLinkCapacity &&
                connection.maxLinkCapacity > 1 ? (
                  <motion.g
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: isRelated ? 1 : 0.35 }}
                    className="pointer-events-none"
                  >
                    <rect
                      x={midX - 0.24}
                      y={midY - 0.18}
                      width={0.48}
                      height={0.36}
                      rx={0.12}
                      fill="#0f172a"
                      opacity="0.95"
                    />
                    <rect
                      x={midX - 0.24}
                      y={midY - 0.18}
                      width={0.48}
                      height={0.36}
                      rx={0.12}
                      fill="none"
                      stroke="rgba(251,191,36,0.65)"
                      strokeWidth="0.03"
                    />
                    <text
                      x={midX}
                      y={midY + 0.03}
                      textAnchor="middle"
                      fill="#fde68a"
                      fontSize="0.2"
                      fontWeight={700}
                    >
                      {connection.maxLinkCapacity}
                    </text>
                  </motion.g>
                ) : null}
              </g>
            );
          })}
        </motion.g>

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {nodes.map((node) => {
            const accent = getNodeAccent(node);
            const related = connectedNodeNames
              ? connectedNodeNames.has(node.name)
              : true;
            const isActive =
              hoveredNode === node.name || hoveredConnection ? related : true;
            const isPathNode = pathNodeNames
              ? pathNodeNames.has(node.name)
              : false;
            const radius = getNodeRadius(node);
            const baseGlow =
              node.role === "goal" ? "url(#softGlow)" : undefined;
            const nodeDomId = getNodeDomId(node);

            return (
              <motion.g
                key={nodeDomId}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: isActive ? 1 : 0.4, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => onNodeHover(node.name)}
                onMouseLeave={onNodeLeave}
                className="cursor-pointer"
              >
                {isPathNode && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 0.35}
                    fill="none"
                    stroke="#6ee7b7"
                    strokeWidth="0.08"
                    opacity="0.8"
                  />
                )}

                {node.role === "start" ? (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={radius * 1.5}
                    fill={`url(#node-gradient-${nodeDomId})`}
                    opacity={0.15}
                    className="animate-pulse-soft"
                  />
                ) : null}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={`url(#node-gradient-${nodeDomId})`}
                  stroke={accent}
                  strokeWidth={node.zone === "restricted" ? 0.09 : 0.06}
                  strokeDasharray={
                    node.zone === "restricted" ? "0.12 0.12" : undefined
                  }
                  filter={baseGlow}
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius * 0.62}
                  fill="rgba(15,23,42,0.26)"
                />

                {node.role === "goal" ? (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius * 1.35}
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="0.04"
                    opacity="0.8"
                  />
                ) : null}

                {node.zone === "blocked" ? (
                  <g opacity="0.8">
                    <line
                      x1={node.x - radius * 0.45}
                      y1={node.y - radius * 0.45}
                      x2={node.x + radius * 0.45}
                      y2={node.y + radius * 0.45}
                      stroke="#e2e8f0"
                      strokeWidth="0.08"
                    />
                    <line
                      x1={node.x - radius * 0.45}
                      y1={node.y + radius * 0.45}
                      x2={node.x + radius * 0.45}
                      y2={node.y - radius * 0.45}
                      stroke="#e2e8f0"
                      strokeWidth="0.08"
                    />
                  </g>
                ) : null}

                {node.zone === "priority" ? (
                  <g>
                    <text
                      x={node.x + radius * 0.56}
                      y={node.y - radius * 0.8}
                      textAnchor="middle"
                      fill="#f5f3ff"
                      fontSize="0.28"
                    >
                      ★
                    </text>
                  </g>
                ) : null}

                <g pointerEvents="none" textAnchor="middle">
                  <text
                    x={node.x}
                    y={node.y - radius - 0.25}
                    fill="#f8fafc"
                    fontSize="0.22"
                    fontWeight={700}
                  >
                    {node.role === "start"
                      ? "START"
                      : node.role === "goal"
                        ? "GOAL"
                        : "HUB"}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + radius + 0.28}
                    fill="#f8fafc"
                    fontSize="0.18"
                    fontWeight={700}
                  >
                    {node.name}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + radius + 0.53}
                    fill="rgba(226,232,240,0.8)"
                    fontSize="0.15"
                  >
                    ({node.x}, {node.y}) · {node.zone}
                  </text>
                  {node.maxDrones && node.maxDrones > 1 ? (
                    <text
                      x={node.x}
                      y={node.y + radius + 0.74}
                      fill="#a7f3d0"
                      fontSize="0.15"
                      fontWeight={600}
                    >
                      max drones {node.maxDrones}
                    </text>
                  ) : null}
                </g>
              </motion.g>
            );
          })}
        </motion.g>
      </motion.svg>
    );
  },
);
