import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';
import ConfettiCannon from 'react-native-confetti-cannon';

interface Props {
  visible: boolean;
  onClose: () => void;
  icon: string;
  title?: string;
  message?: string;
  variant?: 'completion' | 'streak';
}

export default function HabitCompletionCelebration({ visible, onClose, icon, title, message, variant }: Props) {
  const scaleValue = new Animated.Value(0);
  const pulse = React.useRef(new Animated.Value(1)).current;
  const shine = React.useRef(new Animated.Value(1)).current;
  const { language } = useLanguageStore();
  const t = translations[language as SupportedLanguage];

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      if (variant === 'streak') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      } else if (variant === 'completion') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shine, { toValue: 0.7, duration: 800, useNativeDriver: true }),
            Animated.timing(shine, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      }
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            variant === 'streak' ? styles.streakBorder : styles.completionBorder,
            variant === 'streak' ? styles.streakGlow : styles.completionGlow,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          {/* Confetti */}
          <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut />

          {/* Bird Mascot */}
          <Text style={styles.bird}>🔗</Text>

          {/* Gold Badge */}
          <View
            style={[
              styles.badgeContainer,
              variant === 'streak' ? styles.badgeStreak : undefined,
            ]}
          >
            <Animated.View
              style={variant === 'streak' ? { transform: [{ scale: pulse }] } : { opacity: shine }}
            >
              <Text style={styles.badgeIcon}>{icon || '🏆'}</Text>
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title || 'Achievement Unlocked!'}</Text>

          {/* Message */}
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : (
            <Text style={styles.message}>Keep it up — your chain is growing strong!</Text>
          )}

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.button,
              variant === 'streak' ? styles.buttonStreak : styles.buttonCompletion,
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {variant === 'completion'
                ? t.collectAchievementBadge || t.collectBadge || 'Collect Badge'
                : variant === 'streak'
                ? t.collectStreakBadge || t.collectBadge || 'Collect Badge'
                : t.collectBadge || 'Collect Badge'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#1e293b',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
  },
  completionBorder: {
    borderColor: '#3B82F6',
  },
  streakBorder: {
    borderColor: '#10B981',
  },
  completionGlow: {
    shadowColor: '#3B82F6',
  },
  streakGlow: {
    shadowColor: '#10B981',
  },
  bird: {
    fontSize: 100,
    marginBottom: 20,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#fbbf24',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#f59e0b',
  },
  badgeStreak: {
    borderColor: '#10B981',
  },
  badgeIcon: {
    fontSize: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonCompletion: {
    backgroundColor: '#3B82F6',
  },
  buttonStreak: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
