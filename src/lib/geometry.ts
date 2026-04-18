import { ParsedNode } from "./types";

export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function computeViewBox(
  nodes: ParsedNode[],
  paddingRatio = 0.28,
): ViewBox {
  if (nodes.length === 0) {
    return { minX: -10, minY: -10, width: 20, height: 20 };
  }

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const padding = Math.max(spanX, spanY) * paddingRatio + 2;

  return {
    minX: minX - padding,
    minY: minY - padding,
    width: spanX + padding * 2,
    height: spanY + padding * 2,
  };
}
