# Drone Map Visualizer - Comprehensive Codebase Summary

## Project Overview

**Flyin** is an interactive drone map visualization tool built for the 42 Network's educational purposes. It allows students to:

- Define drone delivery networks using a text-based map configuration format
- Visualize multi-hub networks with zones and capacity constraints
- Simulate drone movements across the network with real-time animation
- Analyze pathfinding and routing logic through interactive exploration

**Tech Stack:**

- **Framework**: Next.js 15.3 (App Router, Server/Client components)
- **Language**: TypeScript 5.8
- **UI**: React 19, Tailwind CSS 3.4
- **Animation**: Framer Motion 12.23
- **Icons**: Lucide React 1.8
- **Rendering**: Client-side SVG with custom geometry
- **Analytics**: Vercel Analytics

---

## Architecture & Data Flow

```
User Input (Text)
    ↓
[Parser] → validates syntax & metadata
    ↓
[Type System] → ParsedMap, DroneMovement structures
    ↓
[Main Component] (DroneMapVisualizer)
    ├─→ [Map Canvas] (SVG rendering)
    ├─→ [Simulation Controls] (playback UI)
    ├─→ [Input Panels] (map & simulation editors)
    └─→ [Side Panels] (legend, summary, stats)
    ↓
[Animation Loop] → RequestAnimationFrame
    ↓
[Drone Position Computer] → Interpolates drone locations
    ↓
[Visual Output] → SVG with positioned drones
```

---

## Core Data Structures

### **1. Map Types** (`src/lib/types.ts`)

#### `ParsedNode`

```typescript
{
  id: string;
  name: string;
  x: number;                    // X coordinate
  y: number;                    // Y coordinate
  role: "start" | "goal" | "hub";
  zone: "normal" | "restricted" | "priority" | "blocked";
  color?: string;               // Custom color override
  maxDrones?: number;           // Capacity limit
  metadata: Record<string, string>;
  lineNumber: number;           // For error reporting
}
```

**Zone Types:**

- **normal**: Standard hub, 1-turn transit time
- **restricted**: Slower hub, 2-turn transit time (double cost)
- **priority**: Fast-access hub (visual distinction)
- **blocked**: Non-traversable hub

#### `ParsedConnection`

```typescript
{
  id: string;
  from: string;                // Source hub name
  to: string;                  // Target hub name
  maxLinkCapacity?: number;     // Optional capacity constraint
  metadata: Record<string, string>;
  lineNumber: number;
}
```

#### `ParsedMap`

```typescript
{
  nbDrones: number;             // Total drones in scenario
  startHub: ParsedNode | null;
  endHub: ParsedNode | null;
  hubs: ParsedNode[];
  connections: ParsedConnection[];
  issues: ParseIssue[];         // Validation errors/warnings
}
```

### **2. Simulation Types**

#### `DroneMovement`

```typescript
{
  droneId: string;              // e.g., "D1", "D2"
  path: string[];               // Ordered hub names
  turns?: number[];             // Turn number for each step
}
```

#### `DroneState` (per animation frame)

```typescript
{
  droneId: string;
  currentZone: string;
  nextZone: string | null;
  progress: number; // 0 to 1 (interpolation)
  completed: boolean; // Reached end_hub
  pathIndex: number;
}
```

---

## Parser Logic

### **Map Parser** (`src/lib/parser.ts`)

**Input Format:**

```
nb_drones: 3
start_hub: start 0 0 [color=green max_drones=3]
hub: waypoint1 1 0 [zone=restricted]
h: waypoint2 2 0 [color=blue max_drones=2]
end_hub: goal 3 0 [color=red]
connection: start-waypoint1
connection: waypoint1-waypoint2
connection: waypoint2-goal
```

**Parsing Steps:**

1. **Line-by-line tokenization** with comment support (`#`, `//`)
2. **Metadata extraction** from `[key=value]` brackets
3. **Declaration handling**:
   - `nb_drones: <number>` → sets drone count
   - `start_hub: <name> <x> <y>` → single start point
   - `end_hub: <name> <x> <y>` → single goal point
   - `hub: <name> <x> <y>` → intermediate nodes
   - `connection: <source>-<target>` → undirected links
