# Drone Map Visualizer - Quick Reference Guide

## 📊 Architecture Overview

### Data Flow Pipeline

```
User Input (Text Maps/Simulations)
    ↓
Parser Layer (validator, tokenizer)
    ↓
Type System (ParsedMap, DroneMovement)
    ↓
Main Component (state orchestrator)
    ↓
Computed Values (useMemo layer)
    ├─ validZones
    ├─ maxTurns
    ├─ computedDronePositions
    └─ pathHighlights
    ↓
Rendering (SVG Canvas)
    ├─ Grid background
    ├─ Node gradients
    ├─ Connection lines
    └─ Animated drones
    ↓
Animation Loop (RequestAnimationFrame)
    ↓
Visual Output
```

---

## 🎯 Key Features at a Glance

| Feature                | File                       | Key Function                |
| ---------------------- | -------------------------- | --------------------------- |
| **Map Parsing**        | `parser.ts`                | `parseDroneMap()`           |
| **Simulation Parsing** | `simulation-parser.ts`     | `parseSimulation()`         |
| **Geometry/Zoom**      | `geometry.ts`              | `computeViewBox()`          |
| **SVG Rendering**      | `map-canvas.tsx`           | `MapCanvas` component       |
| **Pathfinding**        | `map-visualizer-utils.ts`  | `findPathBetweenNodes()`    |
| **Animation Control**  | `drone-map-visualizer.tsx` | Animation RAF + state       |
| **UI Controls**        | `simulation-controls.tsx`  | Play/pause, frame scrubbing |
| **Input Forms**        | `simulation-input.tsx`     | Textarea with validation    |

---

## 💾 State Management Layout

### Component State (48+ vars)

```typescript
// Map management
const [draftText, setDraftText] = useState("");
const [appliedText, setAppliedText] = useState("");
const [sampleKey, setSampleKey] = useState("");

// Simulation
const [simulationInput, setSimulationInput] = useState("");
const [appliedSimulation, setAppliedSimulation] = useState("");

// Animation
const [isSimulationRunning, setIsSimulationRunning] = useState(false);
const [currentFrame, setCurrentFrame] = useState(0);
const [frameProgress, setFrameProgress] = useState(0);
const [simulationSpeed, setSimulationSpeed] = useState(1);

// Interaction
const [hoveredNode, setHoveredNode] = useState(null);
const [selectedZone, setSelectedZone] = useState(null);
const [zoom, setZoom] = useState(2.5);
const [pan, setPan] = useState({ x: 0, y: 0 });

// Drawing/Annotation
const [drawnStrokes, setDrawnStrokes] = useState([]);
const [drawingTool, setDrawingTool] = useState(null);
```

### Computed Values (memoized)

```typescript
const parsed = useMemo(() => parseDroneMap(appliedText), [appliedText])
const nodeByName = useMemo(() => new Map(...), [nodes])
const maxTurns = useMemo(() => calculateTurnCosts(...), [movements, nodeByName])
const computedDronePositions = useMemo(() => interpolatePositions(...), [...])
```

---

## 🔍 Type System Quick Reference

### Input Types

```typescript
// Map file structure
nb_drones: 3
start_hub: start 0 0 [color=green]
hub: waypoint1 1 0 [zone=restricted]
end_hub: goal 2 0 [color=red]
connection: start-waypoint1

// Simulation file structure
D1-start D2-start
D1-waypoint1 D2-waypoint1
D1-goal D2-goal
```

### Core Types Enum

```typescript
ZoneType = "normal" | "restricted" | "priority" | "blocked";
NodeRole = "start" | "goal" | "hub";
Severity = "error" | "warning";
```

### Output Structures

```typescript
ParsedMap {
  nbDrones: number
  startHub: ParsedNode
  endHub: ParsedNode
  hubs: ParsedNode[]
  connections: ParsedConnection[]
  issues: ParseIssue[]
}

DroneMovement {
  droneId: string
  path: string[]
  turns: number[]
}

DroneState {
  droneId: string
  currentZone: string
  nextZone: string
  progress: 0-1
  completed: boolean
}
```

---

## 🎮 User Interactions Map

