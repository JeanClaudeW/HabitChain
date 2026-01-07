import * as React from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import db from '../database/db';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import HabitCard from '../components/HabitCard';
import { useHabitStore } from '../store/useHabitStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations, SupportedLanguage } from '../utils/translations';
import { TIME_OF_DAY_OPTIONS } from '../utils/constants';
import { tKey } from '../utils/i18n';
// Using FlatList for simpler empty-state behavior
import type { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = TIME_OF_DAY_OPTIONS;

const LANGUAGES = [
  { key: 'English', name: 'English' },
  { key: 'French', name: 'Français' },
  { key: 'Spanish', name: 'Español' },
  { key: 'German', name: 'Deutsch' },
  { key: 'Italian', name: 'Italiano' },
  { key: 'Chinese', name: '中文' },
  { key: 'Russian', name: 'Русский' },
  { key: 'Vietnamese', name: 'Tiếng Việt' },
];

export default function HomeScreen() {
  const { habits, loadHabits, toggleCompletion, isCompletedToday } = useHabitStore();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language as SupportedLanguage];
  const navigation = useNavigation<NavigationProp>();

  // tKey from i18n helper

  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [menuModalVisible, setMenuModalVisible] = React.useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = React.useState(false);
  const [successModalVisible, setSuccessModalVisible] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string>('');
  const successOpacity = React.useRef(new Animated.Value(1)).current;
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  useEffect(() => {
    loadHabits();
    const unsubscribe = navigation.addListener('focus', loadHabits);
    return unsubscribe;
  }, [navigation]);

  const todayStr = dayjs().format('MMM D, YYYY');

  const filteredHabits =
    selectedCategory === 'All' ? habits : habits.filter(h => h.timeOfDay === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Unified Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate({ name: 'AddHabit', params: {} })}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.centerText}>
          <Text style={styles.todayText}>{t.today}</Text>
          <Text style={styles.dateText}>{todayStr}</Text>
        </View>

        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuModalVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
        {/* Menu Modal */}
        <Modal
          visible={menuModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.languageModal}>
              <Text style={styles.modalTitle}>{t.chooseAction}</Text>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => {
                  setMenuModalVisible(false);
                  setLanguageModalVisible(true);
                }}
              >
                <Text style={styles.languageText}>{t.selectLanguage}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => {
                  setMenuModalVisible(false);
                  // Navigate to privacy policy
                  (navigation as any).navigate('PrivacyPolicy');
                }}
              >
                <Text style={styles.languageText}>{t.privacyPolicy || 'Privacy Policy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => {
                  setMenuModalVisible(false);
                  setSelectionMode(true);
                  setSelectedIds([]);
                }}
              >
                <Text style={styles.languageText}>{t.selectHabitsToDelete}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => {
                  setMenuModalVisible(false);
                  setConfirmResetVisible(true);
                }}
              >
                <Text style={styles.languageText}>{t.resetAllStats || t.reset}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setMenuModalVisible(false)}
              >
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Confirm Reset Modal */}
        <Modal
          visible={confirmResetVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmResetVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.languageModal}>
              <Text style={styles.modalTitle}>{t.resetAllStats || t.reset}</Text>
              <Text
                style={[
                  styles.languageText,
                  { textAlign: 'center', color: '#64748b', marginBottom: 12 },
                ]}
              >
                {t.areYouSureReset || ''}
              </Text>
              <TouchableOpacity
                style={[styles.languageOption, { backgroundColor: '#ef4444' }]}
                onPress={() => {
                  try {
                    db.runSync('DELETE FROM completions');
                    loadHabits();
                  } catch (e) {}
                  setConfirmResetVisible(false);
                  setSuccessMessage(t.resetSuccess || '');
                  setSuccessModalVisible(true);
                  successOpacity.setValue(1);
                  const fadeTimer = setTimeout(() => {
                    Animated.timing(successOpacity, {
                      toValue: 0,
                      duration: 400,
                      useNativeDriver: true,
                    }).start(() => {
                      setSuccessModalVisible(false);
                      successOpacity.setValue(1);
                    });
                  }, 1100);
                  // Best-effort: no need to hold timer ref since modal closes shortly
                }}
              >
                <Text style={[styles.languageText, { color: '#fff' }]}>{t.reset}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmResetVisible(false)}
              >
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <TouchableOpacity
          style={[styles.categoryPill, selectedCategory === 'All' && styles.selectedPill]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'All' && styles.selectedText]}>
            {t.all || 'All'}
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryPill, selectedCategory === cat && styles.selectedPill]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.selectedText]}>
              {cat === 'Morning' && '☀️ '}
              {cat === 'Afternoon' && '🌤️ '}
              {cat === 'Evening' && '🌅 '}
              {cat === 'Night' && '🌙 '}
              {t[tKey(cat)] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selection Actions */}
      {selectionMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectionActionsScroll}
          contentContainerStyle={styles.selectionActionsContainer}
        >
          <TouchableOpacity
            style={[styles.selectionBtn, { backgroundColor: '#e2e8f0' }]}
            onPress={() => setSelectedIds(habits.map(h => h.id))}
          >
            <Text style={styles.selectionText}>{t.selectAll}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionBtn, { backgroundColor: '#ef4444' }]}
            onPress={() => {
              try {
                selectedIds.forEach(id => db.runSync('DELETE FROM habits WHERE id = ?', [id]));
                loadHabits();
              } catch (e) {}
              setSelectionMode(false);
              const msg = (t.habitsDeleted || 'Deleted {count} habits.').replace(
                '{count}',
                selectedIds.length.toString()
              );
              setSelectedIds([]);
              setSuccessMessage(msg);
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
            <Text style={[styles.selectionText, { color: '#fff' }]}>{t.deleteSelected}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionBtn, { backgroundColor: '#f1f5f9' }]}
            onPress={() => {
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <Text style={styles.selectionText}>{t.exitSelection}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Habit List or Empty State */}
      {filteredHabits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔗</Text>
          <Text style={styles.emptyTitle}>{t.noHabits}</Text>
          <Text style={styles.emptySubtitle}>{t.tapToAdd}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHabits}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              isCompletedToday={isCompletedToday(item.id)}
              onToggle={() => toggleCompletion(item.id)}
              navigation={navigation}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(item.id)}
              selectedCategory={selectedCategory}
              onSelectToggle={() => {
                setSelectedIds(prev =>
                  prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                );
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageOption,
                  { backgroundColor: lang.key === language ? '#10b981' : '#fff' },
                ]}
                onPress={() => {
                  setLanguage(lang.key as SupportedLanguage);
                  setLanguageModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.languageText,
                    { color: lang.key === language ? '#fff' : '#1e293b' },
                  ]}
                >
                  {lang.name}
                </Text>
                {lang.key === language && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.languageModal, { opacity: successOpacity }]}>
            <Text style={styles.modalTitle}>{t.options}</Text>
            <Text
              style={[
                styles.languageText,
                { textAlign: 'center', color: '#64748b', marginBottom: 12 },
              ]}
            >
              {successMessage}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fbfcfdff',
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#66a5f7ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    alignItems: 'center',
  },
  todayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292727ff',
  },
  dateText: {
    fontSize: 16,
    color: '#2c2e30ff',
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#66a5f7ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    overflow: 'visible',
    paddingHorizontal: -3,
    paddingVertical: 6,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 14,
    marginBottom: 24,
  },
  categoryPill: {
    //width: 120,
    height: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginRight: 8,
  },
  selectedPill: {
    backgroundColor: '#66a5f7ff',
  },
  categoryText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  selectionActionsScroll: {
    marginBottom: 8,
  },
  selectionActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  selectionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 0,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
});
