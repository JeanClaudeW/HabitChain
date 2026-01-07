import * as React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import db from '../database/db';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';
import { calculateStreak } from '../utils/streakCalculator';

const ACHIEVEMENTS = [
  {
    id: 1,
    title: 'First Habit',
    desc: 'Finish habit for the first time',
    icon: '🥇',
    unlocked: false,
  },
  { id: 10, title: '10x Finisher', desc: 'Finish habit 10 times', icon: '🎯', unlocked: false },
  { id: 20, title: '20x Finisher', desc: 'Finish habit 20 times', icon: '🔥', unlocked: false },
  { id: 50, title: '50x Master', desc: 'Finish habit 50 times', icon: '💎', unlocked: false },
  { id: 100, title: 'Century Club', desc: 'Finish habit 100 times', icon: '👑', unlocked: false },
  { id: 300, title: 'Legend', desc: 'Finish habit 300 times', icon: '🌟', unlocked: false },
];

const STREAK_BADGES = [
  { days: 1, title: 'Streak Starter', desc: 'Reach a 1-day streak', icon: '🔥' },
  { days: 10, title: 'On Fire', desc: 'Reach a 10-day streak', icon: '⚡️' },
  { days: 20, title: 'Habit Hero', desc: 'Reach a 20-day streak', icon: '🦸' },
  { days: 50, title: 'Chain Master', desc: 'Reach a 50-day streak', icon: '⛓️' },
  { days: 100, title: 'Unbreakable', desc: 'Reach a 100-day streak', icon: '💎' },
  { days: 300, title: 'Legendary Chain', desc: 'Reach a 300-day streak', icon: '🌟' },
];

export default function AchievementsScreen() {
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage];
  // Helper for safe translation key lookup
  function getAchievementTranslation<K extends keyof typeof t>(key: K, fallback: string) {
    return t[key] ?? fallback;
  }
  // Simple count of total completions
  const total = db.getFirstSync('SELECT COUNT(*) as count FROM completions') as { count: number };
  const totalCount = total?.count || 0;
  const unlockedCompletionCount = ACHIEVEMENTS.filter(a => totalCount >= a.id).length;

  // Longest streak across all habits
  const habitRows = db.getAllSync('SELECT id FROM habits') as { id: number }[];
  let bestStreak = 0;
  for (const h of habitRows) {
    const { longestStreak } = calculateStreak(h.id);
    if (longestStreak > bestStreak) bestStreak = longestStreak;
  }
  const unlockedStreakCount = STREAK_BADGES.filter(badge => bestStreak >= badge.days).length;
  const totalUnlockedCount = unlockedCompletionCount + unlockedStreakCount;
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t.myAchievements || 'My Achievements'}</Text>
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {t.earnedAchievements?.replace('{count}', totalUnlockedCount.toString()) ||
            `You've earned ${totalUnlockedCount}/12 achievements`}
        </Text>
        <Text style={styles.progressSub}>{t.keepGoing || 'Keep going! 🔥'}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t.habitsFinished || 'Habits Finished'}</Text>
      <View style={styles.grid}>
        {ACHIEVEMENTS.map(ach => {
          // Use as const to help TS infer the literal type
          const titleKey = ach.title.replace(/\W/g, '').toLowerCase() as keyof typeof t;
          const descKey = ach.desc.replace(/\W/g, '').toLowerCase() as keyof typeof t;
          const isUnlocked = totalCount >= ach.id;
          return (
            <React.Fragment key={ach.id}>
              <View
                style={[
                  styles.achievementCard,
                  isUnlocked && styles.unlockedCard,
                  isUnlocked && styles.unlockedGlow,
                ]}
              >
                {isUnlocked && (
                  <View style={styles.badgeCheckWrapper}>
                    <Text style={styles.badgeCheck}>✓</Text>
                  </View>
                )}
                <Text style={styles.achievementIcon}>{ach.icon}</Text>
                <Text style={styles.achievementTitle}>
                  {getAchievementTranslation(titleKey, ach.title)}
                </Text>
                <Text style={styles.achievementDesc}>
                  {getAchievementTranslation(descKey, ach.desc)}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{t.streakBadges || 'Streak Badges'}</Text>
      <View style={styles.grid}>
        {STREAK_BADGES.map(badge => {
          const isUnlocked = bestStreak >= badge.days;
          return (
            <View
              key={badge.days}
              style={[
                styles.achievementCard,
                isUnlocked && styles.unlockedCard,
                isUnlocked && styles.unlockedGlow,
              ]}
            >
              {isUnlocked && (
                <View style={styles.badgeCheckWrapper}>
                  <Text style={styles.badgeCheck}>✓</Text>
                </View>
              )}
              <Text style={styles.achievementIcon}>{badge.icon}</Text>
              <Text style={styles.achievementTitle}>{badge.title}</Text>
              <Text style={styles.achievementDesc}>{badge.desc}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 30,
  },
  progressCard: {
    backgroundColor: '#3B82F6',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressSub: {
    fontSize: 16,
    color: '#e0f2fe',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.6,
    position: 'relative',
  },
  unlockedCard: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  unlockedGlow: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  badgeCheckWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCheck: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14,
  },
});
