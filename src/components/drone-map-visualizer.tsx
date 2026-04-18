"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { computeViewBox } from "@/lib/geometry";
import { parseDroneMap } from "@/lib/parser";
import { SAMPLE_MAPS, SAMPLE_OPTIONS, SampleKey } from "@/lib/samples";
import { ParsedConnection, ParsedMap, ParsedNode } from "@/lib/types";

function getNodeAccent(node: ParsedNode) {
  if (node.color) {
    return node.color;
  }

  switch (node.role) {
    case "start":
      return "#22c55e";
    case "goal":
      return "#facc15";
    default:
      switch (node.zone) {
        case "restricted":
          return "#fb7185";
        case "priority":
          return "#a855f7";
        case "blocked":
          return "#64748b";
        default:
          return "#38bdf8";
      }
  }
}

function getNodeGradient(node: ParsedNode) {
  if (node.role === "start") {
    return ["#16a34a", "#22c55e"];
  }

  if (node.role === "goal") {
    return ["#eab308", "#facc15"];
  }

  switch (node.zone) {
    case "restricted":
      return ["#fb7185", "#f97316"];
    case "priority":
      return ["#8b5cf6", "#10b981"];
    case "blocked":
      return ["#334155", "#0f172a"];
    default:
      return ["#38bdf8", "#2563eb"];
  }
}

function getNodeRadius(node: ParsedNode) {
  return node.role === "start" || node.role === "goal" ? 1.15 : 0.88;
}

function formatIssueLocation(lineNumber: number) {
  return lineNumber > 0 ? `Line ${lineNumber}` : "File";
}

function serializeParsedMap(parsed: ParsedMap, sourceText: string) {
  return {
    sourceText,
    nbDrones: parsed.nbDrones,
    startHub: parsed.startHub,
    endHub: parsed.endHub,
    hubs: parsed.hubs,
    connections: parsed.connections,
    issues: parsed.issues,
    summary: {
      hubs: parsed.hubs.length,
      connections: parsed.connections.length,
      nbDrones: parsed.nbDrones,
    },
  };
}

function getNodeDomId(node: ParsedNode) {
  return `${node.role}-${node.lineNumber}-${node.name}`;
}

