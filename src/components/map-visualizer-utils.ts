import { ParsedNode } from "@/lib/types";

export type SvgViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export function getNodeAccent(node: ParsedNode) {
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

export function getNodeGradient(node: ParsedNode) {
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

export function getNodeRadius(node: ParsedNode) {
  if (node.role === "start" || node.role === "goal") {
    return 1;
  }

  switch (node.zone) {
    case "priority":
      return 0.42;
    case "restricted":
      return 0.58;
    case "blocked":
      return 0.72;
    default:
      return 0.35;
  }
}

export function getNodeDomId(node: ParsedNode) {
  return `${node.role}-${node.lineNumber}-${node.name}`;
}

export function clampPan(
  pan: { x: number; y: number },
  zoom: number,
  box: SvgViewBox,
) {
  const visibleWidth = box.width / zoom;
  const visibleHeight = box.height / zoom;
  const maxX = Math.max(0, box.width - visibleWidth);
  const maxY = Math.max(0, box.height - visibleHeight);

  return {
    x: Math.min(Math.max(pan.x, 0), maxX),
    y: Math.min(Math.max(pan.y, 0), maxY),
  };
}
