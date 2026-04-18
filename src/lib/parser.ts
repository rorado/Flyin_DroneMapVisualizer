import {
  NodeRole,
  ParsedConnection,
  ParsedMap,
  ParsedNode,
  ParseIssue,
  ZoneType,
} from "./types";

const VALID_ZONES: ZoneType[] = ["normal", "restricted", "priority", "blocked"];

function parseMetadata(rawLine: string) {
  const metadata: Record<string, string> = {};
  const fragments = [...rawLine.matchAll(/\[([^\]]+)\]/g)];

  for (const fragment of fragments) {
    const body = fragment[1];
    for (const pair of body.matchAll(/([a-zA-Z_]+)\s*=\s*([^\s\]]+)/g)) {
      metadata[pair[1].toLowerCase()] = pair[2];
    }
  }

  return metadata;
}

function stripMetadata(rawLine: string) {
  return rawLine.replace(/\[[^\]]*\]/g, "").trim();
}

function parseNodeLine(
  segment: string,
  role: NodeRole,
  lineNumber: number,
  issues: ParseIssue[],
): ParsedNode | null {
  const tokens = segment.trim().split(/\s+/);

  if (tokens.length !== 3) {
    issues.push({
      lineNumber,
      severity: "error",
      message: `Bad ${role} syntax. Expected: ${role === "hub" ? "hub:" : `${role}_hub:`} name x y [metadata]`,
    });
    return null;
  }

  const [name, xText, yText] = tokens;
  const x = Number(xText);
  const y = Number(yText);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    issues.push({
      lineNumber,
      severity: "error",
      message: `Invalid coordinates for ${name}.`,
    });
    return null;
  }

  return {
    id: name,
    name,
    x,
    y,
    role,
    zone: "normal",
    metadata: {},
    lineNumber,
  };
}