export default function DroneMapVisualizer() {
  const [draftText, setDraftText] = useState<string>(SAMPLE_MAPS.easy);
  const [appliedText, setAppliedText] = useState<string>(SAMPLE_MAPS.easy);
  const [sampleKey, setSampleKey] = useState<SampleKey>("easy");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(
    null,
  );
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const parsed = useMemo(() => parseDroneMap(appliedText), [appliedText]);
  const nodes = useMemo(() => {
    const seen = new Set<string>();
    return [parsed.startHub, ...parsed.hubs, parsed.endHub].filter(
      (node): node is ParsedNode => {
        if (!node) {
          return false;
        }

        const nodeDomId = getNodeDomId(node);
        if (seen.has(nodeDomId)) {
          return false;
        }

        seen.add(nodeDomId);
        return true;
      },
    );
  }, [parsed]);
  const viewBox = useMemo(() => computeViewBox(nodes), [nodes]);

  const nodeByName = useMemo(() => {
    const map = new Map<string, ParsedNode>();
    nodes.forEach((node) => map.set(node.name, node));
    return map;
  }, [nodes]);

  const connectedNodeNames = useMemo(() => {
    if (hoveredConnection) {
      const connection = parsed.connections.find(
        (item) => item.id === hoveredConnection,
      );
      return new Set(connection ? [connection.from, connection.to] : []);
    }

    if (hoveredNode) {
      return new Set(
        parsed.connections.flatMap((connection) =>
          connection.from === hoveredNode || connection.to === hoveredNode
            ? [connection.from, connection.to]
            : [],
        ),
      );
    }

    return null;
  }, [hoveredConnection, hoveredNode, parsed.connections]);

  const summary = useMemo(() => {
    return {
      drones: parsed.nbDrones ?? 0,
      hubs: nodes.length,
      connections: parsed.connections.length,
      issueCount: parsed.issues.filter((issue) => issue.severity === "error")
        .length,
    };
  }, [nodes.length, parsed.connections.length, parsed.issues, parsed.nbDrones]);

  useEffect(() => {
    setHoveredNode(null);
    setHoveredConnection(null);
  }, [appliedText]);

  async function handleCopyJson() {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(serializeParsedMap(parsed, appliedText), null, 2),
      );
    } finally {
      setTimeout(() => setIsCopying(false), 700);
    }
  }

  async function handleDownloadPng() {
    if (!svgRef.current) {
      return;
    }

    setIsDownloading(true);
    try {
      const svg = svgRef.current;
      const bounds = svg.getBoundingClientRect();
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width = Math.max(1, Math.floor(bounds.width * scale));
        canvas.height = Math.max(1, Math.floor(bounds.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(url);
          setIsDownloading(false);
          return;
        }

        context.scale(scale, scale);
        context.fillStyle = "#020617";
        context.fillRect(0, 0, bounds.width, bounds.height);
        context.drawImage(image, 0, 0, bounds.width, bounds.height);

        const link = document.createElement("a");
        link.download = "drone-map-visualizer.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      };

      image.src = url;
    } catch {
      setIsDownloading(false);
    }
  }

  const hasRenderableMap = nodes.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col gap-6 px-4 py-6 lg:px-2">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 space-x-5">
              <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Drone Map Visualizer
              </span>
              <motion.a
                href="https://profile-v3.intra.42.fr/users/soahrich"
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex w-fit items-center gap-2 overflow-hidden rounded-full border border-cyan-300/30 bg-slate-900/70 px-4 py-2 text-sm font-semibold tracking-wide text-cyan-100 shadow-lg shadow-cyan-900/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                aria-label="Open sohrich GitHub profile"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/15 via-teal-300/10 to-sky-400/15 opacity-80 transition group-hover:opacity-100" />
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/20 text-xs">
                  GH
                </span>
                <span className="relative">by sohrich</span>
                <span className="relative text-cyan-200 transition-transform duration-200 group-hover:translate-x-0.5">
                  {"->"}
                </span>
              </motion.a>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Visualize drone graphs from text instantly.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Paste a map config, parse it, and render a clean interactive
                  SVG graph with zones, capacities, and student-friendly
                  feedback.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
              <SummaryCard
                label="Drones"
                value={summary.drones.toString()}
                accent="from-emerald-400 to-emerald-500"
              />
              <SummaryCard
                label="Hubs"
                value={summary.hubs.toString()}
                accent="from-sky-400 to-blue-500"
              />
              <SummaryCard
                label="Links"
                value={summary.connections.toString()}
                accent="from-violet-400 to-fuchsia-500"
              />
            </div>
          </div>
        </motion.header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-glow backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Map input
                  </h2>
                  <p className="text-sm text-slate-400">
                    Choose a sample or paste your own configuration.
                  </p>
                </div>
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Sample
                  <select
                    value={sampleKey}
                    onChange={(event) =>
                      setSampleKey(event.target.value as SampleKey)
                    }
                    className="mt-2 block w-full rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                  >
                    {SAMPLE_OPTIONS.map((sample) => (
                      <option key={sample.value} value={sample.value}>
                        {sample.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const nextSample = SAMPLE_MAPS[sampleKey];
                    setDraftText(nextSample);
                    setAppliedText(nextSample);
                  }}
                  className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={() => setAppliedText(draftText)}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  Render map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftText("");
                    setAppliedText("");
                    setHoveredNode(null);
                    setHoveredConnection(null);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>

              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Paste drone map text here..."
                className="min-h-[260px] w-full resize-none rounded-3xl border border-white/10 bg-slate-900/90 p-4 text-sm leading-6 text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/70"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Validation</h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {summary.issueCount === 0
                    ? "All good"
                    : `${summary.issueCount} error${summary.issueCount === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {parsed.issues.length === 0 ? (
                    <motion.div
                      key="clean-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
                    >
                      Ready to visualize.
                    </motion.div>
                  ) : (
                    parsed.issues.map((issue) => (
                      <motion.div
                        key={`${issue.lineNumber}-${issue.message}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          issue.severity === "error"
                            ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                            : "border-amber-400/20 bg-amber-400/10 text-amber-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
                            {formatIssueLocation(issue.lineNumber)}
                          </span>
                          <span className="leading-6">{issue.message}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex min-h-[640px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-glow backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Interactive map
                </h2>
                <p className="text-sm text-slate-400">
                  Hover nodes and links to highlight related paths.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  {isCopying ? "Copied" : "Copy JSON"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  {isDownloading ? "Exporting" : "Download PNG"}
                </button>
              </div>
            </div>

            <div className="grid flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90">
                <MapCanvas
                  ref={svgRef}
                  nodes={nodes}
                  connections={parsed.connections}
                  viewBox={viewBox}
                  nodeByName={nodeByName}
                  hoveredNode={hoveredNode}
                  hoveredConnection={hoveredConnection}
                  connectedNodeNames={connectedNodeNames}
                  onNodeHover={setHoveredNode}
                  onNodeLeave={() => setHoveredNode(null)}
                  onConnectionHover={setHoveredConnection}
                  onConnectionLeave={() => setHoveredConnection(null)}
                />

                {!hasRenderableMap && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-sm text-slate-400 backdrop-blur-sm">
                    Add a valid map with start and end hubs to see the
                    visualization.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <LegendCard />
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/80 p-4"
                >
                  <h3 className="font-semibold text-white">Parsed summary</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <SummaryLine
                      label="Start"
                      value={parsed.startHub ? parsed.startHub.name : "Missing"}
                    />
                    <SummaryLine
                      label="Goal"
                      value={parsed.endHub ? parsed.endHub.name : "Missing"}
                    />
                    <SummaryLine
                      label="Nodes"
                      value={nodes.length.toString()}
                    />
                    <SummaryLine
                      label="Connections"
                      value={parsed.connections.length.toString()}
                    />
                  </dl>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

type MapCanvasProps = {
  nodes: ParsedNode[];
  connections: ParsedConnection[];
  viewBox: { minX: number; minY: number; width: number; height: number };
  nodeByName: Map<string, ParsedNode>;
  hoveredNode: string | null;
  hoveredConnection: string | null;
  connectedNodeNames: Set<string> | null;
  onNodeHover: (name: string) => void;
  onNodeLeave: () => void;
  onConnectionHover: (id: string) => void;
  onConnectionLeave: () => void;
};

const MapCanvas = forwardRef<SVGSVGElement, MapCanvasProps>(function MapCanvas(
  {
    nodes,
    connections,
    viewBox,
    nodeByName,
    hoveredNode,
    hoveredConnection,
    connectedNodeNames,
    onNodeHover,
    onNodeLeave,
    onConnectionHover,
    onConnectionLeave,
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
      className="h-full w-full"
      role="img"
      aria-label="Drone map visualization"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

        <linearGradient id="backgroundGlow" x1="0%" y1="0%" x2="100%" y2="100%">
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

          const isHovered = hoveredConnection === connection.id;
          const isRelated =
            hoveredConnection === connection.id ||
            hoveredNode === connection.from ||
            hoveredNode === connection.to ||
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
                stroke={isHovered ? "#f8fafc" : "rgba(148,163,184,0.8)"}
                strokeWidth={isHovered ? lineWidth * 1.8 : lineWidth}
                opacity={isRelated ? 1 : 0.18}
                strokeLinecap="round"
                filter={isHovered ? "url(#softGlow)" : undefined}
                onMouseEnter={() => onConnectionHover(connection.id)}
                onMouseLeave={onConnectionLeave}
                className="transition-all duration-200"
              />

              {connection.maxLinkCapacity && connection.maxLinkCapacity > 1 ? (
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
          const radius = getNodeRadius(node);
          const baseGlow = node.role === "goal" ? "url(#softGlow)" : undefined;
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
                  <rect
                    x={node.x + radius * 0.35}
                    y={node.y - radius * 1.1}
                    width={0.42}
                    height={0.42}
                    rx={0.14}
                    fill="#0f172a"
                    opacity="0.85"
                  />
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
});

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${accent} p-[1px] shadow-lg shadow-slate-950/40`}
    >
      <div className="rounded-2xl bg-slate-950/90 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function LegendCard() {
  const items = [
    {
      label: "Start hub",
      tone: "from-emerald-400 to-emerald-600",
      text: "Green pulse",
    },
    {
      label: "Goal hub",
      tone: "from-amber-300 to-yellow-500",
      text: "Gold glow",
    },
    {
      label: "Restricted",
      tone: "from-rose-400 to-orange-500",
      text: "Dashed warning",
    },
    {
      label: "Priority",
      tone: "from-violet-400 to-emerald-400",
      text: "Star badge",
    },
    {
      label: "Blocked",
      tone: "from-slate-400 to-slate-700",
      text: "X overlay",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-slate-900/80 p-4"
    >
      <h3 className="font-semibold text-white">Legend</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
          >
            <span
              className={`h-4 w-4 rounded-full bg-gradient-to-br ${item.tone} shadow-lg`}
            />
            <div>
              <div className="text-sm font-medium text-slate-100">
                {item.label}
              </div>
              <div className="text-xs text-slate-400">{item.text}</div>
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Capacity labels appear on links with values greater than 1.
        </div>
      </div>
    </motion.div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
}
