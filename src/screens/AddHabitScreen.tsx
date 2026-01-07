import * as React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import db, { initDatabase } from '../database/db';
import type { Frequency } from '../types';
import { useHabitStore } from '../store/useHabitStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';
import { TIME_OF_DAY_OPTIONS } from '../utils/constants';
import { tKey } from '../utils/i18n';

// Example icon categories, replace with your actual ICON_CATEGORIES
const ICON_CATEGORIES: Record<string, string[]> = {
  Health: ['💧', '🏃', '🏋️', '🚴'],
  Productivity: ['📚', '📝', '📅', '⏰'],
  Mindfulness: ['🧘', '🙏', '🌱', '🌙'],
  Fun: ['🎮', '🎵', '🎨', '🎲'],
};

type AddHabitScreenProps = {
  navigation: any;
  route: { params?: { habitToEdit?: any } };
};

export const AddHabitScreen: React.FC<AddHabitScreenProps> = ({ navigation, route }) => {
  const habitToEdit = route.params?.habitToEdit;
  const [name, setName] = useState(habitToEdit?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(habitToEdit?.icon || '💧');
  const [color, setColor] = useState(habitToEdit?.color || '#3B82F6');
  const initialRepeatMode: 'daily' | 'custom' | 'once' = Array.isArray(habitToEdit?.frequency)
    ? 'custom'
    : habitToEdit?.frequency === 'once'
    ? 'once'
    : 'daily';
  const [repeatMode, setRepeatMode] = useState<'daily' | 'custom' | 'once'>(initialRepeatMode);
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [selectedDays, setSelectedDays] = useState<string[]>(
    Array.isArray(habitToEdit?.frequency) ? (habitToEdit!.frequency as string[]) : []
  );
  const [target, setTarget] = useState(habitToEdit?.target?.toString() || '1');
  const [timeOfDay, setTimeOfDay] = useState<string | undefined>(
    habitToEdit?.timeOfDay || undefined,
  );
  const [reminderTime, setReminderTime] = useState<string | null>(
    habitToEdit?.reminderTime ?? null,
  );
  const [reminderUserName, setReminderUserName] = useState<string>(
    habitToEdit?.reminderUserName ?? '',
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nameErrorVisible, setNameErrorVisible] = useState(false);
  const [reminderNameErrorVisible, setReminderNameErrorVisible] = useState(false);
  const [timeWindowErrorVisible, setTimeWindowErrorVisible] = useState(false);
  const [timeWindowErrorMessage, setTimeWindowErrorMessage] = useState<string>('');
  const addHabit = useHabitStore(state => state.addHabit);
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage];
  // TIME_OF_DAY_OPTIONS imported; use tKey for translations

  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.iconOption, selectedIcon === item && styles.selectedIconOption]}
      onPress={() => setSelectedIcon(item)}
    >
      <Text style={styles.iconText}>{item}</Text>
    </TouchableOpacity>
  );

  const saveHabit = () => {
    initDatabase();
    if (!name.trim()) {
      setNameErrorVisible(true);
      return;
    }

    if (reminderTime && !reminderUserName.trim()) {
      setReminderNameErrorVisible(true);
      return;
    }

    // Persist frequency based on repeat mode
    const persistedFrequency: Frequency =
      repeatMode === 'daily' ? 'daily' : repeatMode === 'once' ? 'once' : selectedDays;

    const habitData = {
      name: name.trim(),
      icon: selectedIcon,
      color,
      frequency: persistedFrequency,
      target: parseInt(target) || 1,
      timeOfDay,
      reminderTime,
      reminderUserName: reminderUserName.trim() || null,
    };

    if (habitToEdit) {
      const frequencyJson = JSON.stringify(persistedFrequency);
      db.runSync(
        'UPDATE habits SET name = ?, icon = ?, color = ?, frequency = ?, target = ?, timeOfDay = ?, reminderTime = ?, reminderUserName = ? WHERE id = ?',
        [
          habitData.name,
          habitData.icon,
          habitData.color,
          frequencyJson,
          habitData.target,
          timeOfDay ?? null,
          reminderTime ?? null,
          habitData.reminderUserName,
          habitToEdit.id,
        ],
      );
    } else {
      addHabit(habitData);
    }

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Habit Name */}
      <Text style={styles.label}>{t.habitName}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t.habitNamePlaceholder}
        placeholderTextColor="#999"
      />

      {/* Current Selected Icon Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>{t.selectedIcon}</Text>
        <View style={[styles.previewIconCircle, { backgroundColor: color }]}>
          <Text style={styles.previewIcon}>{selectedIcon}</Text>
        </View>
      </View>

      {/* Icon Picker */}
      <Text style={styles.label}>{t.chooseIcon}</Text>
      {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {t[category.toLowerCase().replace(/[^a-z0-9]/g, '') as keyof typeof t] || category}
          </Text>
          <FlatList
            data={icons}
            renderItem={renderIconItem}
            keyExtractor={item => item}
            numColumns={8}
            scrollEnabled={false}
            contentContainerStyle={{ justifyContent: 'space-between' }}
          />
        </View>
      ))}

      {/* Time of Day Category Selection */}
      <Text style={styles.label}>{t.selectTimeOfDay}</Text>
      <View style={styles.categoryChips}>
        {TIME_OF_DAY_OPTIONS.map(opt => {
          const active = timeOfDay === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setTimeOfDay(opt);
                if (reminderTime) {
                  const [hh, mm] = reminderTime.split(':').map(n => parseInt(n, 10));
                  const h = isNaN(hh) ? -1 : hh;
                  const within = (function () {
                    switch (opt) {
                      case 'Morning':
                        return h >= 5 && h < 12; // 05:00–11:59
                      case 'Afternoon':
                        return h >= 12 && h < 17; // 12:00–16:59
                      case 'Evening':
                        return h >= 17 && h < 21; // 17:00–20:59
                      case 'Night':
                        return h >= 21 || h < 5; // 21:00–04:59
                      default:
                        return true;
                    }
                  })();
                  if (!within) {
                    // Clear reminder if it no longer matches selected time-of-day
                    setReminderTime(null);
                  }
                }
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t[tKey(opt) as keyof typeof t] || opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Repeat Options */}
      <Text style={styles.label}>{t.repeat || t.selectRepeat}</Text>
      <View style={styles.categoryChips}>
        {[
          { key: 'daily', label: t.daily || 'Daily' },
          { key: 'custom', label: t.selectRepeat || 'Specific Days' },
          { key: 'once', label: t.once || 'One Day' },
        ].map(opt => {
          const active = repeatMode === (opt.key as 'daily' | 'custom' | 'once');
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setRepeatMode(opt.key as 'daily' | 'custom' | 'once')}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {repeatMode === 'custom' && (
        <View style={styles.categoryChips}>
          {WEEKDAYS.map(day => {
            const active = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setSelectedDays(prev =>
                    prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                  );
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t[day.toLowerCase() as keyof typeof t] || day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Reminder Time Picker */}
      <Text style={styles.label}>{t.reminder}</Text>
      <TouchableOpacity
        style={styles.reminderBtn}
        onPress={() => {
          if (!timeOfDay) {
            setTimeWindowErrorMessage(t.selectTimeOfDay);
            setTimeWindowErrorVisible(true);
            return;
          }
          setShowTimePicker(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.reminderText}>
          {reminderTime ? `${reminderTime}` : t.noReminder}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={(function () {
            const d = new Date();
            if (reminderTime) {
              const [h, m] = reminderTime.split(':').map(n => parseInt(n, 10));
              d.setHours(h || 0, m || 0, 0, 0);
              return d;
            }
            switch (timeOfDay) {
              case 'Morning':
                d.setHours(8, 0, 0, 0);
                break;
              case 'Afternoon':
                d.setHours(13, 0, 0, 0);
                break;
              case 'Evening':
                d.setHours(18, 0, 0, 0);
                break;
              case 'Night':
                d.setHours(22, 0, 0, 0);
                break;
              default:
                break;
            }
            return d;
          })()}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShowTimePicker(false);
            if (!date) return;
            const hour = date.getHours();
            const minute = date.getMinutes();
            const within = (function () {
              switch (timeOfDay) {
                case 'Morning':
                  return hour >= 5 && hour < 12;
                case 'Afternoon':
                  return hour >= 12 && hour < 17;
                case 'Evening':
                  return hour >= 17 && hour < 21;
                case 'Night':
                  return hour >= 21 || hour < 5;
                default:
                  return true;
              }
            })();
            if (!within) {
              const rangeText = (function () {
                switch (timeOfDay) {
                  case 'Morning':
                    return '05:00–11:59';
                  case 'Afternoon':
                    return '12:00–16:59';
                  case 'Evening':
                    return '17:00–20:59';
                  case 'Night':
                    return '21:00–04:59';
                  default:
                    return '';
                }
              })();
              setTimeWindowErrorMessage(`${t[tKey(timeOfDay || '') as keyof typeof t] || timeOfDay}: ${rangeText}`);
              setTimeWindowErrorVisible(true);
              return;
            }
            const hh = `${hour}`.padStart(2, '0');
            const mm = `${minute}`.padStart(2, '0');
            setReminderTime(`${hh}:${mm}`);
          }}
          onTouchCancel={() => setShowTimePicker(false)}
        />
      )}

      {/* Reminder Name (for voice) */}
      <Text style={styles.label}>{t.reminderName || 'Name to use in reminder'}</Text>
      <TextInput
        style={styles.input}
        value={reminderUserName}
        onChangeText={setReminderUserName}
        placeholder={t.reminderNamePlaceholder || 'e.g., Alex'}
        placeholderTextColor="#999"
      />

      {/* Other fields (color, frequency, target) */}

      <Text style={styles.label}>{t.color}</Text>
      <View style={styles.colorGrid}>
        {[
          '#EF4444',
          '#F97316',
          '#F59E0B',
          '#10B981',
          '#3B82F6',
          '#6366F1',
          '#8B5CF6',
          '#EC4899',
        ].map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.selectedColor]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {/* Frequency, Target, etc. — keep your existing code */}

      <TouchableOpacity style={styles.saveBtn} onPress={saveHabit}>
        <Text style={styles.saveText}>{habitToEdit ? t.updateHabit : t.createHabit}</Text>
      </TouchableOpacity>

      {/* Validation Modals */}
      <Modal
        visible={nameErrorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNameErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t.habitName}</Text>
            <Text style={[styles.languageText, { textAlign: 'center', color: '#64748b', marginBottom: 12 }]}>
              {t.habitNameRequired || 'Please enter a habit name.'}
            </Text>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setNameErrorVisible(false)}>
              <Text style={styles.cancelText}>{t.ok || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time window error modal */}
      <Modal
        visible={timeWindowErrorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTimeWindowErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t.selectTimeOfDay}</Text>
            <Text style={[styles.languageText, { textAlign: 'center', color: '#64748b', marginBottom: 12 }]}>
              {timeWindowErrorMessage || ''}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setTimeWindowErrorVisible(false)}
            >
              <Text style={styles.cancelText}>{t.ok || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reminderNameErrorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReminderNameErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t.reminderName || t.reminder}</Text>
            <Text style={[styles.languageText, { textAlign: 'center', color: '#64748b', marginBottom: 12 }]}>
              {t.reminderNameRequired}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setReminderNameErrorVisible(false)}
            >
              <Text style={styles.cancelText}>{t.ok || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 30,
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#66a5f7ff',
  },
  chipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    fontSize: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  previewLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  previewIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  previewIcon: {
    fontSize: 64,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  iconOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedIconOption: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.1 }],
  },
  iconText: {
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    margin: 20,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 20,
  },
  colorBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedColor: {
    borderWidth: 4,
    borderColor: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reminderBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
});
