import * as React from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

export default function PrivacyPolicyScreen() {
  const privacyUrl = (Constants.expoConfig as any)?.extra?.privacyPolicyUrl as string | undefined;
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Effective Date: 01/01/2026</Text>

        <View style={styles.linkRow}>
          {privacyUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(privacyUrl)} style={styles.linkBtn}>
              <Text style={styles.linkText}>Open Web Version</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.linkHint}>Host URL not set. Configure in app.json extra. </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>1. Introduction</Text>
          <Text style={styles.text}>
            This Privacy Policy explains how HabitChain handles user information. Your privacy is important
            to us, and we are committed to protecting it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. Information Collection</Text>
          <Text style={styles.text}>
            HabitChain does not collect, store, or transmit any personal data. The App works entirely offline and
            does not require user accounts, login, or an internet connection. All habit data entered by the user
            is stored locally on the user’s device only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. Data Usage</Text>
          <Text style={styles.text}>
            Since no personal or sensitive data is collected, no data is processed on external servers,
            analyzed, or used for tracking or profiling.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Data Sharing</Text>
          <Text style={styles.text}>
            The App does not share any data with third parties, advertisers, analytics services, or external organizations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. Data Storage & Security</Text>
          <Text style={styles.text}>
            All user-entered data is stored locally on the device using secure local storage mechanisms.
            We do not have access to this data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>6. Children’s Privacy</Text>
          <Text style={styles.text}>
            HabitChain does not knowingly collect personal information from children under the age of 13.
            Since the App does not collect data, there is no risk of children’s data being collected.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>7. Third-Party Services</Text>
          <Text style={styles.text}>
            The App does not use third-party services that collect user data such as analytics, ads, or tracking SDKs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>8. Changes to This Privacy Policy</Text>
          <Text style={styles.text}>
            This Privacy Policy may be updated from time to time. Any changes will be reflected on this page.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>9. Contact Information</Text>
          <Text style={styles.text}>If you have any questions about this Privacy Policy, contact us at: willmvondo93@gmail.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>10. Consent</Text>
          <Text style={styles.text}>
            By using HabitChain, you agree to this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  linkRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  linkText: {
    color: '#fff',
    fontWeight: '700',
  },
  linkHint: {
    color: '#64748b',
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
});
