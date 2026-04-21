import {
  DroneMovement,
  ParseIssue,
  ParsedMap,
  ParsedSimulation,
} from "./types";

export function parseSimulation(
  input: string,
  validZones?: Set<string>,
): ParsedSimulation {
  const issues: ParseIssue[] = [];
  const dronePaths: Map<string, string[]> = new Map();
  const lines = input.split(/\r?\n/);
  const mentionedZones = new Set<string>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    const lineNumber = lineIndex + 1;

    // Skip empty lines and comments
    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) {
      continue;
    }

    // Each line contains movements for that frame
    // Parse tokens from left to right
    const movementTokens = rawLine.split(/\s+/);

    for (const token of movementTokens) {
      // Match pattern: D<number>-<zone_name>
      const match = token.match(/^D(\d+)-(.+)$/);
      if (!match) {
        issues.push({
          lineNumber,
          message: `Invalid movement format "${token}". Expected: D<number>-<zone_name> (e.g., D1-junction)`,
          severity: "error",
        });
        continue;
      }

      const droneId = `D${match[1]}`;
      const zoneName = match[2];
      mentionedZones.add(zoneName);

      // Initialize drone path if it doesn't exist
      if (!dronePaths.has(droneId)) {
        dronePaths.set(droneId, []);
      }

      // Add the zone to this drone's path
      dronePaths.get(droneId)!.push(zoneName);
    }
  }

  // Validate that all zones exist in the map
  if (validZones && validZones.size > 0) {
    for (const zone of mentionedZones) {
      if (!validZones.has(zone)) {
        issues.push({
          lineNumber: 0,
          message: `Zone "${zone}" does not exist in the map. Available zones: ${Array.from(validZones).join(", ")}`,
          severity: "error",
        });
      }
    }
  }

  const droneMovements: DroneMovement[] = Array.from(dronePaths.entries()).map(
    ([droneId, path]) => ({
      droneId,
      path,
    }),
  );

  return {
    movements: droneMovements,
    issues,
  };
}

export function getMaxPathLength(movements: DroneMovement[]): number {
  // Add 1 for the starting frame (all drones start at start_hub)
  // Then add the length of the longest path
  const maxPathLength = Math.max(...movements.map((m) => m.path.length), 0);
  return maxPathLength + 1;
}

