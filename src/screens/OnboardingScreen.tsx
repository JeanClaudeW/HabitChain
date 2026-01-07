import React from 'react';
import Onboarding from 'react-native-onboarding-swiper';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();

  const onDone = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Main');
  };

  return (
    <Onboarding
      onDone={onDone}
      onSkip={onDone}
      pages={[
        {
          backgroundColor: '#3B82F6',
          image: <Text style={{ fontSize: 120 }}>🔗</Text>,
          title: 'Welcome to HabitChain',
          subtitle: 'Build unbreakable habits with streaks that motivate you every day.',
        },
        {
          backgroundColor: '#10B981',
          image: <Text style={{ fontSize: 120 }}>📊</Text>,
          title: 'Track Your Progress',
          subtitle: "Beautiful heatmaps and stats show how far you've come.",
        },
        {
          backgroundColor: '#1e293b',
          image: <Text style={{ fontSize: 120 }}>🚀</Text>,
          title: 'Start Building Today',
          subtitle: 'Create your first habit and begin your journey!',
        },
      ]}
    />
  );
}
