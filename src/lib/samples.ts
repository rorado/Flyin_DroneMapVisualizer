export const SAMPLE_MAPS = {
  easy: `nb_drones: 3
start_hub: depot 0 0 [color=emerald]
end_hub: goal 8 8 [color=yellow]
hub: nodeA 2 2 [zone=normal color=blue]
hub: nodeB 5 1 [zone=priority color=violet max_drones=2]
hub: nodeC 6 5 [zone=restricted color=red]
connection: depot-nodeA
connection: nodeA-nodeB
connection: nodeB-nodeC
connection: nodeC-goal`,
  medium: `nb_drones: 5
start_hub: hub 0 0
end_hub: goal 10 10 [color=yellow]
hub: roof1 3 4 [zone=restricted color=red]
hub: roof2 6 2 [zone=normal color=blue]
hub: corridorA 4 3 [zone=priority color=green max_drones=2]
hub: tunnelB 7 4 [zone=restricted color=red]
hub: obstacleX 5 5 [zone=blocked color=gray]
connection: hub-roof1
connection: hub-corridorA
connection: roof1-roof2
connection: roof2-goal
connection: corridorA-tunnelB [max_link_capacity=2]
connection: tunnelB-goal`,
  hard: `nb_drones: 8
start_hub: base 1 1
end_hub: landing 14 12 [color=amber]
hub: checkpoint1 3 2 [zone=priority color=emerald max_drones=3]
hub: checkpoint2 6 3 [zone=normal color=sky]
hub: checkpoint3 8 6 [zone=restricted color=orange]
hub: checkpoint4 10 8 [zone=priority color=purple max_drones=2]
hub: blockedA 5 6 [zone=blocked color=slate]
hub: blockedB 11 5 [zone=blocked color=slate]
hub: relay1 4 9 [zone=normal color=cyan]
hub: relay2 9 10 [zone=normal color=cyan]
connection: base-checkpoint1
connection: checkpoint1-checkpoint2 [max_link_capacity=2]
connection: checkpoint2-checkpoint3
connection: checkpoint3-checkpoint4 [max_link_capacity=3]
connection: checkpoint4-landing
connection: checkpoint2-relay1
connection: relay1-relay2 [max_link_capacity=2]
connection: relay2-landing
connection: checkpoint3-blockedA
connection: blockedA-blockedB`,
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
