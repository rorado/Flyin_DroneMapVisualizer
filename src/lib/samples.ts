export const SAMPLE_MAPS = {
  easy: `
  nb_drones: 4

  start_hub: start 0 0 [color=green max_drones=4]
  hub: bottleneck 1 0 [color=orange max_drones=2]
  hub: wide_area 2 0 [color=blue max_drones=3]
  end_hub: goal 3 0 [color=red max_drones=4]

  connection: start-bottleneck
  connection: bottleneck-wide_area
  connection: wide_area-goal`,
  medium: `
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
connection: merge_point-goal
`,
  hard: `
  # Hard Level 2: Extreme capacity constraints with timing challenges
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
connection: waiting_area3-convergence`
} as const;

export type SampleKey = keyof typeof SAMPLE_MAPS;

export const SAMPLE_OPTIONS: Array<{
  value: SampleKey;
  label: string;
  description: string;
}> = [
  {
    value: "easy",
    label: "Easy map",
    description: "Small network with basic routing",
  },
  {
    value: "medium",
    label: "Medium map",
    description: "More zones and one capacity link",
  },
  {
    value: "hard",
    label: "Hard map",
    description: "Dense graph with blockers and capacities",
  },
];
