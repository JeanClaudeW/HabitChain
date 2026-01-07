import { create } from 'zustand';
import db, { initDatabase } from '../database/db';
import type { Habit, Frequency, Completion } from '../types';
import dayjs from 'dayjs';

interface HabitState {
  habits: Habit[];
  loadHabits: () => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  toggleCompletion: (habitId: number, date?: number) => void;
  isCompletedToday: (habitId: number) => boolean; // ← Add this line to the interface
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],

  loadHabits: () => {
    initDatabase();
    const rows = db.getAllSync('SELECT * FROM habits ORDER BY createdAt DESC') as any[];

    const habits: Habit[] = rows.map(row => ({
      ...row,
      frequency: JSON.parse(row.frequency) as Frequency,
      category: row.category ? (JSON.parse(row.category) as string[]) : undefined,
      timeOfDay: row.timeOfDay || undefined,
      reminderUserName: row.reminderUserName || null,
    }));

    set({ habits });
  },

  addHabit: newHabit => {
    initDatabase();
    const createdAt = Date.now();
    const frequencyJson = JSON.stringify(newHabit.frequency);
    const categoryJson = JSON.stringify(newHabit.category ?? []);

    db.runSync(
      'INSERT INTO habits (name, color, icon, frequency, target, createdAt, reminderTime, reminderUserName, category, timeOfDay) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newHabit.name,
        newHabit.color,
        newHabit.icon,
        frequencyJson,
        newHabit.target ?? 1,
        createdAt,
        (newHabit as any).reminderTime ?? null,
        (newHabit as any).reminderUserName ?? null,
        categoryJson,
        newHabit.timeOfDay ?? null,
      ],
    );

    get().loadHabits();
  },

  toggleCompletion: (habitId, date = dayjs().startOf('day').valueOf()) => {
    const existing = db.getFirstSync('SELECT * FROM completions WHERE habitId = ? AND date = ?', [
      habitId,
      date,
    ]) as Completion | null;

    if (existing) {
      db.runSync('DELETE FROM completions WHERE id = ?', [existing.id!]);
    } else {
      db.runSync('INSERT INTO completions (habitId, date, value) VALUES (?, ?, ?)', [
        habitId,
        date,
        1,
      ]);
    }

    get().loadHabits();
  },

  // ← ADD THIS FUNCTION HERE, inside the returned object
  isCompletedToday: (habitId: number) => {
    const today = dayjs().startOf('day').valueOf();
    const row = db.getFirstSync('SELECT 1 FROM completions WHERE habitId = ? AND date = ?', [
      habitId,
      today,
    ]);
    return !!row;
  },
}));
