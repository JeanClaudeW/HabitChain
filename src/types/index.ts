export type Frequency = 'daily' | 'weekly' | 'once' | string[]; // supports one-time and custom days

export type Habit = {
  id: number;
  name: string;
  color: string;
  icon: string;
  frequency: Frequency;
  target: number;
  createdAt: number;
  reminderTime?: string | null;
  reminderUserName?: string | null;
  category?: string[]; // optional tags (not displayed)
  timeOfDay?: string; // e.g., "Morning" | "Afternoon" | "Evening" | "Night"
};

export type Completion = {
  id?: number;
  habitId: number;
  date: number;
  value: number;
  notes?: string;
};
