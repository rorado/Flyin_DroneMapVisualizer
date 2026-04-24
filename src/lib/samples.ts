export const SAMPLE_MAPS = {
  "easy-1": `# Easy Level 1: Simple linear path
nb_drones: 2

start_hub: start 0 0 [color=green]
hub: waypoint1 1 0 [color=blue]
hub: waypoint2 2 0 [color=blue]
end_hub: goal 3 0 [color=red]

connection: start-waypoint1
connection: waypoint1-waypoint2
connection: waypoint2-goal`,

  "easy-2": `# Easy Level 2: Simple fork with two paths
nb_drones: 3

start_hub: start 0 0 [color=green]
hub: junction 1 0 [color=yellow max_drones=2]
hub: path_a 2 1 [color=blue]
hub: path_b 2 -1 [color=blue]
end_hub: goal 3 0 [color=red max_drones=3]

connection: start-junction
connection: junction-path_a
connection: junction-path_b
connection: path_a-goal
connection: path_b-goal`,

  "easy-3": `# Easy Level 3: Basic capacity management
nb_drones: 4

start_hub: start 0 0 [color=green max_drones=4]
hub: bottleneck 1 0 [color=orange max_drones=2]
hub: wide_area 2 0 [color=blue max_drones=3]
end_hub: goal 3 0 [color=red max_drones=4]

connection: start-bottleneck
connection: bottleneck-wide_area
connection: wide_area-goal`,

  "medium-1": `# Medium Level 1: Dead end trap - drones might get stuck
nb_drones: 5

start_hub: start 0 0 [color=green max_drones=5]
hub: junction 1 0 [color=yellow]
hub: dead_end 1 1 [color=red]
hub: correct_path 2 0 [color=blue]
hub: intermediate 3 0 [color=blue]
end_hub: goal 4 0 [color=green max_drones=5]

connection: start-junction
connection: junction-dead_end
connection: junction-correct_path
connection: correct_path-intermediate
connection: intermediate-goal`,

  "medium-2": `# Medium Level 2: Circular loop with restricted zones
nb_drones: 6

start_hub: start 0 0 [color=green max_drones=6]
hub: loop_a 1 0 [zone=restricted color=orange]
hub: loop_b 2 0 [zone=restricted color=orange]
hub: loop_c 2 1 [zone=restricted color=orange]
hub: loop_d 1 1 [zone=restricted color=orange]
hub: exit_point 3 0 [color=blue]
end_hub: goal 4 0 [color=red max_drones=6]

connection: start-loop_a
connection: loop_a-loop_b
connection: loop_b-loop_c
connection: loop_c-loop_d
connection: loop_d-loop_a
connection: loop_b-exit_point
connection: exit_point-goal`,

  "medium-3": `# Medium Level 3: Priority zones create optimal path challenges
nb_drones: 4

start_hub: start 0 0 [color=green max_drones=4]
hub: slow_path1 1 -1 [zone=restricted color=red]
hub: slow_path2 2 -1 [zone=restricted color=red]
hub: slow_path3 3 -1 [zone=restricted color=red]
hub: fast_junction 1 0 [zone=priority color=blue max_drones=2]
hub: fast_path 2 0 [zone=priority color=blue]
hub: merge_point 3 0 [color=yellow max_drones=3]
end_hub: goal 4 0 [color=green max_drones=4]

connection: start-slow_path1
connection: start-fast_junction
connection: slow_path1-slow_path2
connection: slow_path2-slow_path3
connection: slow_path3-merge_point
connection: fast_junction-fast_path
connection: fast_path-merge_point
connection: merge_point-goal`,

  "hard-1": `# Hard Level 1: Complex maze with multiple dead ends and loops
nb_drones: 8

start_hub: start 0 0 [color=green max_drones=8]
hub: maze_a1 1 0 [color=blue]
hub: maze_a2 2 0 [color=blue]
hub: maze_b1 1 1 [color=blue]
hub: maze_b2 2 1 [color=blue]
hub: maze_c1 1 2 [color=blue]
hub: maze_c2 2 2 [color=blue]
hub: dead_end1 0 1 [color=red]
hub: dead_end2 0 2 [color=red]
hub: dead_end3 3 1 [color=red]
hub: trap_loop1 3 0 [zone=restricted color=orange]
hub: trap_loop2 3 2 [zone=restricted color=orange]
hub: bottleneck 4 1 [color=yellow max_drones=2]
hub: final_stretch1 5 0 [zone=priority color=cyan]
hub: final_stretch2 5 1 [zone=priority color=cyan]
hub: final_stretch3 5 2 [zone=priority color=cyan]
end_hub: goal 6 1 [color=green max_drones=8]

# Main path connections
connection: start-maze_a1
connection: maze_a1-maze_a2
connection: maze_a1-maze_b1
connection: maze_b1-maze_b2
connection: maze_b2-maze_c2
connection: maze_c2-bottleneck

# Dead end traps
connection: start-dead_end1
connection: dead_end1-dead_end2
connection: maze_a2-dead_end3

# Trap loops
connection: maze_a2-trap_loop1
connection: trap_loop1-trap_loop2
connection: trap_loop2-maze_c2

# Alternative paths
connection: maze_b1-maze_c1
connection: maze_c1-maze_c2

# Final stretch
connection: bottleneck-final_stretch1
connection: bottleneck-final_stretch2
connection: bottleneck-final_stretch3
connection: final_stretch1-goal
connection: final_stretch2-goal
connection: final_stretch3-goal`,

  "hard-2": `# Hard Level 2: Extreme capacity constraints with timing challenges
nb_drones: 12

start_hub: start 0 0 [color=green max_drones=12]
hub: gate1 1 0 [color=orange max_drones=1]
hub: gate2 2 0 [color=orange max_drones=1]
hub: gate3 3 0 [color=orange max_drones=1]
hub: waiting_area1 1 1 [color=blue max_drones=4]
hub: waiting_area2 2 1 [color=blue max_drones=4]
hub: waiting_area3 3 1 [color=blue max_drones=4]
hub: restricted_tunnel1 4 0 [zone=restricted color=red max_drones=2]
hub: restricted_tunnel2 5 0 [zone=restricted color=red max_drones=2]
hub: restricted_tunnel3 6 0 [zone=restricted color=red max_drones=2]
hub: priority_bypass1 4 1 [zone=priority color=cyan max_drones=3]
hub: priority_bypass2 5 1 [zone=priority color=cyan max_drones=3]
hub: convergence 7 0 [color=yellow max_drones=6]
hub: final_bottleneck 8 0 [color=orange max_drones=3]
end_hub: goal 9 0 [color=green max_drones=12]

# Sequential gates (major bottleneck)
connection: start-gate1 [max_link_capacity=1]
connection: gate1-gate2 [max_link_capacity=1]
connection: gate2-gate3 [max_link_capacity=1]

# Waiting areas for queue management
connection: gate1-waiting_area1
connection: gate2-waiting_area2
connection: gate3-waiting_area3
connection: waiting_area1-waiting_area2
connection: waiting_area2-waiting_area3

# Restricted tunnel path (slow but more capacity)
connection: gate3-restricted_tunnel1
connection: restricted_tunnel1-restricted_tunnel2
connection: restricted_tunnel2-restricted_tunnel3
connection: restricted_tunnel3-convergence

# Priority bypass (fast but limited capacity)
connection: waiting_area1-priority_bypass1
connection: priority_bypass1-priority_bypass2
connection: priority_bypass2-convergence

# Final challenge
connection: convergence-final_bottleneck
connection: final_bottleneck-goal

# Emergency overflow paths
connection: waiting_area3-convergence`,

  "hard-3": `# Hard Level 3: THE ULTIMATE CHALLENGE - All tricks combined
nb_drones: 15

start_hub: start 0 0 [color=green max_drones=15]

# Layer 1: Initial distribution nightmare
hub: dist_gate1 1 0 [color=orange max_drones=1]
hub: dist_gate2 1 1 [color=orange max_drones=1]
hub: dist_gate3 1 -1 [color=orange max_drones=1]

# Layer 2: Dead end maze with loops
hub: maze_trap1 2 2 [color=red]
hub: maze_trap2 3 2 [color=red]
hub: maze_loop1 2 1 [zone=restricted color=purple]
hub: maze_loop2 3 1 [zone=restricted color=purple]
hub: maze_loop3 4 1 [zone=restricted color=purple]
hub: maze_loop4 4 2 [zone=restricted color=purple]
hub: maze_correct 2 0 [color=blue]

# Layer 3: Capacity nightmare section
hub: bottleneck1 3 0 [color=yellow max_drones=2]
hub: bottleneck2 4 0 [color=yellow max_drones=1]
hub: overflow1 3 -1 [zone=restricted color=orange max_drones=3]
hub: overflow2 4 -1 [zone=restricted color=orange max_drones=3]

# Layer 4: Priority puzzle with traps
hub: priority_hub 5 0 [zone=priority color=cyan max_drones=4]
hub: priority_trap1 5 1 [zone=priority color=cyan]
hub: priority_trap2 6 1 [zone=priority color=cyan]
hub: priority_dead_end 6 2 [color=red]
hub: priority_correct 6 0 [zone=priority color=cyan max_drones=3]

# Layer 5: Multi-path convergence hell
hub: conv_restricted1 7 0 [zone=restricted color=brown max_drones=2]
hub: conv_restricted2 8 0 [zone=restricted color=brown max_drones=2]
hub: conv_normal1 7 -1 [color=blue max_drones=3]
hub: conv_normal2 8 -1 [color=blue max_drones=3]
hub: conv_priority1 7 1 [zone=priority color=lime max_drones=2]
hub: conv_priority2 8 1 [zone=priority color=lime max_drones=2]

# Layer 6: Final gauntlet
hub: final_merge 9 0 [color=magenta max_drones=8]
hub: final_gate1 10 0 [color=orange max_drones=3]
hub: final_gate2 11 0 [color=orange max_drones=2]
hub: final_gate3 12 0 [color=orange max_drones=1]

end_hub: goal 13 0 [color=gold max_drones=15]

# Layer 1 connections
connection: start-dist_gate1
connection: start-dist_gate2
connection: start-dist_gate3

# Layer 2 connections - maze with traps
connection: dist_gate1-maze_correct
connection: dist_gate2-maze_trap1
connection: dist_gate3-maze_loop1
connection: maze_trap1-maze_trap2
connection: maze_loop1-maze_loop2
connection: maze_loop2-maze_loop3
connection: maze_loop3-maze_loop4
connection: maze_loop4-maze_loop1
connection: maze_loop2-maze_correct

# Layer 3 connections - capacity nightmare
connection: maze_correct-bottleneck1
connection: bottleneck1-bottleneck2
connection: bottleneck1-overflow1
connection: overflow1-overflow2
connection: overflow2-bottleneck2

# Layer 4 connections - priority puzzle
connection: bottleneck2-priority_hub
connection: priority_hub-priority_trap1
connection: priority_hub-priority_correct
connection: priority_trap1-priority_trap2
connection: priority_trap2-priority_dead_end
connection: priority_correct-conv_restricted1
connection: priority_correct-conv_normal1
connection: priority_correct-conv_priority1

# Layer 5 connections - multi-path convergence
connection: conv_restricted1-conv_restricted2
connection: conv_normal1-conv_normal2
connection: conv_priority1-conv_priority2
connection: conv_restricted2-final_merge
connection: conv_normal2-final_merge
connection: conv_priority2-final_merge

# Layer 6 connections - final gauntlet
connection: final_merge-final_gate1
connection: final_gate1-final_gate2
connection: final_gate2-final_gate3
connection: final_gate3-goal

# Emergency bypass (very expensive)
connection: overflow2-conv_normal1
connection: priority_hub-conv_priority1`,

  "challenger-1": `# CHALLENGER LEVEL: THE IMPOSSIBLE DREAM
# WARNING: This map is designed to be extremely challenging and may not be solvable
# by most algorithms. It's intended as a stress test and research challenge.
# The goal is NOT to validate this map but to push algorithmic limits.

nb_drones: 25

# === LAYER 0: The Nightmare Begins ===
start_hub: start 0 0 [color=green max_drones=25]

# Single-file entry gates (extreme bottleneck)
hub: gate_hell1 1 0 [color=red max_drones=1]
hub: gate_hell2 2 0 [color=red max_drones=1]
hub: gate_hell3 3 0 [color=red max_drones=1]
hub: gate_hell4 4 0 [color=red max_drones=1]
hub: gate_hell5 5 0 [color=red max_drones=1]

# === LAYER 1: The Maze of Despair ===
# Multiple interconnected dead ends and loops
hub: maze_trap_a1 1 1 [color=purple]
hub: maze_trap_a2 2 1 [color=purple]
hub: maze_trap_a3 3 1 [color=purple]
hub: maze_dead_a 4 1 [color=black]

hub: maze_trap_b1 1 -1 [color=purple]
hub: maze_trap_b2 2 -1 [color=purple]
hub: maze_trap_b3 3 -1 [color=purple]
hub: maze_dead_b 4 -1 [color=black]

hub: maze_loop1 1 2 [zone=restricted color=brown]
hub: maze_loop2 2 2 [zone=restricted color=brown]
hub: maze_loop3 3 2 [zone=restricted color=brown]
hub: maze_loop4 4 2 [zone=restricted color=brown]
hub: maze_loop5 5 2 [zone=restricted color=brown]
hub: maze_loop6 5 1 [zone=restricted color=brown]

# === LAYER 2: The Capacity Nightmare ===
hub: micro_gate1 6 0 [color=orange max_drones=1]
hub: micro_gate2 7 0 [color=orange max_drones=1]
hub: micro_gate3 8 0 [color=orange max_drones=1]

# Overflow areas with terrible costs
hub: overflow_hell1 6 1 [zone=restricted color=maroon max_drones=2]
hub: overflow_hell2 7 1 [zone=restricted color=maroon max_drones=2]
hub: overflow_hell3 8 1 [zone=restricted color=maroon max_drones=2]
hub: overflow_hell4 6 -1 [zone=restricted color=maroon max_drones=2]
hub: overflow_hell5 7 -1 [zone=restricted color=maroon max_drones=2]
hub: overflow_hell6 8 -1 [zone=restricted color=maroon max_drones=2]

# === LAYER 3: The False Hope Section ===
# Priority zones that lead to more traps
hub: false_hope1 9 0 [zone=priority color=gold max_drones=3]
hub: false_hope2 10 0 [zone=priority color=gold max_drones=2]
hub: false_hope3 11 0 [zone=priority color=gold max_drones=1]

# More dead ends disguised as good paths
hub: priority_trap1 9 1 [zone=priority color=gold]
hub: priority_trap2 10 1 [zone=priority color=gold]
hub: priority_dead 11 1 [color=black]

hub: priority_trap3 9 -1 [zone=priority color=gold]
hub: priority_trap4 10 -1 [zone=priority color=gold]
hub: priority_dead2 11 -1 [color=black]

# === LAYER 4: The Convergence Hell ===
# Multiple restricted paths that must merge
hub: conv_restricted1 12 2 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted2 13 2 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted3 14 2 [zone=restricted color=darkred max_drones=1]

hub: conv_restricted4 12 0 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted5 13 0 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted6 14 0 [zone=restricted color=darkred max_drones=1]

hub: conv_restricted7 12 -2 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted8 13 -2 [zone=restricted color=darkred max_drones=1]
hub: conv_restricted9 14 -2 [zone=restricted color=darkred max_drones=1]

# === LAYER 5: The Final Gauntlet of Doom ===
hub: final_merge 15 0 [color=violet max_drones=5]
hub: final_torture1 16 0 [color=crimson max_drones=2]
hub: final_torture2 17 0 [color=crimson max_drones=1]
hub: final_torture3 18 0 [color=crimson max_drones=1]
hub: final_torture4 19 0 [color=crimson max_drones=1]
hub: final_torture5 20 0 [color=crimson max_drones=1]

# The ultimate goal
end_hub: impossible_goal 21 0 [color=rainbow max_drones=25]

# === CONNECTIONS: The Web of Suffering ===

# Layer 0 connections (bottleneck hell)
connection: start-gate_hell1 [max_link_capacity=1]
connection: gate_hell1-gate_hell2 [max_link_capacity=1]
connection: gate_hell2-gate_hell3 [max_link_capacity=1]
connection: gate_hell3-gate_hell4 [max_link_capacity=1]
connection: gate_hell4-gate_hell5 [max_link_capacity=1]

# Layer 1 connections (maze of despair)
connection: gate_hell1-maze_trap_a1
connection: gate_hell2-maze_trap_b1
connection: gate_hell3-maze_loop1

connection: maze_trap_a1-maze_trap_a2
connection: maze_trap_a2-maze_trap_a3
connection: maze_trap_a3-maze_dead_a

connection: maze_trap_b1-maze_trap_b2
connection: maze_trap_b2-maze_trap_b3
connection: maze_trap_b3-maze_dead_b

connection: maze_loop1-maze_loop2
connection: maze_loop2-maze_loop3
connection: maze_loop3-maze_loop4
connection: maze_loop4-maze_loop5
connection: maze_loop5-maze_loop6
connection: maze_loop6-maze_loop1

# Escape routes from maze (very limited)
connection: maze_trap_a2-micro_gate1
connection: maze_trap_b2-micro_gate1
connection: maze_loop3-micro_gate2

# Layer 2 connections (capacity nightmare)
connection: gate_hell5-micro_gate1
connection: micro_gate1-micro_gate2
connection: micro_gate2-micro_gate3

# Overflow hell connections
connection: micro_gate1-overflow_hell1
connection: micro_gate2-overflow_hell2
connection: micro_gate3-overflow_hell3
connection: micro_gate1-overflow_hell4
connection: micro_gate2-overflow_hell5
connection: micro_gate3-overflow_hell6

connection: overflow_hell1-overflow_hell2
connection: overflow_hell2-overflow_hell3
connection: overflow_hell4-overflow_hell5
connection: overflow_hell5-overflow_hell6

connection: overflow_hell3-false_hope1
connection: overflow_hell6-false_hope1

# Layer 3 connections (false hope)
connection: micro_gate3-false_hope1
connection: false_hope1-false_hope2
connection: false_hope2-false_hope3

# False hope traps
connection: false_hope1-priority_trap1
connection: false_hope2-priority_trap2
connection: false_hope3-priority_dead

connection: false_hope1-priority_trap3
connection: false_hope2-priority_trap4
connection: false_hope3-priority_dead2

connection: priority_trap1-priority_trap2
connection: priority_trap3-priority_trap4

# Layer 4 connections (convergence hell)
connection: false_hope3-conv_restricted1
connection: false_hope3-conv_restricted4
connection: false_hope3-conv_restricted7

connection: conv_restricted1-conv_restricted2
connection: conv_restricted2-conv_restricted3
connection: conv_restricted4-conv_restricted5
connection: conv_restricted5-conv_restricted6
connection: conv_restricted7-conv_restricted8
connection: conv_restricted8-conv_restricted9

connection: conv_restricted3-final_merge
connection: conv_restricted6-final_merge
connection: conv_restricted9-final_merge

# Layer 5 connections (final gauntlet)
connection: final_merge-final_torture1
connection: final_torture1-final_torture2
connection: final_torture2-final_torture3
connection: final_torture3-final_torture4
connection: final_torture4-final_torture5
connection: final_torture5-impossible_goal

# Emergency bypass routes (extremely expensive)
connection: overflow_hell1-conv_restricted1
connection: overflow_hell4-conv_restricted7
connection: priority_trap1-conv_restricted4`,
} as const;

