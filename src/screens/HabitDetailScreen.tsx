import * as React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Svg, Rect } from 'react-native-svg';
import db from '../database/db';
import { Habit } from '../types';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';

const CELL_SIZE = 12;
const CELL_GAP = 3;

interface Props {
  route: { params: { habit: Habit } };
}

export default function HabitDetailScreen({ route }: Props) {
  const { habit } = route.params;
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage];

  // Get this habit's completions
  const completions = db.getAllSync(
    'SELECT date FROM completions WHERE habitId = ? ORDER BY date DESC',
    [habit.id],
  ) as { date: number }[];

  const dates = completions.map(c => dayjs(c.date).startOf('day').valueOf());
  const dateSet = new Set(dates);

  const frequencyLabel = React.useMemo(() => {
    if (habit.frequency === 'daily') return t.daily || 'Daily';
    if (habit.frequency === 'once') return t.once || 'One day';
    if (habit.frequency === 'weekly') return t.weekly || 'Weekly';
    if (Array.isArray(habit.frequency) && habit.frequency.length > 0) {
      return habit.frequency
        .map(d => t[d.toLowerCase() as keyof typeof t] || d)
        .join(', ');
    }
    return t.daily || 'Daily';
  }, [habit.frequency, t]);

  // Streak calculation for this habit
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let expected = dayjs().startOf('day');

  for (let i = 0; i < 365 * 2; i++) {
    // look back far enough
    const day = expected.valueOf();
    if (dateSet.has(day)) {
      tempStreak++;
      currentStreak = tempStreak;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
    expected = expected.subtract(1, 'day');
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Heatmap (last 365 days)
  const startDate = dayjs().subtract(365, 'day').startOf('week');
  const cells = [];
  for (let i = 0; i < 53 * 7; i++) {
    const day = startDate.add(i, 'day').startOf('day').valueOf();
    const completed = dateSet.has(day);
    const fill = completed ? habit.color : '#ebedf0';

    cells.push(
      <React.Fragment key={i}>
        <Rect
          x={(i % 53) * (CELL_SIZE + CELL_GAP)}
          y={Math.floor(i / 53) * (CELL_SIZE + CELL_GAP)}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={fill}
          rx={2}
        />
      </React.Fragment>,
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Text style={styles.icon}>{habit.icon}</Text>
        <Text style={styles.name}>{habit.name}</Text>
      </View>

      <Text style={styles.metaText}>{frequencyLabel}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>{t.currentStreak || 'Current Streak'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>{t.bestStreak || 'Best Streak'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{dates.length}</Text>
          <Text style={styles.statLabel}>{t.totalDays || 'Total Days'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t.completionHeatmap || 'Completion Heatmap'}</Text>
      <Svg height="140" width="100%">
        {cells}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  icon: { fontSize: 48, marginRight: 16 },
  name: { fontSize: 28, fontWeight: 'bold' },
  metaText: { fontSize: 16, color: '#475569', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: 'bold', color: '#10B981' },
  statLabel: { fontSize: 16, color: '#666' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginVertical: 20 },
});
