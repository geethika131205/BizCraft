export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export const LEVEL_NAMES: Record<Level, string> = {
  1: "Idea",
  2: "Validation",
  3: "MVP",
  4: "Launch",
  5: "Revenue",
  6: "Scale"
};

export interface UserProfile {
  uid: string;
  experience: string;
  budget: string;
  time: string;
  industry: string;
  goal: string;
  startupIdea: string;
  currentLevel: Level;
  xp: number;
  completedTasks: string[];
  isLevelCompleted: boolean;
  roadmap?: Roadmap;
}

export interface Roadmap {
  levels: {
    level: Level;
    name: string;
    description: string;
  }[];
}

export interface Task {
  id: string;
  level: Level;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface Simulation {
  id: string;
  title: string;
  scenario: string;
  challenge: string;
}
