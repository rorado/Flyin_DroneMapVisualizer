import {
  DroneMovement,
  ParsedConnection,
  ParsedNode,
  ParseIssue,
  ParsedMap,
  ParsedSimulation,
} from "./types";

function getConnectionKey(a: string, b: string) {
  return `${a}__${b}`;
}

function buildConnectionSet(connections: ParsedConnection[]) {
  const connectionSet = new Set<string>();
  for (const connection of connections) {
    connectionSet.add(getConnectionKey(connection.from, connection.to));
    connectionSet.add(getConnectionKey(connection.to, connection.from));
  }
  return connectionSet;
}

function resolveDestinationFromToken(
  tokenTarget: string,
  droneId: string,
  currentZone: string,
  validZones: Set<string> | undefined,
  connectionSet: Set<string> | null,
): { destinationZone: string | null; issueMessage: string | null } {
  if (validZones?.has(tokenTarget)) {
    return { destinationZone: tokenTarget, issueMessage: null };
  }

  if (!connectionSet || !tokenTarget.includes("-")) {
    return { destinationZone: tokenTarget, issueMessage: null };
  }

  const [leftZone, rightZone, ...rest] = tokenTarget.split("-");
  if (rest.length > 0 || !leftZone || !rightZone) {
    return {
      destinationZone: null,
      issueMessage: `Invalid connection reference "${tokenTarget}". Expected: zoneA-zoneB (e.g., start-junction).`,
    };
  }

  if (
    !connectionSet.has(getConnectionKey(leftZone, rightZone)) &&
    !connectionSet.has(getConnectionKey(rightZone, leftZone))
  ) {
    return {
      destinationZone: null,
      issueMessage: `Connection "${tokenTarget}" does not exist in the current map.`,
    };
  }

  if (currentZone === leftZone) {
    return { destinationZone: rightZone, issueMessage: null };
  }

  if (currentZone === rightZone) {
    return { destinationZone: leftZone, issueMessage: null };
  }

  return {
    destinationZone: null,
    issueMessage: `${droneId} is at "${currentZone}" and cannot use connection "${tokenTarget}".`,
  };
}

