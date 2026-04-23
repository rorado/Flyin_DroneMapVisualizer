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

// Drone Simulation Types
export interface DroneMovement {
  droneId: string;
  path: string[]; // Sequence of zone names
  turns?: number[]; // Turn number for each move in path
}

export interface DroneState {
  droneId: string;
  currentZone: string;
  nextZone: string | null;
  progress: number; // 0 to 1 (interpolation between current and next)
  completed: boolean;
  pathIndex: number;
}

export interface SimulationFrame {
  frameNumber: number;
  drones: DroneState[];
  allCompleted: boolean;
}

export interface ParsedSimulation {
  movements: DroneMovement[];
  issues: ParseIssue[];
}
