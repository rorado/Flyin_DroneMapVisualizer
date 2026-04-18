export type ZoneType = "normal" | "restricted" | "priority" | "blocked";
export type NodeRole = "start" | "goal" | "hub";

export interface ParsedNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: NodeRole;
  zone: ZoneType;
  color?: string;
  maxDrones?: number;
  metadata: Record<string, string>;
  lineNumber: number;
}

export interface ParsedConnection {
  id: string;
  from: string;
  to: string;
  maxLinkCapacity?: number;
  metadata: Record<string, string>;
  lineNumber: number;
}

export interface ParseIssue {
  lineNumber: number;
  message: string;
  severity: "error" | "warning";
}

export interface ParsedMap {
  nbDrones: number | null;
  startHub: ParsedNode | null;
  endHub: ParsedNode | null;
  hubs: ParsedNode[];
  connections: ParsedConnection[];
  issues: ParseIssue[];
}