4. **Metadata finalization**:
   - Zone validation (must be valid type)
   - Color parsing (any hex/named color)
   - Capacity parsing (positive integers)
5. **Validation**:
   - Detects duplicate hub names
   - Validates coordinates as numbers
   - Reports missing required fields
   - Issues collection with severity levels

**Key Functions:**

- `parseMetadata()` → extracts `[key=value]` pairs
- `stripMetadata()` → removes metadata from line
- `parseNodeLine()` → tokenizes node declarations
- `parseConnectionLine()` → extracts connection pairs
- `finalizeNode()` → applies metadata to node object
- `parseDroneMap()` → main entry point

---

### **Simulation Parser** (`src/lib/simulation-parser.ts`)

**Input Format:**

```
D1-start D2-start
D1-waypoint1 D2-waypoint1
D1-waypoint2 D2-waypoint2
D1-goal D2-goal
```

**Parsing Logic:**

1. **Token parsing**: Each line is a frame/turn
2. **Token format**: `D<number>-<destination>` or `D<number>-<from>-<to>`
3. **Destination resolution**:
   - Direct zone reference: `D1-waypoint` (jump directly)
   - Connection reference: `D1-start-waypoint` (traverse edge)
4. **Turn number tracking**: Each line increments a global turn counter
5. **State machine**:
   - Tracks current zone per drone
   - Validates connection existence
   - Handles "sticky connection" rule for restricted zones
6. **Validation**:
   - Zone existence check
   - Connection validity
   - Invalid movement format detection

**Key Functions:**

- `resolveDestinationFromToken()` → parses movement tokens
- `buildConnectionSet()` → creates undirected graph
- `parseSimulation()` → main entry point
- `validateSimulationAgainstMap()` → post-parse validation
- `getMaxPathLength()` → computes maximum simulation length

---

## Rendering Architecture

### **Geometry & Viewbox** (`src/lib/geometry.ts`)

#### `computeViewBox(nodes, paddingRatio)`

- Calculates bounding box from node positions
- Adds 30% padding around edges
- Ensures minimum 20×20 unit viewbox

**Used for:**

- SVG `viewBox` attribute
- Pan/zoom boundary calculations
- Responsive coordinate scaling

---

### **SVG Rendering** (`src/components/map-canvas.tsx`)

**Layers (in render order):**

1. **Grid Background**
   - Pattern fill for scale reference
   - CSS color `rgba(148,163,184,0.12)` with 0.03 stroke width

2. **Gradients (defs)**
   - Global background glow gradient
   - Per-node color gradients (computed from role/zone)

3. **Connections (links)**
   - SVG line elements between nodes
   - Stroke color varies by metadata (capacity indicators)
   - Hover states highlight path connectivity

4. **Nodes (hubs)**
   - SVG circle elements with gradient fills
   - Size varies by zone (0.9 to 1.3 units radius)
   - Role indicators:
     - **Start hub**: Green pulse, large
     - **Goal hub**: Gold/yellow glow, large
     - **Restricted**: Smaller, dashed warning stroke
     - **Priority**: Star badge overlay
     - **Blocked**: X overlay pattern

5. **Node Info Cards**
   - Hover tooltip showing hub details
   - Dynamically positioned (above/below node)
   - Displays name, coordinates, capacity, zone type

6. **Drawn Strokes** (optional)
   - User-drawn annotations (pen/eraser tool)
   - Rendered as polylines

7. **Drone Animations**
   - Animated circles representing drones
   - Position interpolated between current and next zone
   - Color differentiates drone states

---

### **Main Component** (`src/components/drone-map-visualizer.tsx`)

**State Management (48+ state variables):**

- `draftText` / `appliedText` → map source code
- `simulationInput` / `appliedSimulation` → simulation source code
- `zoom` / `pan` → view transformation
- `isSimulationRunning` / `currentFrame` / `frameProgress` → animation
- `hoveredNode` / `selectedZone` → interaction state
- `drawnStrokes` / `undoneStrokes` → annotation drawing