export type SampleKey = keyof typeof SAMPLE_MAPS;

export const SAMPLE_SIMULATIONS: Record<SampleKey, string> = {
  "easy-1": `# Linear Path - Valid Simulation
# 2 drones, each connection has capacity 1 (default)
# Turn 1: D1 moves to waypoint1
D1-waypoint1
# Turn 2: D1 continues, D2 enters waypoint1
D1-waypoint2 D2-waypoint1
# Turn 3: D1 reaches goal, D2 continues
D1-goal D2-waypoint2
# Turn 4: D2 reaches goal
D2-goal`,

  "easy-2": `# Simple Fork - Valid Simulation
# 3 drones split between two paths
# Each connection has capacity 1 (default)
# Turn 1: D1 reaches junction
D1-junction
# Turn 2: D1 takes path_a, D2 enters junction
D1-path_a D2-junction
# Turn 3: D1 reaches goal, D2 takes path_b, D3 enters junction
D1-goal D2-path_b D3-junction
# Turn 4: D2 reaches goal, D3 takes path_a
D2-goal D3-path_a
# Turn 5: D3 reaches goal
D3-goal`,

  "easy-3": `# Basic Capacity - Valid Simulation
# 4 drones with bottleneck (max_drones=2)
# Each connection has capacity 1 (default)
# Turn 1: D1 enters bottleneck
D1-bottleneck
# Turn 2: D1 continues, D2 enters bottleneck (total 2 in bottleneck)
D1-wide_area D2-bottleneck
# Turn 3: D2 continues, D3 enters bottleneck
D2-wide_area D3-bottleneck
# Turn 4: D3 continues, D4 enters bottleneck
D3-wide_area D4-bottleneck
# Turn 5: D1 reaches goal, D4 continues
D1-goal D4-wide_area
# Turn 6: D2 reaches goal
D2-goal D4-goal
# Turn 7: D3 reaches goal
D3-goal`,

  "medium-1": `# Dead End Trap - Avoid dead end
# Take the correct path
D1-junction
D1-correct_path D2-junction
D1-intermediate D2-correct_path D3-junction
D1-goal D2-intermediate D3-correct_path
D2-goal D4-junction
D3-intermediate D4-correct_path
D3-goal D5-junction
D4-intermediate D5-correct_path
D4-goal
D5-intermediate
D5-goal`,

  "medium-2": `# Circular Loop - Navigate the loop
# All restricted zones, must arrive at exit_point
D1-loop_a
D1-loop_b D2-loop_a
D1-loop_c D2-loop_b D3-loop_a
D1-loop_d D2-loop_c D3-loop_b D4-loop_a
D1-loop_a D2-loop_d D3-loop_c D4-loop_b D5-loop_a
D1-loop_b D2-loop_a D3-loop_d D4-loop_c D5-loop_b D6-loop_a
D1-exit_point D2-loop_b D3-loop_a D4-loop_d D5-loop_c D6-loop_b
D1-goal D2-exit_point D3-loop_b D4-loop_a D5-loop_d D6-loop_c
D2-goal D3-exit_point D4-loop_b D5-loop_a D6-loop_d
D3-goal D4-exit_point D5-loop_b D6-loop_a
D4-goal D5-exit_point D6-loop_b
D5-goal D6-exit_point
D6-goal`,

  "medium-3": `# Priority Puzzle - Use fast path
# Take priority path for faster delivery
D1-fast_junction
D1-fast_path D2-fast_junction
D1-merge_point D2-fast_path D3-slow_path1
D1-goal D2-merge_point D3-slow_path2 D4-fast_junction
D2-goal D3-slow_path3 D4-fast_path
D3-merge_point D4-merge_point
D3-goal
D4-goal`,

  "hard-1": `# Maze Nightmare - Complex routing
# Navigate through the maze carefully
D1-hub_a1
D1-hub_a2 D2-hub_a1
D1-hub_a3 D2-hub_a2 D3-hub_a1
D1-hub_b2 D2-hub_a3 D3-hub_a2 D4-hub_a1
D1-hub_b3 D2-hub_b2 D3-hub_a3 D4-hub_a2 D5-hub_a1
D1-hub_c2 D2-hub_b3 D3-hub_b2 D4-hub_a3 D5-hub_a2 D6-hub_a1
D1-hub_center D2-hub_c2 D3-hub_b3 D4-hub_b2 D5-hub_a3 D6-hub_a2
D1-hub_d1 D2-hub_center D3-hub_c2 D4-hub_b3 D5-hub_b2 D6-hub_a3
D1-hub_d2 D2-hub_d1 D3-hub_center D4-hub_c2 D5-hub_b3 D6-hub_b2
D1-final_hub D2-hub_d2 D3-hub_d1 D4-hub_center D5-hub_c2 D6-hub_b3
D1-goal D2-final_hub D3-hub_d2 D4-hub_d1 D5-hub_center D6-hub_c2
D2-goal D3-final_hub D4-hub_d2 D5-hub_d1 D6-hub_center
D3-goal D4-final_hub D5-hub_d2 D6-hub_d1
D4-goal D5-final_hub D6-hub_d2
D5-goal D6-final_hub
D6-goal`,

  "hard-2": `# Capacity Hell - Extreme constraints
# Manage tight capacity limits
D1-checkpoint1
D1-checkpoint2 D2-checkpoint1
D1-checkpoint3 D2-checkpoint2 D3-checkpoint1
D1-checkpoint4 D2-checkpoint3 D3-checkpoint2 D4-checkpoint1
D1-final_hub D2-checkpoint4 D3-checkpoint3 D4-checkpoint2 D5-checkpoint1
D1-goal D2-final_hub D3-checkpoint4 D4-checkpoint3 D5-checkpoint2 D6-checkpoint1
D2-goal D3-final_hub D4-checkpoint4 D5-checkpoint3 D6-checkpoint2
D3-goal D4-final_hub D5-checkpoint4 D6-checkpoint3
D4-goal D5-final_hub D6-checkpoint4
D5-goal D6-final_hub
D6-goal`,

  "hard-3": `# Ultimate Challenge - All tricks combined
# Complex navigation with multiple constraints
D1-path1_step1
D1-path1_step2 D2-path1_step1
D1-path1_step3 D2-path1_step2 D3-path2_step1
D1-junction D2-path1_step3 D3-path2_step2 D4-path1_step1
D1-path2_step1 D2-junction D3-path2_step3 D4-path1_step2 D5-path2_step1
D1-path2_step2 D2-path2_step1 D3-junction D4-path1_step3 D5-path2_step2 D6-path2_step1
D1-path2_step3 D2-path2_step2 D3-path2_step1 D4-junction D5-path2_step3 D6-path2_step2
D1-final D2-path2_step3 D3-path2_step2 D4-path2_step1 D5-final D6-path2_step3
D1-goal D2-final D3-path2_step3 D4-path2_step2 D6-final
D2-goal D3-final D4-path2_step3
D3-goal D4-final
D4-goal D5-goal
D6-goal`,

  "challenger-1": `# The Impossible Dream - Ultimate test
# Master routing puzzle - find the optimal solution
D1-zone_a1
D1-zone_a2 D2-zone_a1
D1-zone_a3 D2-zone_a2 D3-zone_b1
D1-zone_b1 D2-zone_a3 D3-zone_b2 D4-zone_a1
D1-zone_b2 D2-zone_b1 D3-zone_b3 D4-zone_a2 D5-zone_c1
D1-zone_b3 D2-zone_b2 D3-zone_hub D4-zone_a3 D5-zone_c2 D6-zone_b1
D1-hub D2-zone_b3 D3-zone_c1 D4-zone_b1 D5-zone_c3 D6-zone_b2
D1-goal D2-hub D3-zone_c2 D4-zone_b2 D6-zone_b3
D2-goal D3-zone_c3 D4-zone_b3
D3-hub D5-zone_hub
D3-goal D4-hub D5-goal D6-hub
D4-goal D6-goal`,
};