### Keyboard Shortcuts

- **Ctrl/Cmd + Z** → Undo drawing
- **Ctrl/Cmd + Y** → Redo drawing
- **Ctrl/Cmd + R** → Reset simulation & view
- **Ctrl/Cmd + Enter** → Apply simulation (from textarea)
- **+** → Zoom in
- **-** → Zoom out
- **F** → Toggle fullscreen
- **Esc** → Deselect/exit fullscreen

### Mouse/Touch

- **Scroll wheel** → Zoom (pointer-based)
- **Drag** → Pan map
- **Click node** → Show zone details
- **Hover node** → Show tooltip
- **Hover connection** → Highlight path

---

## 🚀 Animation System

### Turn Duration Model

```
BASE_TURN_DURATION_MS = 700ms
Adjustable via simulationSpeed slider (0.01x to 5x)

For each turn:
- Travel phase (80% of turn) → visible drone movement
- Wait phase (20% of turn) → drone arrives at hub

Restricted zones cost 2 turns (doubled transit time)
Normal zones cost 1 turn
```

### Frame Computation

```typescript
// Per animation frame (RAF callback)
deltaTime = currentTime - lastFrameTime
msPerTurn = 700ms / simulationSpeed
progress = Math.min(deltaTime / msPerTurn, 1)
animationProgress = progress < 0.8 ? progress / 0.8 : 1

// Interpolation
droneX = currentZone.x + (nextZone.x - currentZone.x) * animationProgress
droneY = currentZone.y + (nextZone.y - currentZone.y) * animationProgress
```

---

## 🎨 Styling & Colors

### Zone Color Scheme

| Zone Type      | Color         | Meaning                   |
| -------------- | ------------- | ------------------------- |
| **normal**     | Sky Blue      | Standard hub              |
| **restricted** | Red/Orange    | Slower zone (2-turn cost) |
| **priority**   | Purple/Violet | Fast-access zone          |
| **blocked**    | Slate Gray    | Unreachable zone          |

### Role Colors

| Role      | Color              | Notes                 |
| --------- | ------------------ | --------------------- |
| **start** | Emerald Green      | Source/spawn location |
| **goal**  | Amber Yellow       | Destination hub       |
| **hub**   | Sky Blue (default) | Intermediate waypoint |

### Visual Effects

- **Gradients**: Per-node linear gradients (top-left to bottom-right)
- **Pulsing**: Start/goal hubs pulse gently
- **Glow**: Hover effects with shadow/blur
- **Hover cards**: Float above nodes with metadata
- **Selected zones**: Highlighted with accent border

---

## 📈 Pathfinding Algorithms

### Algorithm Selection

```typescript
// Find single shortest path
findPathBetweenNodes(from, to, connections)
→ BFS, O(V+E)
→ Returns: string[] (single path)

// Find all shortest paths
findAllShortestPathsBetweenNodes(from, to, connections)
→ BFS + parent tracking, O(V+E+P)
→ Returns: string[][] (all min-length paths)
→ Capped at 150 paths

// Find all paths (not just shortest)
findAllPathsBetweenNodes(from, to, connections, maxPaths=600)
→ DFS + visited tracking, O(V+E) per path
→ Returns: string[][] (all valid paths)
→ Capped at 600 paths

// Path visualization modes
"shortest" → Only minimum-length paths
"all" → All discovered paths
```

---

## 🧪 Validation & Error Handling

### Map Validation

```
✓ nb_drones is non-negative integer
✓ start_hub exists (exactly one)
✓ end_hub exists (exactly one)
✓ No duplicate hub names
✓ Valid coordinates (numbers)
✓ Valid zone types (4 enum options)
✓ All connections reference existing hubs
```

### Simulation Validation

```
✓ Token format matches D<num>-<zone> or D<num>-<from>-<to>
✓ All referenced zones exist in map
✓ All connections are valid
✓ No syntax errors in movement tokens
✓ Warnings for incomplete paths
```

### Issue Reporting

- Line-specific error messages
- Severity levels (error vs warning)
- Grouped display in UI
- Prevents simulation execution on errors

---

## 📦 Sample Maps Provided

