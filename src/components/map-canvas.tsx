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
  coordinateScale?: number;
  hoveredNode: string | null;
  hoveredConnection: string | null;
  selectedZone: string | null;
  selectedZoneForDetails: string | null;
  connectedNodeNames: Set<string> | null;
  pathNodeNames: Set<string> | null;
  pathConnectionKeys: Set<string> | null;
  simulationPathNodeNames?: Set<string> | null;
  simulationPathConnectionKeys?: Set<string> | null;
  isPanning: boolean;
  onNodeHover: (name: string) => void;
  onNodeLeave: () => void;
  onNodeClick: (name: string) => void;
  onConnectionHover: (id: string) => void;
  onConnectionLeave: () => void;
  onMapWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onMapPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onMapPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onMapPointerEnd: (event: React.PointerEvent<SVGSVGElement>) => void;
  drawnStrokes: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    size: number;
    isEraser: boolean;
  }>;
  isDrawingMode: boolean;
  onDrawingStart: (event: React.PointerEvent<SVGSVGElement>) => void;
  onDrawingMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onDrawingEnd: (event: React.PointerEvent<SVGSVGElement>) => void;
  dronePositions?: Array<{
    droneId: string;
    x: number;
    y: number;
    nextX: number;
    nextY: number;
    progress: number;
    completed: boolean;
  }>;
  onMapClick?: () => void;
};

