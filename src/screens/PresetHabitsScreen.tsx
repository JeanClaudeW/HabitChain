import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';

const PRESETS = [
  {
    category: 'Health & Fitness',
    habits: [
      { name: 'Drink 8 glasses of water', icon: '💧', color: '#3B82F6' },
      { name: 'Walk 10,000 steps', icon: '🚶', color: '#10B981' },
      { name: 'Exercise 30 minutes', icon: '🏋️', color: '#F59E0B' },
      { name: 'Meditate 10 minutes', icon: '🧘', color: '#8B5CF6' },
    ],
  },
  {
    category: 'Productivity',
    habits: [
      { name: 'Read 20 pages', icon: '📚', color: '#6366F1' },
      { name: 'No social media before noon', icon: '📱', color: '#EF4444' },
      { name: "Plan tomorrow's tasks", icon: '📝', color: '#F97316' },
    ],
  },
  {
    category: 'Mindfulness',
    habits: [
      { name: 'Gratitude journal', icon: '🙏', color: '#EC4899' },
      { name: 'Digital detox 1 hour', icon: '🔕', color: '#10B981' },
      { name: 'Deep breathing', icon: '🌬️', color: '#3B82F6' },
    ],
  },
];

export default function PresetHabitsScreen({ route, navigation }: any) {
  const onSelectPreset = route.params?.onSelectPreset;
  const { language } = useLanguageStore();
  const t = translations[language as SupportedLanguage];
  const toKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const addPresetHabit = (habit: any) => {
    if (onSelectPreset) {
      onSelectPreset(habit);
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose from Presets</Text>
      <Text style={styles.subtitle}>Or create your own</Text>

      {PRESETS.map((section, index) => (
        <View key={section.category} style={styles.section}>
          <Text style={styles.sectionTitle}>{t[toKey(section.category)] || section.category}</Text>
          <View style={styles.habitList}>
            {section.habits.map(habit => (
              <TouchableOpacity
                key={habit.name}
                style={[styles.habitCard, { backgroundColor: habit.color + '22' }]}
                onPress={() => addPresetHabit(habit)}
              >
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <Text style={styles.habitName}>{habit.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  habitList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  habitCard: {
    flexBasis: '48%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  habitIcon: { fontSize: 32, marginBottom: 8 },
  habitName: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