**Key Computed Values (useMemo):**

1. **`parsed`** → parseDroneMap(appliedText)
2. **`validZones`** → Set of all hub names
3. **`liveParsedSimulation`** → Real-time parse of simulation editor
4. **`appliedParsedSimulation`** → Validated applied simulation
5. **`nodeByName`** → Map<string, ParsedNode> for lookups
6. **`viewBox`** → Bounding box + padding
7. **`interactiveViewBox`** → Adjusted for zoom/pan
8. **`maxTurns`** → Calculate finish time accounting for zone costs
9. **`computedDronePositions`** → Per-frame drone position + interpolation

**Key Functions:**

| Function                          | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `handleMapWheel()`                | Zoom with pointer-based origin     |
| `handleMapPointerDown/Move/End()` | Pan gesture with capture           |
| `handleDrawingStart/Move/End()`   | Pen/eraser annotation drawing      |
| `handleNodeClick()`               | Toggle zone detail panel           |
| `handleApplySimulation()`         | Compile simulation & start frame 0 |
| `handlePlayPauseSimulation()`     | Toggle animation loop              |
| `handleFrameChange()`             | Manual frame scrubbing             |
| `handleGenerateSimulationCode()`  | Auto-generate path schedule        |
| `handleCopyJson()`                | Export parsed map as JSON          |
| `handleDownloadPng()`             | Render SVG to PNG via canvas       |

---

## Animation & Simulation Playback

### **Frame-Based Animation Loop**

**Time Model:**

```
BASE_TURN_DURATION_MS = 700ms (adjustable via simulationSpeed)
TURN_TRAVEL_RATIO = 0.8 (80% of turn is visible travel)
```

**Frame Computation:**

1. Each turn = one line of simulation input
2. Restricted zones cost 2 turns (double transit time)
3. Normal zones cost 1 turn
4. Animation interpolates between zones smoothly

**RequestAnimationFrame Logic:**

```typescript
1. Calculate deltaTime since last frame
2. Compute msPerTurn = 700ms / simulationSpeed
3. Calculate progress ratio (0 to 1) within turn
4. At turn completion (deltaTime >= msPerTurn):
   - Increment frame counter
   - Check if simulation complete
   - Reset timing reference
```

### **Drone Position Computer**

For each drone's path segment:

```
If moveTurn > currentFrame:
  → drone hasn't started this leg, stay at previous zone

If moveTurn === currentFrame (during animation):
  → interpolate between current and next zone
  → progress = frameProgress * zone.travelCost

If moveTurn < currentFrame:
  → drone has completed this leg, snap to destination
```

**Interpolation:**

```
x = currentZone.x + (nextZone.x - currentZone.x) * progress
y = currentZone.y + (nextZone.y - currentZone.y) * progress
```

---

## Pathfinding Algorithms

### **`findPathBetweenNodes(from, to, connections)`**

- **Algorithm**: BFS (Breadth-First Search)
- **Returns**: Single shortest path: `string[]`
- **Use case**: Auto-generate simple simulation paths

### **`findAllShortestPathsBetweenNodes(from, to, connections)`**

- **Algorithm**: BFS with parent tracking
- **Returns**: All paths with minimum length: `string[][]`
- **Optimizations**: Limits to 150 paths to prevent exponential blow-up

### **`findAllPathsBetweenNodes(from, to, connections, maxPaths=600)`**

- **Algorithm**: DFS with cycle prevention
- **Returns**: All valid paths (not just shortest): `string[][]`
- **Optimizations**:
  - Visited set prevents re-traversal
  - Max depth = graph size (prevents infinite loops)
  - Limits to 600 paths

**Visualization Modes:**

- **"shortest"** → Only minimum-length paths highlighted
- **"all"** → All discovered paths shown

---

## Features & Capabilities

### **Map Editor**

✅ Live parsing with 500ms debounce  
✅ Syntax validation with line-specific errors  
✅ Metadata support (`[key=value]` format)  
✅ Zone type validation (4 types)  
✅ Duplicate detection  
✅ Real-time issue reporting (errors + warnings)

### **Simulation Editor**

