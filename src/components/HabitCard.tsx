import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import HabitCompletionCelebration from './HabitCompletionCelebration';
import { calculateStreak } from '../utils/streakCalculator';
import * as Haptics from 'expo-haptics';
import db from '../database/db';
import { useHabitStore } from '../store/useHabitStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';
import { tKey } from '../utils/i18n';
import { Habit } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: () => void;
  navigation: NavigationProp;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  selectedCategory?: string;
}

// const SWIPE_THRESHOLD = 120;

export default function HabitCard({ habit, isCompletedToday, onToggle, navigation, selectionMode, isSelected, onSelectToggle }: Props) {
  // const translateX = useSharedValue(0);
  // const opacity = useSharedValue(1);
  // const confettiRef = React.useRef<any>(null);

  const { language } = useLanguageStore();
  const t = translations[language as SupportedLanguage];

  // const panGesture = Gesture.Pan()
  //   .onStart((event, ctx) => {
  //     ctx.startX = translateX.value;
  //   })
  //   .onUpdate((event, ctx) => {
  //     translateX.value = ctx.startX + event.translationX;
  //   })
  //   .onEnd((event) => {
  //     const shouldComplete = event.translationX > SWIPE_THRESHOLD;
  //     const shouldSkip = event.translationX < -SWIPE_THRESHOLD;

  //     if (shouldComplete || shouldSkip) {
  //       translateX.value = withSpring(shouldComplete ? 400 : -400, {}, () => {
  //         opacity.value = 0;
  //         runOnJS(onToggle)();
  //         runOnJS(Haptics.selectionAsync)();
  //         // if (shouldComplete && confettiRef.current) {
  //         //   runOnJS(() => confettiRef.current.start())();
  //         // }
  //       });
  //     } else {
  //       translateX.value = withSpring(0);
  //     }
  //   });

  // const animatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateX: translateX.value }],
  //   opacity: opacity.value,
  // }));

  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);
  const [successModalVisible, setSuccessModalVisible] = React.useState(false);
  const successOpacity = React.useRef(new Animated.Value(1)).current;
  const handleLongPress = () => {
    setConfirmDeleteVisible(true);
  };

  const [celebrateVisible, setCelebrateVisible] = React.useState(false);
  const [celebrateIcon, setCelebrateIcon] = React.useState('🏆');
  const [celebrateTitle, setCelebrateTitle] = React.useState<string | undefined>(undefined);
  const [celebrateMessage, setCelebrateMessage] = React.useState<string | undefined>(undefined);
  const [celebrateVariant, setCelebrateVariant] = React.useState<'completion' | 'streak' | undefined>(undefined);
  const [celebrationQueue, setCelebrationQueue] = React.useState<Array<{
    variant: 'completion' | 'streak';
    icon: string;
    title: string;
    message: string;
  }>>([]);

  const COMPLETION_THRESHOLDS = [1, 10, 20, 50, 100, 300];
  const COMPLETION_ICONS: Record<number, string> = {
    1: '🥇',
    10: '🎯',
    20: '🔥',
    50: '💎',
    100: '👑',
    300: '🌟',
  };
  const STREAK_THRESHOLDS = [1, 10, 20, 50, 100, 300];
  const STREAK_ICONS: Record<number, string> = {
    1: '🔥',
    10: '⚡️',
    20: '🦸',
    50: '⛓️',
    100: '💎',
    300: '🌟',
  };

  const computeBestStreak = () => {
    try {
      const habitRows = db.getAllSync('SELECT id FROM habits') as { id: number }[];
      let best = 0;
      for (const h of habitRows) {
        const { longestStreak } = calculateStreak(h.id);
        if (longestStreak > best) best = longestStreak;
      }
      return best;
    } catch (e) {
      return 0;
    }
  };

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

  const handleToggle = () => {
    const wasCompleted = isCompletedToday;
    // Snapshot achievements before toggle
    let preTotal = 0;
    try {
      const total = db.getFirstSync('SELECT COUNT(*) as count FROM completions') as { count: number };
      preTotal = total?.count || 0;
    } catch (e) {}
    const preBest = computeBestStreak();

    onToggle();

    // Only consider celebration when marking complete
    if (!wasCompleted) {
      // Recompute after toggle
      let postTotal = preTotal;
      try {
        const total2 = db.getFirstSync('SELECT COUNT(*) as count FROM completions') as { count: number };
        postTotal = total2?.count || 0;
      } catch (e) {}
      const postBest = computeBestStreak();

      const toCelebrate: Array<{ variant: 'completion' | 'streak'; icon: string; title: string; message: string }> = [];

      // Check completion achievements crossing
      for (const th of COMPLETION_THRESHOLDS) {
        if (preTotal < th && postTotal >= th) {
          const icon = COMPLETION_ICONS[th] || '🏆';
          toCelebrate.push({
            variant: 'completion',
            icon,
            title: t.achievementUnlocked || 'Achievement Unlocked!',
            message: (t.reachedCompletions || 'You reached {n} habit completions!').replace(
              '{n}',
              th.toString()
            ),
          });
          break; // Only one completion threshold should cross at a time
        }
      }

      // Check streak badge achievements crossing
      for (const th of STREAK_THRESHOLDS) {
        if (preBest < th && postBest >= th) {
          const icon = STREAK_ICONS[th] || '🏆';
          toCelebrate.push({
            variant: 'streak',
            icon,
            title: t.streakBadgeUnlocked || 'Streak Badge Unlocked!',
            message: (t.reachedStreak || 'You reached a {n}-day streak!').replace('{n}', th.toString()),
          });
          break; // Only one streak threshold should cross at a time
        }
      }

      if (toCelebrate.length > 0) {
        setCelebrationQueue(prev => {
          const newQueue = [...prev, ...toCelebrate];
          if (!celebrateVisible) {
            const next = newQueue[0];
            setCelebrateIcon(next.icon);
            setCelebrateTitle(next.title);
            setCelebrateMessage(next.message);
            setCelebrateVariant(next.variant);
            setCelebrateVisible(true);
          }
          return newQueue;
        });
      }
    }
  };

  const handleCelebrationClose = () => {
    setCelebrationQueue(prev => {
      const rest = prev.slice(1);
      if (rest.length > 0) {
        const next = rest[0];
        setCelebrateIcon(next.icon);
        setCelebrateTitle(next.title);
        setCelebrateMessage(next.message);
        setCelebrateVariant(next.variant);
        setCelebrateVisible(true);
      } else {
        setCelebrateVisible(false);
        setCelebrateVariant(undefined);
      }
      return rest;
    });
  };

  // Reminder time is not shown on the habit card

  return (
    <View>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: habit.color + (isCompletedToday ? '60' : '30') }]}
        onPress={() => {
          if (selectionMode && onSelectToggle) onSelectToggle();
          else navigation.navigate('HabitDetail', { habit });
        }}
        onLongPress={handleLongPress}
        activeOpacity={0.95}
      >
        {/* Swipe Background Hints */}
        {/* <View style={styles.swipeBg}>
          <Text style={styles.swipeLeftText}>← Skip</Text>
          <Text style={styles.swipeRightText}>Complete →</Text>
        </View> */}

        {/* Main Card Content */}
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: habit.color }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.name}>{habit.name}</Text>
            <View style={styles.bottomRow}>
              <View style={styles.streakRow}>
                <Text style={styles.streakFire}>🔥</Text>
              </View>
              <Text style={styles.frequencyText}>{frequencyLabel}</Text>
              {/* Reminder time hidden on card */}
            </View>
          </View>

          {selectionMode ? (
            <TouchableOpacity
              style={[styles.checkCircle, isSelected && styles.completedCheck]}
              onPress={onSelectToggle}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.checkCircle, isCompletedToday && styles.completedCheck]}
              onPress={handleToggle}
            >
              {isCompletedToday && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Confetti */}
        {/* <ConfettiCannon
          count={60}
          origin={{ x: 150, y: -20 }}
          autoStart={false}
          ref={confettiRef}
          fadeOut
        /> */}
      </TouchableOpacity>
      <Modal
        visible={confirmDeleteVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.modalTitle}>{t.deleteHabit}</Text>
            <Text style={styles.modalText}>{t.areYouSureDelete.replace('{name}', habit.name)}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  db.runSync('DELETE FROM habits WHERE id = ?', [habit.id]);
                  useHabitStore.getState().loadHabits();
                  setConfirmDeleteVisible(false);
                  setSuccessModalVisible(true);
                  successOpacity.setValue(1);
                  setTimeout(() => {
                    Animated.timing(successOpacity, {
                      toValue: 0,
                      duration: 400,
                      useNativeDriver: true,
                    }).start(() => {
                      setSuccessModalVisible(false);
                      successOpacity.setValue(1);
                    });
                  }, 1100);
                }}
              >
                <Text style={styles.deleteText}>{t.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.confirmModal, { opacity: successOpacity }]}>
            <Text style={styles.modalTitle}>{t.delete}</Text>
            <Text style={styles.modalText}>{t.habitDeleted.replace('{name}', habit.name)}</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.cancelText}>{t.ok || 'OK'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      <HabitCompletionCelebration
        visible={celebrateVisible}
        onClose={handleCelebrationClose}
        icon={celebrateIcon}
        title={celebrateTitle}
        message={celebrateMessage}
        variant={celebrateVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  swipeRightText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  swipeLeftText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 30,
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFire: {
    fontSize: 18,
    marginRight: 6,
  },
  streakText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  frequencyText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheck: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
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
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  deleteButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