function parseConnectionLine(
  segment: string,
  lineNumber: number,
  issues: ParseIssue[],
): ParsedConnection | null {
  const match = segment.match(/^([^\s-\[]+)\s*-\s*([^\s\[]+)$/);

  if (!match) {
    issues.push({
      lineNumber,
      severity: "error",
      message:
        "Bad connection syntax. Expected: connection: source-target [metadata]",
    });
    return null;
  }

  return {
    id: `${match[1]}->${match[2]}`,
    from: match[1],
    to: match[2],
    metadata: {},
    lineNumber,
  };
}

function finalizeNode(
  node: ParsedNode,
  metadata: Record<string, string>,
  issues: ParseIssue[],
) {
  node.metadata = metadata;

  if (metadata.zone) {
    const normalized = metadata.zone.toLowerCase() as ZoneType;
    if (VALID_ZONES.includes(normalized)) {
      node.zone = normalized;
    } else {
      issues.push({
        lineNumber: node.lineNumber,
        severity: "error",
        message: `Unknown zone type "${metadata.zone}" on ${node.name}.`,
      });
    }
  }

  if (metadata.color) {
    node.color = metadata.color;
  }

  if (metadata.max_drones) {
    const maxDrones = Number(metadata.max_drones);
    if (Number.isFinite(maxDrones) && maxDrones > 0) {
      node.maxDrones = maxDrones;
    }
  }
}

function finalizeConnection(
  connection: ParsedConnection,
  metadata: Record<string, string>,
  issues: ParseIssue[],
) {
  connection.metadata = metadata;

  if (metadata.max_link_capacity) {
    const capacity = Number(metadata.max_link_capacity);
    if (Number.isFinite(capacity) && capacity > 0) {
      connection.maxLinkCapacity = capacity;
    } else {
      issues.push({
        lineNumber: connection.lineNumber,
        severity: "error",
        message: `Invalid max_link_capacity on connection ${connection.from}-${connection.to}.`,
      });
    }
  }
}

export function parseDroneMap(input: string): ParsedMap {
  const issues: ParseIssue[] = [];
  const hubs: ParsedNode[] = [];
  const connections: ParsedConnection[] = [];
  const nodeByName = new Map<string, ParsedNode>();
  let startHub: ParsedNode | null = null;
  let endHub: ParsedNode | null = null;
  let nbDrones: number | null = null;

  const lines = input.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index].trim();
    const lineNumber = index + 1;

    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) {
      continue;
    }

    const metadata = parseMetadata(rawLine);
    const line = stripMetadata(rawLine);

    if (line.startsWith("nb_drones:")) {
      const value = Number(line.replace("nb_drones:", "").trim());
      if (Number.isFinite(value) && value >= 0) {
        nbDrones = value;
      } else {
        issues.push({
          lineNumber,
          severity: "error",
          message: "nb_drones must be a valid non-negative number.",
        });
      }
      continue;
    }

    if (line.startsWith("start_hub:")) {
      const node = parseNodeLine(
        line.replace("start_hub:", "").trim(),
        "start",
        lineNumber,
        issues,
      );
      if (node) {
        if (nodeByName.has(node.name)) {
          issues.push({
            lineNumber,
            severity: "error",
            message: `Duplicate hub name "${node.name}".`,
          });
        } else {
          finalizeNode(node, metadata, issues);
          startHub = node;
          nodeByName.set(node.name, node);
          hubs.push(node);
        }
      }
      continue;
    }

    if (line.startsWith("end_hub:")) {
      const node = parseNodeLine(
        line.replace("end_hub:", "").trim(),
        "goal",
        lineNumber,
        issues,
      );
      if (node) {
        if (nodeByName.has(node.name)) {
          issues.push({
            lineNumber,
            severity: "error",
            message: `Duplicate hub name "${node.name}".`,
          });
        } else {
          finalizeNode(node, metadata, issues);
          endHub = node;
          nodeByName.set(node.name, node);
          hubs.push(node);
        }
      }
      continue;
    }

    if (line.startsWith("hub:")) {
      const node = parseNodeLine(
        line.replace("hub:", "").trim(),
        "hub",
        lineNumber,
        issues,
      );
      if (node) {
        if (nodeByName.has(node.name)) {
          issues.push({
            lineNumber,
            severity: "error",
            message: `Duplicate hub name "${node.name}".`,
          });
        } else {
          finalizeNode(node, metadata, issues);
          nodeByName.set(node.name, node);
          hubs.push(node);
        }
      }
      continue;
    }

    if (line.startsWith("connection:")) {
      const connection = parseConnectionLine(
        line.replace("connection:", "").trim(),
        lineNumber,
        issues,
      );
      if (connection) {
        finalizeConnection(connection, metadata, issues);
        connections.push(connection);
      }
      continue;
    }

    issues.push({
      lineNumber,
      severity: "error",
      message: `Bad syntax on line ${lineNumber}.`,
    });
  }

  if (nbDrones === null) {
    issues.push({
      lineNumber: 0,
      severity: "error",
      message: "Missing nb_drones declaration.",
    });
  }

  if (!startHub) {
    issues.push({
      lineNumber: 0,
      severity: "error",
      message: "Missing start_hub declaration.",
    });
  }

  if (!endHub) {
    issues.push({
      lineNumber: 0,
      severity: "error",
      message: "Missing end_hub declaration.",
    });
  }

  const validConnections: ParsedConnection[] = [];

  for (const connection of connections) {
    if (connection.from === connection.to) {
      issues.push({
        lineNumber: connection.lineNumber,
        severity: "error",
        message: `Invalid connection ${connection.from}-${connection.to}. A node cannot connect to itself.`,
      });
      continue;
    }

    const fromExists = nodeByName.has(connection.from);
    const toExists = nodeByName.has(connection.to);

    if (!fromExists || !toExists) {
      issues.push({
        lineNumber: connection.lineNumber,
        severity: "error",
        message: `Invalid connection ${connection.from}-${connection.to}. Unknown endpoint${fromExists && toExists ? "" : "s"}.`,
      });
      continue;
    }

    validConnections.push(connection);
  }

  return {
    nbDrones,
    startHub,
    endHub,
    hubs,
    connections: validConnections,
    issues,
  };
}