export function parseSimulation(
  input: string,
  validZones?: Set<string>,
  parsedMap?: ParsedMap,
): ParsedSimulation {
  const issues: ParseIssue[] = [];
  const dronePaths: Map<string, string[]> = new Map();
  const droneTurns: Map<string, number[]> = new Map();
  const droneCurrentZone = new Map<string, string>();
  const lines = input.split(/\r?\n/);
  const mentionedZones = new Set<string>();
  let parsedTurnNumber = 0;
  const connectionSet = parsedMap
    ? buildConnectionSet(parsedMap.connections)
    : null;
  const startZoneName = parsedMap?.startHub?.name;
  const nodeByName = new Map<string, ParsedNode>();
  parsedMap?.hubs.forEach((node) => nodeByName.set(node.name, node));
  if (parsedMap?.startHub) {
    nodeByName.set(parsedMap.startHub.name, parsedMap.startHub);
  }
  if (parsedMap?.endHub) {
    nodeByName.set(parsedMap.endHub.name, parsedMap.endHub);
  }
  const lastConnectionByDrone = new Map<string, string>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    const lineNumber = lineIndex + 1;

    // Skip empty lines and comments
    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) {
      continue;
    }

    parsedTurnNumber += 1;
    const turnNumber = parsedTurnNumber;

    // Each line contains movements for that frame
    // Parse tokens from left to right
    const movementTokens = rawLine.split(/\s+/);

    for (const token of movementTokens) {
      // Match pattern: D<number>-<zone_name_or_connection>
      const match = token.match(/^D(\d+)-(.+)$/);
      if (!match) {
        issues.push({
          lineNumber,
          message:
            `Invalid movement format "${token}". Expected: D<number>-<zone_name> or D<number>-<from_zone>-<to_zone> ` +
            `(e.g., D1-junction or D1-start-junction)`,
          severity: "error",
        });
        continue;
      }

      const droneId = `D${match[1]}`;
      const tokenTarget = match[2];
      const currentZone = droneCurrentZone.get(droneId) ?? startZoneName ?? "";

      const previousConnection = lastConnectionByDrone.get(droneId);
      let destinationFromStickyConnection: string | null = null;
      if (tokenTarget.includes("-") && previousConnection === tokenTarget) {
        const [leftZone, rightZone, ...rest] = tokenTarget.split("-");
        if (
          rest.length === 0 &&
          (leftZone === currentZone || rightZone === currentZone)
        ) {
          const currentNode = nodeByName.get(currentZone);
          if (currentNode?.zone === "restricted") {
            // Subject rule: repeated connection token means still in flight
            // toward a restricted zone, so keep destination at the same zone.
            destinationFromStickyConnection = currentZone;
          }
        }
      }

      const { destinationZone, issueMessage } = destinationFromStickyConnection
        ? {
            destinationZone: destinationFromStickyConnection,
            issueMessage: null,
          }
        : resolveDestinationFromToken(
            tokenTarget,
            droneId,
            currentZone,
            validZones,
            connectionSet,
          );

      if (issueMessage) {
        issues.push({
          lineNumber,
          message: issueMessage,
          severity: "error",
        });
        continue;
      }

      if (!destinationZone) {
        continue;
      }

      if (tokenTarget.includes("-")) {
        lastConnectionByDrone.set(droneId, tokenTarget);
      } else {
        lastConnectionByDrone.delete(droneId);
      }

      mentionedZones.add(destinationZone);

      // Initialize drone path if it doesn't exist
      if (!dronePaths.has(droneId)) {
        dronePaths.set(droneId, []);
      }
      if (!droneTurns.has(droneId)) {
        droneTurns.set(droneId, []);
      }

      // Add the zone to this drone's path
      dronePaths.get(droneId)!.push(destinationZone);
      droneTurns.get(droneId)!.push(turnNumber);
      droneCurrentZone.set(droneId, destinationZone);
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
      turns: droneTurns.get(droneId) ?? [],
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

    // If max_link_capacity is not provided, allow unlimited drones on that edge.
    const cap = conn.maxLinkCapacity ?? Number.POSITIVE_INFINITY;
    connectionCapByEdge.set(`${conn.from}__${conn.to}`, cap);
    connectionCapByEdge.set(`${conn.to}__${conn.from}`, cap);
  }
  const connectionSet = buildConnectionSet(parsedMap.connections);

  const lines = input.split(/\r?\n/);
  // Tracks only active (not yet delivered) drones and their current zone.
  const droneCurrentZone = new Map<string, string>();
  const deliveredDrones = new Set<string>();
  const usedDrones = new Set<string>();
  const lastConnectionByDrone = new Map<string, string>();

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
      const tokenTarget = match[2];
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

      const fromZone = droneCurrentZone.get(droneId) ?? parsedMap.startHub.name;
      const previousConnection = lastConnectionByDrone.get(droneId);
      let destinationFromStickyConnection: string | null = null;
      if (tokenTarget.includes("-") && previousConnection === tokenTarget) {
        const [leftZone, rightZone, ...rest] = tokenTarget.split("-");
        if (
          rest.length === 0 &&
          (leftZone === fromZone || rightZone === fromZone)
        ) {
          const currentNode = nodeByName.get(fromZone);
          if (currentNode?.zone === "restricted") {
            destinationFromStickyConnection = fromZone;
          }
        }
      }

      const resolved = destinationFromStickyConnection
        ? {
            destinationZone: destinationFromStickyConnection,
            issueMessage: null,
          }
        : resolveDestinationFromToken(
            tokenTarget,
            droneId,
            fromZone,
            nodeByName.size > 0 ? new Set(nodeByName.keys()) : undefined,
            connectionSet,
          );

      if (resolved.issueMessage || !resolved.destinationZone) {
        issues.push({
          lineNumber,
          message:
            resolved.issueMessage ??
            `${droneId} has an invalid movement target "${tokenTarget}".`,
          severity: "error",
        });
        continue;
      }

      const destinationZone = resolved.destinationZone;

      if (tokenTarget.includes("-")) {
        lastConnectionByDrone.set(droneId, tokenTarget);
      } else {
        lastConnectionByDrone.delete(droneId);
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
      const isHoldTurn = fromZone === destinationZone;

      if (isHoldTurn) {
        // Allow explicit hold turns only in restricted zones.
        if (destinationNode.zone !== "restricted") {
          issues.push({
            lineNumber,
            message: `${droneId} hold turn in "${destinationZone}" is only allowed for restricted zones.`,
            severity: "error",
          });
          isMoveValid = false;
        }
      } else {
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
        const edgeCap =
          connectionCapByEdge.get(edgeKey) ?? Number.POSITIVE_INFINITY;
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
      }

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

      // If max_drones is not specified, restricted zones are treated as unbounded.
      // Other non-terminal zones keep a default capacity of 1.
      const capacity =
        zoneNode.maxDrones ??
        (zoneNode.zone === "restricted" ? Number.POSITIVE_INFINITY : 1);
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