export const MapCanvas = forwardRef<SVGSVGElement, MapCanvasProps>(
  function MapCanvas(
    {
      nodes,
      connections,
      viewBox,
      nodeByName,
      coordinateScale = 1,
      hoveredNode,
      hoveredConnection,
      selectedZone,
      selectedZoneForDetails,
      connectedNodeNames,
      pathNodeNames,
      pathConnectionKeys,
      simulationPathNodeNames,
      simulationPathConnectionKeys,
      isPanning,
      onNodeHover,
      onNodeLeave,
      onNodeClick,
      onConnectionHover,
      onConnectionLeave,
      onMapWheel,
      onMapPointerDown,
      onMapPointerMove,
      onMapPointerEnd,
      drawnStrokes,
      isDrawingMode,
      onDrawingStart,
      onDrawingMove,
      onDrawingEnd,
      dronePositions,
      onMapClick,
    },
    ref,
  ) {
    const xStep = Math.max(viewBox.width / 3, 1);
    const yStep = Math.max(viewBox.height / 3, 1);
    const xMarks = [0, 1, 2, 3].map((index) => viewBox.minX + index * xStep);
    const yMarks = [0, 1, 2, 3].map((index) => viewBox.minY + index * yStep);
    const hoveredNodeDetails = hoveredNode ? nodeByName.get(hoveredNode) : null;
    const hoveredDisplayX = hoveredNodeDetails
      ? hoveredNodeDetails.x / coordinateScale
      : 0;
    const hoveredDisplayY = hoveredNodeDetails
      ? hoveredNodeDetails.y / coordinateScale
      : 0;
    const hoveredNodeRadius = hoveredNodeDetails
      ? getNodeRadius(hoveredNodeDetails)
      : 0;
    const infoCardWidth = Math.min(18, Math.max(12, viewBox.width * 0.48));
    const infoCardHeight = hoveredNodeDetails?.maxDrones ? 4.8 : 4.2;
    const infoCardPadding = 0.35;
    const aboveY = hoveredNodeDetails
      ? hoveredNodeDetails.y - hoveredNodeRadius - infoCardHeight - 0.35
      : viewBox.minY;
    const belowY = hoveredNodeDetails
      ? hoveredNodeDetails.y + hoveredNodeRadius + 0.35
      : viewBox.minY;
    const preferredY =
      hoveredNodeDetails && aboveY >= viewBox.minY + infoCardPadding
        ? aboveY
        : belowY;
    const infoCardX = hoveredNodeDetails
      ? Math.min(
          Math.max(
            hoveredNodeDetails.x - infoCardWidth / 2,
            viewBox.minX + infoCardPadding,
          ),
          viewBox.minX + viewBox.width - infoCardWidth - infoCardPadding,
        )
      : viewBox.minX + infoCardPadding;
    const infoCardY = hoveredNodeDetails
      ? Math.min(
          Math.max(preferredY, viewBox.minY + infoCardPadding),
          viewBox.minY + viewBox.height - infoCardHeight - infoCardPadding,
        )
      : viewBox.minY + infoCardPadding;

    return (
      <motion.svg
        ref={ref}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        className={`h-full w-full touch-none ${
          isDrawingMode
            ? "cursor-crosshair"
            : isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
        }`}
        role="img"
        aria-label="Drone map visualization"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onWheel={onMapWheel}
        onPointerDown={isDrawingMode ? onDrawingStart : onMapPointerDown}
        onPointerMove={isDrawingMode ? onDrawingMove : onMapPointerMove}
        onPointerUp={isDrawingMode ? onDrawingEnd : onMapPointerEnd}
        onPointerCancel={isDrawingMode ? onDrawingEnd : onMapPointerEnd}
        onPointerLeave={isDrawingMode ? onDrawingEnd : onMapPointerEnd}
        onClick={(e) => {
          if (onMapClick && e.target === e.currentTarget) {
            onMapClick();
          }
        }}
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
          {connections.map((connection, index) => {
            const from = nodeByName.get(connection.from);
            const to = nodeByName.get(connection.to);

            if (!from || !to) {
              return null;
            }

            const connectionKey = `${connection.id}-${connection.lineNumber}-${index}`;
            const isPathConnection = pathConnectionKeys
              ? pathConnectionKeys.has(connectionKey)
              : false;
            const isSimulationPathConnection = simulationPathConnectionKeys
              ? simulationPathConnectionKeys.has(connectionKey)
              : false;
            const isHovered = hoveredConnection === connection.id;
            const hasActiveNodePath =
              hoveredNode !== null && pathConnectionKeys !== null;
            const isRelated = hoveredConnection
              ? hoveredConnection === connection.id ||
                (connectedNodeNames
                  ? connectedNodeNames.has(connection.from) &&
                    connectedNodeNames.has(connection.to)
                  : false)
              : hoveredNode
                ? hasActiveNodePath
                  ? isPathConnection
                  : hoveredNode === connection.from ||
                    hoveredNode === connection.to
                : selectedZone
                  ? selectedZone === connection.from ||
                    selectedZone === connection.to
                  : true;

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const lineWidth =
              connection.maxLinkCapacity && connection.maxLinkCapacity > 1
                ? 0.13
                : 0.07;

            return (
              <g key={connectionKey}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    isHovered
                      ? "#f8fafc"
                      : isPathConnection
                        ? "#6ee7b7"
                        : isSimulationPathConnection
                          ? "#6ee7b7"
                          : "rgba(148,163,184,0.8)"
                  }
                  strokeWidth={
                    isHovered || isPathConnection || isSimulationPathConnection
                      ? lineWidth * 1.8
                      : lineWidth
                  }
                  opacity={isRelated ? 1 : 0.4}
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
            const isPathNode = pathNodeNames
              ? pathNodeNames.has(node.name)
              : false;
            const isSimulationPathNode = simulationPathNodeNames
              ? simulationPathNodeNames.has(node.name)
              : false;
            const hasActiveNodePath =
              hoveredNode !== null && pathNodeNames !== null;
            const isConnectedToHoveredConnection = connectedNodeNames
              ? connectedNodeNames.has(node.name)
              : false;
            const isActive = hoveredConnection
              ? isConnectedToHoveredConnection
              : hoveredNode
                ? hasActiveNodePath
                  ? isPathNode
                  : hoveredNode === node.name
                : selectedZone
                  ? selectedZone === node.name
                  : true;
            const radius = getNodeRadius(node);
            const baseGlow =
              node.role === "goal" ? "url(#softGlow)" : undefined;
            const nodeDomId = getNodeDomId(node);

            return (
              <motion.g
                key={nodeDomId}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  scale: 1,
                  transition: { duration: 0.3 },
                }}
                whileHover={{
                  scale: 1.08,
                  transition: {
                    duration: 0.3,
                  },
                }}
                onClick={() => {
                  onNodeClick(node.name);
                  if (hoveredNode === node.name) {
                    onNodeLeave();
                  } else {
                    onNodeLeave();
                    onNodeHover(node.name);
                  }
                }}
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

                {!isPathNode && isSimulationPathNode && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 0.28}
                    fill="none"
                    stroke="#6ee7b7"
                    strokeWidth="0.07"
                    opacity="0.75"
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
              </motion.g>
            );
          })}
        </motion.g>

        {/* Drawing Layer */}
        <g>
          {drawnStrokes.map((stroke, strokeIndex) => {
            if (stroke.points.length < 2 || stroke.isEraser) return null;

            let pathData = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
            for (let i = 1; i < stroke.points.length; i++) {
              pathData += ` L ${stroke.points[i].x} ${stroke.points[i].y}`;
            }

            return (
              <path
                key={strokeIndex}
                d={pathData}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            );
          })}
        </g>

        {hoveredNodeDetails ? (
          <g pointerEvents="none">
            <rect
              x={infoCardX}
              y={infoCardY - 0.4}
              width={infoCardWidth}
              height={infoCardHeight}
              rx={0.2}
              fill="rgba(15,23,42,0.86)"
              stroke="rgba(56,189,248,0.55)"
              strokeWidth={0.04}
            />
            <text
              x={infoCardX + 0.35}
              y={infoCardY + 0.55}
              fill="#e2e8f0"
              fontSize={0.9}
              fontWeight={700}
            >
              {`${hoveredNodeDetails.name} (${hoveredNodeDetails.role.toUpperCase()})`}
            </text>
            <text
              x={infoCardX + 0.35}
              y={infoCardY + 1.35}
              fill="rgba(191,219,254,0.95)"
              fontSize={0.75}
            >
              {`Zone: ${hoveredNodeDetails.zone}`}
            </text>
            <text
              x={infoCardX + 0.35}
              y={infoCardY + 2.1}
              fill="rgba(191,219,254,0.95)"
              fontSize={0.75}
            >
              {`Pos: (${Math.round(hoveredDisplayX)}, ${Math.round(hoveredDisplayY)})`}
            </text>
            {hoveredNodeDetails.maxDrones ? (
              <text
                x={infoCardX + 0.35}
                y={infoCardY + 2.85}
                fill="rgba(191,219,254,0.95)"
                fontSize={0.75}
              >
                {`Max drones: ${hoveredNodeDetails.maxDrones}`}
              </text>
            ) : null}
          </g>
        ) : null}

        {/* Render Drones */}
        {dronePositions && dronePositions.length > 0 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {dronePositions.map((drone) => {
              const droneIndex = parseInt(drone.droneId.substring(1));
              const droneScale = 1.6;
              const colors = [
                "#3b82f6", // blue
                "#10b981", // emerald
                "#f59e0b", // amber
                "#ef4444", // red
                "#8b5cf6", // violet
                "#ec4899", // pink
              ];
              const color = colors[droneIndex % colors.length];

              // Interpolate drone position
              const droneX = drone.x + (drone.nextX - drone.x) * drone.progress;
              const droneY = drone.y + (drone.nextY - drone.y) * drone.progress;

              return (
                <g key={`drone-${drone.droneId}`}>
                  {/* Drone trail glow */}
                  <circle
                    cx={droneX}
                    cy={droneY}
                    r={0.5 * droneScale}
                    fill={color}
                    opacity="0.1"
                  />

                  {/* Drone body - larger main circle */}
                  <motion.circle
                    cx={droneX}
                    cy={droneY}
                    r={0.3 * droneScale}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={0.06 * droneScale}
                    filter={
                      drone.completed
                        ? "drop-shadow(0 0 0.4px rgba(16, 185, 129, 1)) drop-shadow(0 0 0.8px rgba(16, 185, 129, 0.6))"
                        : "drop-shadow(0 0 0.3px rgba(0, 0, 0, 0.7))"
                    }
                    animate={
                      drone.completed
                        ? {
                            scale: [1, 1.15, 1],
                            opacity: [0.9, 1, 0.9],
                          }
                        : {}
                    }
                    transition={
                      drone.completed
                        ? {
                            duration: 1,
                            repeat: Infinity,
                          }
                        : {}
                    }
                  />

                  {/* Propellers - 4 small circles around center */}
                  <motion.g
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ transformOrigin: `${droneX} ${droneY}` }}
                  >
                    <circle
                      cx={droneX + 0.24 * droneScale}
                      cy={droneY}
                      r={0.08 * droneScale}
                      fill={color}
                      opacity="0.6"
                    />
                    <circle
                      cx={droneX - 0.24 * droneScale}
                      cy={droneY}
                      r={0.08 * droneScale}
                      fill={color}
                      opacity="0.6"
                    />
                    <circle
                      cx={droneX}
                      cy={droneY + 0.24 * droneScale}
                      r={0.08 * droneScale}
                      fill={color}
                      opacity="0.6"
                    />
                    <circle
                      cx={droneX}
                      cy={droneY - 0.24 * droneScale}
                      r={0.08 * droneScale}
                      fill={color}
                      opacity="0.6"
                    />
                  </motion.g>

                  {/* Center dot for depth */}
                  <circle
                    cx={droneX}
                    cy={droneY}
                    r={0.12 * droneScale}
                    fill="#ffffff"
                    opacity="0.8"
                  />

                  {/* Drone label */}
                  <text
                    x={droneX}
                    y={droneY + 0.06 * droneScale}
                    fill="#000000"
                    fontSize={0.12 * droneScale}
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {drone.droneId}
                  </text>

                  {/* Completion indicator - rotating ring */}
                  {drone.completed && (
                    <motion.g
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ transformOrigin: `${droneX} ${droneY}` }}
                    >
                      <circle
                        cx={droneX}
                        cy={droneY}
                        r={0.55 * droneScale}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={0.04 * droneScale}
                        strokeDasharray={`${0.3 * droneScale} ${0.3 * droneScale}`}
                        opacity="0.8"
                      />
                    </motion.g>
                  )}
                </g>
              );
            })}
          </motion.g>
        )}

        {/* Zone Selection Indicators - Rendered on top of drones */}
        {(selectedZone || selectedZoneForDetails) && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {nodes.map((node) => {
              const radius = getNodeRadius(node);
              return (
                <g key={`zone-indicator-${node.name}`}>
                  {selectedZone === node.name && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 0.6}
                      fill="none"
                      stroke="#6ee7b7"
                      strokeWidth="0.15"
                      opacity="0.95"
                      pointerEvents="none"
                    />
                  )}

                  {selectedZoneForDetails === node.name && (
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 0.8}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="0.1"
                      opacity="0.7"
                      animate={{
                        r: [radius + 0.8, radius + 1.1, radius + 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}
          </motion.g>
        )}
      </motion.svg>
    );
  },
);
