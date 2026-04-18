"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeViewBox } from "@/lib/geometry";
import { parseDroneMap } from "@/lib/parser";
import { SAMPLE_MAPS, SAMPLE_OPTIONS, SampleKey } from "@/lib/samples";
import { ParsedMap, ParsedNode } from "@/lib/types";
import { MapCanvas } from "./map-canvas";
import {
  clampPan,
  findPathBetweenNodes,
  getNodeDomId,
  SvgViewBox,
} from "@/components/map-visualizer-utils";
import {
  LegendCard,
  SummaryCard,
  SummaryLine,
} from "@/components/map-side-panels";

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

const MIN_ZOOM = 0.02;
const MAX_ZOOM = 30;
const TARGET_CELL_SPACING_PX = 600;
const COORDINATE_SPACING_FACTOR = 3;

function getZoomForCellSpacing(
  svgElement: SVGSVGElement | null,
  viewBox: SvgViewBox,
) {
  if (!svgElement) {
    return 1;
  }

  const rect = svgElement.getBoundingClientRect();
  if (rect.width <= 0 || !Number.isFinite(rect.width)) {
    return 1;
  }

  // At zoom=1, px/unit is rect.width / viewBox.width. Solve for target spacing.
  const zoomForTarget = (TARGET_CELL_SPACING_PX * viewBox.width) / rect.width;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomForTarget));
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panPointerRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const parsed = useMemo(() => parseDroneMap(appliedText), [appliedText]);
  const sourceNodes = useMemo(() => {
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
  const nodes = useMemo(
    () =>
      sourceNodes.map((node) => ({
        ...node,
        x: node.x * COORDINATE_SPACING_FACTOR,
        y: node.y * COORDINATE_SPACING_FACTOR,
      })),
    [sourceNodes],
  );
  const viewBox = useMemo(() => computeViewBox(nodes), [nodes]);
  const clampedPan = useMemo(
    () => clampPan(pan, zoom, viewBox),
    [pan, zoom, viewBox],
  );
  const interactiveViewBox = useMemo(() => {
    const width = viewBox.width / zoom;
    const height = viewBox.height / zoom;
    return {
      minX: viewBox.minX + clampedPan.x,
      minY: viewBox.minY + clampedPan.y,
      width,
      height,
    } satisfies SvgViewBox;
  }, [viewBox, zoom, clampedPan]);

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

  const pathFromHoveredToGoal = useMemo(() => {
    if (!hoveredNode || !parsed.endHub || parsed.connections.length === 0) {
      return [] as string[];
    }

    const hoveredNodeObj = nodeByName.get(hoveredNode);
    if (!hoveredNodeObj) {
      return [];
    }

    if (hoveredNodeObj.zone === "blocked") {
      return [];
    }

    return findPathBetweenNodes(
      hoveredNode,
      parsed.endHub.name,
      parsed.connections,
    );
  }, [hoveredNode, parsed.endHub, parsed.connections, nodeByName]);

  const pathNodeNames = useMemo(() => {
    if (pathFromHoveredToGoal.length === 0) {
      return null;
    }

    return new Set(pathFromHoveredToGoal);
  }, [pathFromHoveredToGoal]);

  const blockedNodeMessage = useMemo(() => {
    if (!hoveredNode) {
      return null;
    }

    const hoveredNodeObj = nodeByName.get(hoveredNode);
    if (hoveredNodeObj && hoveredNodeObj.zone === "blocked") {
      return `Zone "${hoveredNode}" is blocked - no path available`;
    }

    return null;
  }, [hoveredNode, nodeByName]);

  const pathConnectionKeys = useMemo(() => {
    if (pathFromHoveredToGoal.length === 0) {
      return null;
    }

    const connectionKeysByPair = new Map<string, string>();
    parsed.connections.forEach((conn, index) => {
      const connectionKey = `${conn.id}-${conn.lineNumber}-${index}`;
      const forwardKey = `${conn.from}->${conn.to}`;
      const backwardKey = `${conn.to}->${conn.from}`;

      if (!connectionKeysByPair.has(forwardKey)) {
        connectionKeysByPair.set(forwardKey, connectionKey);
      }
      if (!connectionKeysByPair.has(backwardKey)) {
        connectionKeysByPair.set(backwardKey, connectionKey);
      }
    });

    const connKeys = new Set<string>();
    for (let index = 0; index < pathFromHoveredToGoal.length - 1; index += 1) {
      const pairKey = `${pathFromHoveredToGoal[index]}->${pathFromHoveredToGoal[index + 1]}`;
      const connectionKey = connectionKeysByPair.get(pairKey);
      if (connectionKey) {
        connKeys.add(connectionKey);
      }
    }

    return connKeys.size > 0 ? connKeys : null;
  }, [pathFromHoveredToGoal, parsed.connections]);

  const summary = useMemo(() => {
    return {
      drones: parsed.nbDrones ?? 0,
      hubs: sourceNodes.length,
      connections: parsed.connections.length,
      issueCount: parsed.issues.filter((issue) => issue.severity === "error")
        .length,
    };
  }, [
    sourceNodes.length,
    parsed.connections.length,
    parsed.issues,
    parsed.nbDrones,
  ]);

  useEffect(() => {
    setHoveredNode(null);
    setHoveredConnection(null);
  }, [appliedText]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      panPointerRef.current = { active: false, lastX: 0, lastY: 0 };
      setIsPanning(false);
    });

    return () => cancelAnimationFrame(rafId);
  }, [viewBox.minX, viewBox.minY, viewBox.width, viewBox.height]);

  useEffect(() => {
    if (clampedPan.x !== pan.x || clampedPan.y !== pan.y) {
      setPan(clampedPan);
    }
  }, [clampedPan, pan.x, pan.y]);

  function handleMapWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * zoomFactor));

    if (nextZoom === zoom) {
      return;
    }

    const currentPan = clampPan(pan, zoom, viewBox);
    const pointerXRatio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    const pointerYRatio = Math.min(
      Math.max((event.clientY - rect.top) / rect.height, 0),
      1,
    );

    const currentWidth = viewBox.width / zoom;
    const currentHeight = viewBox.height / zoom;
    const worldX = viewBox.minX + currentPan.x + pointerXRatio * currentWidth;
    const worldY = viewBox.minY + currentPan.y + pointerYRatio * currentHeight;

    const nextWidth = viewBox.width / nextZoom;
    const nextHeight = viewBox.height / nextZoom;
    const nextPan = {
      x: worldX - viewBox.minX - pointerXRatio * nextWidth,
      y: worldY - viewBox.minY - pointerYRatio * nextHeight,
    };

    setZoom(nextZoom);
    setPan(clampPan(nextPan, nextZoom, viewBox));
  }

  function handleMapPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    panPointerRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMapPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = panPointerRef.current;
    if (!drag.active) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    const unitsPerPxX = interactiveViewBox.width / rect.width;
    const unitsPerPxY = interactiveViewBox.height / rect.height;

    setPan((prev) =>
      clampPan(
        {
          x: prev.x - deltaX * unitsPerPxX,
          y: prev.y - deltaY * unitsPerPxY,
        },
        zoom,
        viewBox,
      ),
    );
  }

  function handleMapPointerEnd(event: React.PointerEvent<SVGSVGElement>) {
    if (!panPointerRef.current.active) {
      return;
    }

    panPointerRef.current.active = false;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleZoomIn() {
    const nextZoom = Math.min(MAX_ZOOM, zoom * 1.12);
    setZoom(nextZoom);
  }

  function handleZoomOut() {
    const nextZoom = Math.max(MIN_ZOOM, zoom * 0.9);
    setZoom(nextZoom);
  }

  function handleResetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleNodeHover(name: string) {
    setHoveredConnection(null);
    setHoveredNode(name);
  }

  function handleNodeLeave() {
    setHoveredNode(null);
  }

  function handleConnectionHover(id: string) {
    setHoveredNode(null);
    setHoveredConnection(id);
  }

  function handleConnectionLeave() {
    setHoveredConnection(null);
  }

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
                {/* <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/20 text-xs">
                  GH
                </span> */}
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
                <span className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">
                  Zoom {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  + Zoom in
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  − Zoom out
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Reset view
                </button>
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
                  viewBox={interactiveViewBox}
                  nodeByName={nodeByName}
                  coordinateScale={COORDINATE_SPACING_FACTOR}
                  hoveredNode={hoveredNode}
                  hoveredConnection={hoveredConnection}
                  connectedNodeNames={connectedNodeNames}
                  pathNodeNames={pathNodeNames}
                  pathConnectionKeys={pathConnectionKeys}
                  isPanning={isPanning}
                  onNodeHover={handleNodeHover}
                  onNodeLeave={handleNodeLeave}
                  onConnectionHover={handleConnectionHover}
                  onConnectionLeave={handleConnectionLeave}
                  onMapWheel={handleMapWheel}
                  onMapPointerDown={handleMapPointerDown}
                  onMapPointerMove={handleMapPointerMove}
                  onMapPointerEnd={handleMapPointerEnd}
                />

                {!hasRenderableMap && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-sm text-slate-400 backdrop-blur-sm">
                    Add a valid map with start and end hubs to see the
                    visualization.
                  </div>
                )}

                {blockedNodeMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100 backdrop-blur-sm"
                  >
                    {blockedNodeMessage}
                  </motion.div>
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