✅ Token-based format (`D<num>-<zone>`)  
✅ Connection reference format (`D<num>-from-to`)  
✅ Turn-by-turn scheduling  
✅ Real-time validation against map  
✅ Visual error highlighting with line numbers

### **Interactive Visualization**

✅ Pan (drag) with smooth clamping  
✅ Zoom (mouse wheel) with pointer-based scaling  
✅ Node hover tooltips with metadata  
✅ Zone selection for detailed info  
✅ Path highlighting (shortest/all modes)  
✅ Connection highlighting on hover

### **Simulation Playback**

✅ Play/Pause controls  
✅ Frame-by-frame stepping  
✅ Adjustable simulation speed (0.01x to 5x)  
✅ Real-time drone position interpolation  
✅ Completion detection with auto-clear  
✅ Current frame/turn display

### **Annotation Tools**

✅ Pen drawing on canvas (custom color + brush size)  
✅ Eraser tool  
✅ Undo/Redo (Ctrl+Z, Ctrl+Y)  
✅ Clear all annotations

### **Export & Download**

✅ Copy map as JSON  
✅ Download visualization as PNG (2x resolution)  
✅ Generate simulation code (auto-path with stagger)

### **Keyboard Shortcuts**

| Key        | Action                           |
| ---------- | -------------------------------- |
| Ctrl+Z     | Undo drawing                     |
| Ctrl+Y     | Redo drawing                     |
| Ctrl+R     | Reset simulation & view          |
| Ctrl+Enter | Apply simulation (from textarea) |
| +/-        | Zoom in/out                      |
| F          | Toggle fullscreen                |
| Esc        | Deselect zones / exit fullscreen |

---

## Sample Maps

### **Easy Maps** (1-5 drones, simple layouts)

- **easy-1**: Linear path (start→waypoint1→waypoint2→goal)
- **easy-2**: Fork (two path branches with junction)
- **easy-3**: Bottleneck (capacity constraints: start(4)→bottleneck(2)→goal)

### **Medium Maps** (5-6 drones, complex constraints)

- **medium-1**: Dead-end trap (junction with wrong path/correct path)
- **medium-2**: Circular loop with restricted zones (zone=restricted zone costs 2 turns)
- **medium-3**: Priority vs. restricted paths (optimization challenge)

### **Hard Maps** (8+ drones)

- **hard-1**: Maze with multiple dead ends and loops
- **hard-2**: Complex scheduling with heavy capacity constraints
- **hard-3**: Ultimate challenge with mixed zone types

---

## Current Limitations

1. **Pathfinding**
   - No dijkstra/weighted pathfinding (all edges have unit weight)
   - Path limit caps at 600 to prevent exponential explosion
   - No cycle-aware optimal routing

2. **Simulation**
   - Linear turn scheduling (no concurrent multi-turn moves)
   - No deadlock detection or scheduling optimization
   - No constraint validation beyond basic connectivity

3. **Rendering**
   - No 3D visualization
   - No animation easing (linear interpolation only)
   - Limited to SVG (no canvas for complex effects)
   - Node layouts are manual (no force-directed layout algorithm)

4. **Metadata**
   - Limited metadata keys (color, zone, max_drones, max_link_capacity)
   - No custom metadata extensions
   - No serialization to/from database

5. **Performance**
   - Recomputes all paths on every state change
   - No memoization of path results
   - Large graphs (100+ nodes) may have rendering lag

---

## Component Hierarchy

