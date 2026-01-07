import * as React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import HeatmapCalendar from '../components/HeatmapCalendar';
import db from '../database/db';
import dayjs from 'dayjs';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';

export default function StatsScreen() {
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage];
  function getStatTranslation<K extends keyof typeof t>(key: K, fallback: string) {
    return t[key] ?? fallback;
  }
  const totalCompletions = db.getFirstSync('SELECT COUNT(*) as count FROM completions') as {
    count: number;
  };
  const totalHabits = db.getFirstSync('SELECT COUNT(*) as count FROM habits') as { count: number };

  // Simple global streak (days with at least 1 completion)
  const recent = db.getAllSync(
    'SELECT date FROM completions GROUP BY date ORDER BY date DESC LIMIT 100',
  ) as { date: number }[];
  let currentStreak = 0;
  let today = dayjs().startOf('day');
  for (const { date } of recent) {
    if (dayjs(date).isSame(today, 'day')) {
      currentStreak++;
      today = today.subtract(1, 'day');
    } else break;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{getStatTranslation('statsTitle', 'Your Stats')}</Text>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalCompletions?.count || 0}</Text>
        <Text style={styles.statLabel}>
          {getStatTranslation('statsTotalCompletions', 'Total Completions')}
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{currentStreak}</Text>
        <Text style={styles.statLabel}>
          {getStatTranslation('statsCurrentStreak', 'Current Daily Streak 🔥')}
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalHabits?.count || 0}</Text>
        <Text style={styles.statLabel}>
          {getStatTranslation('statsActiveHabits', 'Active Habits')}
        </Text>
      </View>

      <HeatmapCalendar />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginVertical: 20 },
  statCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: { fontSize: 48, fontWeight: 'bold', color: '#10B981' },
  statLabel: { fontSize: 18, color: '#666', marginTop: 8 },
});