### Easy (1-5 drones)

- **easy-1**: Linear path
- **easy-2**: Fork/branch
- **easy-3**: Bottleneck capacity

### Medium (5-6 drones)

- **medium-1**: Dead-end traps
- **medium-2**: Circular loop + restricted zones
- **medium-3**: Priority vs restricted optimization

### Hard (8+ drones)

- **hard-1**: Maze with dead ends
- **hard-2**: Heavy capacity constraints
- **hard-3**: Ultimate multi-constraint challenge

---

## 📊 Performance Notes

### Optimizations

- **500ms debounce** on map input
- **useMemo** for pathfinding computations
- **requestAnimationFrame** for smooth 60fps
- **Path limits** (150/600) to prevent exponential explosion
- **CSS grid layout** for responsive UI

### Known Bottlenecks

- Path recalculation on every state change (no caching)
- SVG rendering with N² connection edges
- Large graphs (100+ nodes) may lag
- No virtual scrolling for long lists

---

## 🔗 Component Dependency Tree

```
DroneMapVisualizer
├─ MapInput (textarea)
├─ SimulationInput (textarea)
├─ MapCanvas (SVG)
│  ├─ Nodes (circles with gradients)
│  ├─ Connections (lines)
│  ├─ Drones (animated circles)
│  ├─ Info cards (hover tooltips)
│  └─ Drawn strokes (user annotations)
├─ SimulationControls
│  ├─ Play/Pause button
│  ├─ Reset button
│  ├─ Speed slider
│  ├─ Frame scrubber
│  └─ Status display
├─ SummaryCards (stats)
├─ LegendCard (zone info)
└─ SummaryLines (details)
```

---

## 🛠️ Common Development Tasks

### Add a New Zone Type

1. Update `ZoneType` enum in `types.ts`
2. Add case to `getNodeGradient()` in `map-visualizer-utils.ts`
3. Add case to `getNodeAccent()` for hover color
4. Update validation in `finalizeNode()` in `parser.ts`
5. Update legend in `map-side-panels.tsx`

### Modify Turn Duration

1. Change `BASE_TURN_DURATION_MS` constant
2. Adjust `TURN_TRAVEL_RATIO` for travel vs wait phase
3. Test animation loop timing

### Add New Sample Map

1. Add entry to `SAMPLE_MAPS` in `samples.ts`
2. Add to `SAMPLE_OPTIONS` for UI dropdown
3. Create category in `SAMPLE_CATEGORIES`

### Change Color Scheme

1. Gradients: `getNodeGradient()` in utils
2. Accents: `getNodeAccent()` in utils
3. Tailwind: Update `globals.css` and component classes

---

## 📚 File Size & Scope

| File                       | LOC   | Purpose               |
| -------------------------- | ----- | --------------------- |
| `drone-map-visualizer.tsx` | ~1500 | Main orchestrator     |
| `map-canvas.tsx`           | ~800  | SVG rendering         |
| `parser.ts`                | ~300  | Map parsing logic     |
| `simulation-parser.ts`     | ~350  | Simulation parsing    |
| `map-visualizer-utils.ts`  | ~300  | Pathfinding + styling |
| `samples.ts`               | ~400  | Sample data           |
| `types.ts`                 | ~60   | Type definitions      |
| `geometry.ts`              | ~30   | Viewbox calculation   |

**Total: ~3,700 LOC (excluding deps)**

---

## 🎓 Educational Concepts Taught

1. **Graph Theory**
   - Nodes vs edges
   - Undirected connections
   - Path enumeration

2. **Algorithms**
   - BFS (breadth-first search)
   - DFS (depth-first search)
   - Graph traversal patterns

3. **Scheduling**
   - Turn-based systems
   - Duration modeling
   - Constraint satisfaction

4. **UI/UX**
   - Real-time validation
   - Interactive visualization
   - Responsive design
   - Undo/redo patterns

5. **Software Engineering**
   - Type safety (TypeScript)
   - Component composition
   - State management
   - Performance optimization

---

**Last Updated**: May 10, 2026  
**Tool**: Flyin - Drone Map Visualizer  
**Target Audience**: 42 Network Students