export function validateSimulationAgainstMap(
  input: string,
  parsedMap: ParsedMap,
): ParseIssue[] {
  const issues: ParseIssue[] = [];

  if (!parsedMap.startHub || !parsedMap.endHub) {
    issues.push({
      lineNumber: 0,
      message:
        "Map must include start_hub and end_hub before validating simulation.",
      severity: "error",
    });
    return issues;
  }

  const nodeByName = new Map<string, (typeof parsedMap.hubs)[number]>();
  parsedMap.hubs.forEach((node) => nodeByName.set(node.name, node));
  nodeByName.set(parsedMap.startHub.name, parsedMap.startHub);
  nodeByName.set(parsedMap.endHub.name, parsedMap.endHub);

  const adjacency = new Map<string, Set<string>>();
  const connectionCapByEdge = new Map<string, number>();
  for (const conn of parsedMap.connections) {
    if (!adjacency.has(conn.from)) adjacency.set(conn.from, new Set());
    if (!adjacency.has(conn.to)) adjacency.set(conn.to, new Set());
    adjacency.get(conn.from)!.add(conn.to);
    adjacency.get(conn.to)!.add(conn.from);

    const cap = conn.maxLinkCapacity ?? 1;
    connectionCapByEdge.set(`${conn.from}__${conn.to}`, cap);
    connectionCapByEdge.set(`${conn.to}__${conn.from}`, cap);
  }

  const lines = input.split(/\r?\n/);
  // Tracks only active (not yet delivered) drones and their current zone.
  const droneCurrentZone = new Map<string, string>();
  const deliveredDrones = new Set<string>();
  const usedDrones = new Set<string>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    const lineNumber = lineIndex + 1;

    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) {
      continue;
    }

    const tokens = rawLine.split(/\s+/);
    const movedDronesThisLine = new Set<string>();
    const edgeUseCount = new Map<string, number>();
    const leavingCount = new Map<string, number>();
    const enteringCount = new Map<string, number>();

    const intents: Array<{
      droneId: string;
      droneNumber: number;
      fromZone: string;
      destinationZone: string;
      isValid: boolean;
    }> = [];

    for (const token of tokens) {
      const match = token.match(/^D(\d+)-(.+)$/);
      if (!match) {
        continue;
      }

      const droneNumber = Number(match[1]);
      const droneId = `D${droneNumber}`;
      const destinationZone = match[2];
      usedDrones.add(droneId);

      if (parsedMap.nbDrones !== null && droneNumber > parsedMap.nbDrones) {
        issues.push({
          lineNumber,
          message: `${droneId} exceeds map drone count (${parsedMap.nbDrones}).`,
          severity: "error",
        });
      }

      if (movedDronesThisLine.has(droneId)) {
        issues.push({
          lineNumber,
          message: `${droneId} appears more than once in the same turn.`,
          severity: "error",
        });
        continue;
      }
      movedDronesThisLine.add(droneId);

      if (deliveredDrones.has(droneId)) {
        issues.push({
          lineNumber,
          message: `${droneId} already reached end_hub and must not move again.`,
          severity: "error",
        });
        continue;
      }

      const destinationNode = nodeByName.get(destinationZone);
      if (!destinationNode) {
        issues.push({
          lineNumber,
          message: `${droneId} destination zone "${destinationZone}" is not defined in map.`,
          severity: "error",
        });
        continue;
      }

      let isMoveValid = true;
      const fromZone = droneCurrentZone.get(droneId) ?? parsedMap.startHub.name;

      // Simulation output requires that drones that do not move are omitted.
      if (fromZone === destinationZone) {
        issues.push({
          lineNumber,
          message: `${droneId} is already in "${destinationZone}"; drones that do not move must be omitted from the turn output.`,
          severity: "error",
        });
        isMoveValid = false;
      }

      if (destinationNode.zone === "blocked") {
        issues.push({
          lineNumber,
          message: `${droneId} cannot enter blocked zone "${destinationZone}".`,
          severity: "error",
        });
        isMoveValid = false;
      }

      const canMove = adjacency.get(fromZone)?.has(destinationZone) ?? false;
      if (!canMove) {
        issues.push({
          lineNumber,
          message: `${droneId} movement "${fromZone} -> ${destinationZone}" is invalid (no connection).`,
          severity: "error",
        });
        isMoveValid = false;
      }

      const edgeKey = `${fromZone}__${destinationZone}`;
      edgeUseCount.set(edgeKey, (edgeUseCount.get(edgeKey) ?? 0) + 1);
      const edgeCap = connectionCapByEdge.get(edgeKey) ?? 1;
      if ((edgeUseCount.get(edgeKey) ?? 0) > edgeCap) {
        issues.push({
          lineNumber,
          message: `Connection capacity exceeded on ${fromZone}-${destinationZone} (max ${edgeCap}).`,
          severity: "error",
        });
        isMoveValid = false;
      }

      leavingCount.set(fromZone, (leavingCount.get(fromZone) ?? 0) + 1);
      enteringCount.set(
        destinationZone,
        (enteringCount.get(destinationZone) ?? 0) + 1,
      );

      intents.push({
        droneId,
        droneNumber,
        fromZone,
        destinationZone,
        isValid: isMoveValid,
      });
    }

    // Strict occupancy check: occupancy_after = occupancy_before - leaving + entering.
    const occupancyBefore = new Map<string, number>();
    for (const [, zone] of droneCurrentZone) {
      occupancyBefore.set(zone, (occupancyBefore.get(zone) ?? 0) + 1);
    }

    const allZonesToCheck = new Set<string>([
      ...occupancyBefore.keys(),
      ...leavingCount.keys(),
      ...enteringCount.keys(),
    ]);

    allZonesToCheck.forEach((zoneName) => {
      if (
        zoneName === parsedMap.startHub!.name ||
        zoneName === parsedMap.endHub!.name
      ) {
        return;
      }

      const zoneNode = nodeByName.get(zoneName);
      if (!zoneNode) {
        return;
      }

      const capacity = zoneNode.maxDrones ?? 1;
      const before = occupancyBefore.get(zoneName) ?? 0;
      const leaving = leavingCount.get(zoneName) ?? 0;
      const entering = enteringCount.get(zoneName) ?? 0;
      const after = before - leaving + entering;

      if (after > capacity) {
        issues.push({
          lineNumber,
          message: `Zone capacity exceeded in "${zoneName}" (max ${capacity}, would be ${after}).`,
          severity: "error",
        });
      }
    });

    // Apply intents after validation for next-turn occupancy tracking.
    for (const intent of intents) {
      const { droneId, destinationZone, isValid } = intent;
      if (!isValid) {
        continue;
      }

      if (destinationZone === parsedMap.endHub.name) {
        deliveredDrones.add(droneId);
        droneCurrentZone.delete(droneId);
      } else {
        droneCurrentZone.set(droneId, destinationZone);
      }
    }
  }

  const undelivered = Array.from(usedDrones).filter(
    (droneId) => !deliveredDrones.has(droneId),
  );
  if (undelivered.length > 0) {
    issues.push({
      lineNumber: 0,
      message: `Some drones never reached end_hub: ${undelivered.join(", ")}.`,
      severity: "warning",
    });
  }

  return issues;
}
