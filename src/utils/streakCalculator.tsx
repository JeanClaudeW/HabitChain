import db from '../database/db';
import dayjs from 'dayjs';

export function calculateStreak(habitId: number) {
  const completions = db.getAllSync(
    'SELECT date FROM completions WHERE habitId = ? ORDER BY date DESC',
    [habitId],
  ) as { date: number }[];

  if (completions.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dates = completions.map(c => dayjs(c.date));

  let current = 0;
  let longest = 0;
  let expected = dayjs().startOf('day');

  for (const date of dates) {
    if (date.isSame(expected, 'day')) {
      current++;
      expected = expected.subtract(1, 'day');
    } else if (date.isBefore(expected)) {
      longest = Math.max(longest, current);
      current = 1; // reset but count this day
      expected = date.subtract(1, 'day');
    }
  }

  longest = Math.max(longest, current);

  return { currentStreak: current, longestStreak: longest };
}