export const SAMPLE_OPTIONS: Array<{
  value: SampleKey;
  label: string;
  category: string;
  description: string;
}> = [
  {
    value: "easy-1",
    label: "Linear Path",
    category: "Easy",
    description: "Simple linear path from start to goal",
  },
  {
    value: "easy-2",
    label: "Simple Fork",
    category: "Easy",
    description: "Two alternative paths with basic routing",
  },
  {
    value: "easy-3",
    label: "Basic Capacity",
    category: "Easy",
    description: "Basic capacity management challenge",
  },
  {
    value: "medium-1",
    label: "Dead End Trap",
    category: "Medium",
    description: "Drones might get stuck in dead ends",
  },
  {
    value: "medium-2",
    label: "Circular Loop",
    category: "Medium",
    description: "Complex circular loop with restricted zones",
  },
  {
    value: "medium-3",
    label: "Priority Puzzle",
    category: "Medium",
    description: "Priority zones create optimal path challenges",
  },
  {
    value: "hard-1",
    label: "Maze Nightmare",
    category: "Hard",
    description: "Complex maze with dead ends and loops",
  },
  {
    value: "hard-2",
    label: "Capacity Hell",
    category: "Hard",
    description: "Extreme capacity constraints and timing challenges",
  },
  {
    value: "hard-3",
    label: "Ultimate Challenge",
    category: "Hard",
    description: "All tricks combined - the hardest level",
  },
  {
    value: "challenger-1",
    label: "The Impossible Dream",
    category: "Challenger",
    description: "The ultimate routing puzzle - test your mastery",
  },
];

export function getSamplesByCategory(category: string): typeof SAMPLE_OPTIONS {
  return SAMPLE_OPTIONS.filter((option) => option.category === category);
}

export const SAMPLE_CATEGORIES = ["Easy", "Medium", "Hard", "Challenger"];
