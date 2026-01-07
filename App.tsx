import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import { AddHabitScreen } from './src/screens/AddHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import PresetHabitsScreen from './src/screens/PresetHabitsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import { useLanguageStore } from './src/store/useLanguageStore';
import { useHabitStore } from './src/store/useHabitStore';
import { translations, SupportedLanguage } from './src/utils/translations';

export type RootStackParamList = {
  Main: undefined;
  AddHabit: { habitToEdit?: any };
  HabitDetail: { habit: any };
  Presets: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

async function scheduleHabitReminders(
  habits: Array<{ id: number; name: string; reminderTime?: string | null; reminderUserName?: string | null }>,
) {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {}
  }
  const finalPerms = await Notifications.getPermissionsAsync();
  if (finalPerms.status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const h of habits) {
    if (!h.reminderTime) continue;
    const [hourStr, minuteStr] = h.reminderTime.split(':');
    const hour = parseInt(hourStr || '0', 10);
    const minute = parseInt(minuteStr || '0', 10);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit Reminder',
          body: `${h.name}`,
          data: {
            habitId: h.id,
            habitName: h.name,
            reminderUserName: h.reminderUserName || null,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (e) {
      // best-effort: ignore scheduling errors
    }
  }
}

function MainTabs() {
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage] || translations.English;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Habits"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
          tabBarLabel: t.today || 'Habits',
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          tabBarLabel: t.statsTitle || 'Stats',
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
          tabBarLabel: t.myAchievements || 'Achievements',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage] || translations.English;
  const habits = useHabitStore(state => state.habits);
  const loadHabits = useHabitStore(state => state.loadHabits);

  useEffect(() => {
    let receivedSub: Notifications.Subscription | undefined;
    let responseSub: Notifications.Subscription | undefined;
    (async () => {
      try {
        const perms = await Notifications.getPermissionsAsync();
        if (perms.status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch {}

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      receivedSub = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data as any;
        if (data?.habitName && data?.reminderUserName) {
          const phrase = `Hey ${data.reminderUserName}, it is time for ${data.habitName}`;
          Speech.speak(phrase, { language: 'en' });
        }
      });

      responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as any;
        if (data?.habitName && data?.reminderUserName) {
          const phrase = `Hey ${data.reminderUserName}, it is time for ${data.habitName}`;
          Speech.speak(phrase, { language: 'en' });
        }
      });
    })();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);

  useEffect(() => {
    // Re-schedule reminders when the habit list changes
    scheduleHabitReminders(
      habits.map(h => ({
        id: h.id,
        name: h.name,
        reminderTime: h.reminderTime,
        reminderUserName: h.reminderUserName ?? null,
      })),
    );
  }, [habits]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="AddHabit"
              component={AddHabitScreen}
              options={({ route }) => ({
                title: (route.params as any)?.habitToEdit ? t.editHabit : t.newHabit,
              })}
            />
            <Stack.Screen
              name="HabitDetail"
              component={HabitDetailScreen}
              options={{ title: t.habitName || 'Habit Details' }}
            />
            <Stack.Screen
              name="Presets"
              component={PresetHabitsScreen}
              options={{ title: t.choosePreset || 'Habit Presets' }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={require('./src/screens/PrivacyPolicyScreen').default}
              options={{ title: t.privacyPolicy || 'Privacy Policy' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
