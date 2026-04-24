import { ParsedConnection, ParsedNode } from "@/lib/types";

export type SvgViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export function findPathBetweenNodes(
  from: string,
  to: string,
  connections: ParsedConnection[],
): string[] {
  const graph = new Map<string, Set<string>>();

  connections.forEach((conn) => {
    if (!graph.has(conn.from)) graph.set(conn.from, new Set());
    if (!graph.has(conn.to)) graph.set(conn.to, new Set());
    graph.get(conn.from)!.add(conn.to);
    graph.get(conn.to)!.add(conn.from);
  });

  const queue: [string, string[]][] = [[from, [from]]];
  const visited = new Set<string>([from]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (current === to) {
      return path;
    }

    const neighbors = graph.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return [];
}

export function findAllShortestPathsBetweenNodes(
  from: string,
  to: string,
  connections: ParsedConnection[],
): string[][] {
  if (from === to) {
    return [[from]];
  }

  const graph = new Map<string, Set<string>>();
  connections.forEach((conn) => {
    if (!graph.has(conn.from)) graph.set(conn.from, new Set());
    if (!graph.has(conn.to)) graph.set(conn.to, new Set());
    graph.get(conn.from)!.add(conn.to);
    graph.get(conn.to)!.add(conn.from);
  });

  if (!graph.has(from) || !graph.has(to)) {
    return [];
  }

  const distance = new Map<string, number>();
  const parents = new Map<string, Set<string>>();
  const queue: string[] = [from];
  distance.set(from, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDistance = distance.get(current)!;
    const neighbors = graph.get(current) ?? new Set<string>();

    for (const neighbor of neighbors) {
      const nextDistance = currentDistance + 1;
      if (!distance.has(neighbor)) {
        distance.set(neighbor, nextDistance);
        parents.set(neighbor, new Set([current]));
        queue.push(neighbor);
      } else if (distance.get(neighbor) === nextDistance) {
        if (!parents.has(neighbor)) {
          parents.set(neighbor, new Set());
        }
        parents.get(neighbor)!.add(current);
      }
    }
  }

  if (!distance.has(to)) {
    return [];
  }

  const results: string[][] = [];
  const path = [to];
  const maxPaths = 150;

  function backtrack(node: string) {
    if (results.length >= maxPaths) {
      return;
    }

    if (node === from) {
      results.push([...path].reverse());
      return;
    }

    const nodeParents = parents.get(node);
    if (!nodeParents || nodeParents.size === 0) {
      return;
    }

    nodeParents.forEach((parent) => {
      path.push(parent);
      backtrack(parent);
      path.pop();
    });
  }

  backtrack(to);
  return results;
}

export function findAllPathsBetweenNodes(
  from: string,
  to: string,
  connections: ParsedConnection[],
  maxPaths = 600,
): string[][] {
  if (from === to) {
    return [[from]];
  }

  const graph = new Map<string, Set<string>>();
  connections.forEach((conn) => {
    if (!graph.has(conn.from)) graph.set(conn.from, new Set());
    if (!graph.has(conn.to)) graph.set(conn.to, new Set());
    graph.get(conn.from)!.add(conn.to);
    graph.get(conn.to)!.add(conn.from);
  });

  if (!graph.has(from) || !graph.has(to)) {
    return [];
  }

  const results: string[][] = [];
  const path: string[] = [from];
  const visited = new Set<string>([from]);
  const maxDepth = graph.size;

  function dfs(current: string) {
    if (results.length >= maxPaths) {
      return;
    }

    if (current === to) {
      results.push([...path]);
      return;
    }

    if (path.length > maxDepth) {
      return;
    }

    const neighbors = graph.get(current) ?? new Set<string>();
    neighbors.forEach((neighbor) => {
      if (visited.has(neighbor)) {
        return;
      }

      visited.add(neighbor);
      path.push(neighbor);
      dfs(neighbor);
      path.pop();
      visited.delete(neighbor);
    });
  }

  dfs(from);
  return results;
}

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
    return 1.3;
  }

  switch (node.zone) {
    case "priority":
      return 1;
    case "restricted":
      return 1.2;
    case "blocked":
      return 1.3;
    default:
      return 0.9;
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
