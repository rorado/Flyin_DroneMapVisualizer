import { DroneMovement, ParseIssue, ParsedSimulation } from "./types";

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