```
DroneMapVisualizer (main)
├── Header
│   └── SummaryCards (Drones, Hubs, Links)
├── Main Section
│   ├── Left Panel
│   │   ├── MapInput (textarea editor)
│   │   ├── SimulationInput (textarea editor)
│   │   └── ActionButtons (Copy JSON, Download PNG, Generate Simulation)
│   ├── Center Panel
│   │   └── MapCanvas (SVG with nodes, connections, drones)
│   └── Right Panel
│       ├── SimulationControls (Play/Pause, Speed, Frame slider)
│       ├── Legend Cards
│       └── Summary Lines (zone info, drone count)
└── Footer
    └── Attribution
```

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx          (Root layout with metadata)
│   ├── page.tsx            (Route handler)
│   └── globals.css         (Tailwind styles)
├── lib/
│   ├── types.ts            (Core interfaces)
│   ├── parser.ts           (Map parsing)
│   ├── simulation-parser.ts (Simulation parsing)
│   ├── geometry.ts         (Viewbox calculation)
│   └── samples.ts          (Sample maps)
└── components/
    ├── drone-map-visualizer.tsx     (Main orchestrator ~1500 LOC)
    ├── map-canvas.tsx               (SVG rendering)
    ├── map-visualizer-utils.ts      (Pathfinding, node styling)
    ├── simulation-controls.tsx      (Playback UI)
    ├── simulation-input.tsx         (Simulation editor)
    └── map-side-panels.tsx          (Legend, summary cards)
```

---

## Key Algorithms Summary

| Algorithm           | Location                             | Complexity      | Purpose                   |
| ------------------- | ------------------------------------ | --------------- | ------------------------- |
| BFS                 | `findPathBetweenNodes()`             | O(V+E)          | Single shortest path      |
| BFS+Backtrack       | `findAllShortestPathsBetweenNodes()` | O(V+E+P)        | All shortest paths        |
| DFS+Visited         | `findAllPathsBetweenNodes()`         | O(V+E) per path | All paths with limit      |
| Viewbox Computation | `computeViewBox()`                   | O(V)            | Bounding box with padding |
| Interpolation       | `computedDronePositions`             | O(D\*P)         | Per-frame drone positions |
| Clamping            | `clampPan()`                         | O(1)            | Pan boundary enforcement  |

---

## Data Flow Example

**User enters simulation:**

```
D1-start D2-start
D1-waypoint1 D2-waypoint1
D1-goal D2-goal
```

**Processing:**

1. **Parser** tokenizes into DroneMovement objects:

   ```
   {droneId: "D1", path: ["start", "waypoint1", "goal"], turns: [1,2,3]}
   {droneId: "D2", path: ["start", "waypoint1", "goal"], turns: [1,2,3]}
   ```

2. **Validator** checks:
   - All zones exist in map ✓
   - All connections are valid ✓
   - No syntax errors ✓

3. **Animation Loop** (per frame):

   ```
   maxTurns = 3 + zone_costs = 4 turns
   On frame 1: D1 at waypoint1, D2 at start (progress=0.5)
   On frame 2: D1 at goal, D2 at waypoint1
   On frame 3: D1 completed, D2 at goal → both completed
   Triggers auto-clear 3s later
   ```

4. **Rendering**:
   - `computedDronePositions` calculates x,y for each drone
   - Interpolation smooths movement
   - Canvas updates via React state

---

## Performance Considerations

**Optimizations:**

- **useMemo** for expensive computations (parsing, pathfinding, position calculations)
- **requestAnimationFrame** for smooth 60fps animation
- **500ms debounce** on map input to throttle parsing
- **maxPaths limits** (150/600) to prevent exponential pathfinding

**Bottlenecks:**

- Path recalculation on every map change (no caching)
- Large node counts cause N² connection rendering
- SVG doesn't use virtual scrolling

---

## Educational Value

This tool is designed for 42 Network students to:

1. **Visualize graph structures** (nodes as hubs, edges as connections)
2. **Understand pathfinding** (BFS, shortest paths, multiple routes)
3. **Learn scheduling** (drone movement planning, turn-based systems)
4. **Practice debugging** (error messages, validation feedback)
5. **Explore optimization** (capacity constraints, zone costs, trade-offs)

---

## Summary

The **Drone Map Visualizer** is a well-architected, educational interactive tool that combines:

- **Robust parsing** with clear error reporting
- **Real-time rendering** using SVG and canvas
- **Smooth animation** via request animation frame
- **Graph algorithms** for pathfinding and navigation
- **Intuitive UI** with keyboard shortcuts and tooltips
- **Export capabilities** for documentation and sharing

Its modular design, strong typing, and educational focus make it an excellent learning platform for graph visualization and drone routing concepts.
