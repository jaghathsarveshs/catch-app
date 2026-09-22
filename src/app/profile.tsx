import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@catch_user_profile';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const LANGUAGES = ['English', 'Tamil', 'Hindi'] as const;

type Language = (typeof LANGUAGES)[number];

export interface UserProfile {
  dueDate: string;
  bloodType: string;
  hospitalName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  language: Language;
  hasPriorCSection: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  dueDate: '',
  bloodType: 'O+',
  hospitalName: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  language: 'English',
  hasPriorCSection: false,
};

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.trim();
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(cleanStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Load saved profile data on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserProfile>;
          setProfile((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaveStatus('Profile saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error('Failed to save profile:', e);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const updateField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' || Platform.OS === 'ios') {
      if (selectedDate) {
        updateField('dueDate', formatDateString(selectedDate));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <Text style={styles.headerAppName}>Catch</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>My Profile</Text>
            <Text style={styles.pageSubtitle}>
              Essential maternal & emergency details for bystander support
            </Text>
          </View>

          {/* C-Section Risk Warning Banner */}
          {profile.hasPriorCSection && (
            <View style={styles.warningBanner}>
              <View style={styles.warningHeaderRow}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTitle}>ELEVATED RISK NOTED</Text>
              </View>
              <Text style={styles.warningText}>
                Elevated risk noted. If labor begins, prioritize reaching real emergency help
                immediately.
              </Text>
            </View>
          )}

          <View style={styles.formCard}>
            {/* 1. Due Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Expected Due Date</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select Expected Due Date"
                style={({ pressed }) => [styles.inputPressable, pressed && styles.buttonPressed]}
                onPress={() => setShowDatePicker((prev) => !prev)}>
                <Text style={profile.dueDate ? styles.inputText : styles.placeholderText}>
                  {profile.dueDate || 'Select Due Date'}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </Pressable>

              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : styles.datePickerWrapper}>
                  <DateTimePicker
                    value={parseDateString(profile.dueDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor="#FFFFFF"
                    onChange={handleDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={styles.iosDoneButton}
                      onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.iosDoneButtonText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* 2. Blood Type Picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Blood Type</Text>
              <View style={styles.pillGrid}>
                {BLOOD_TYPES.map((type) => {
                  const isSelected = profile.bloodType === type;
                  return (
                    <Pressable
                      key={type}
                      style={[styles.bloodPill, isSelected && styles.bloodPillSelected]}
                      onPress={() => updateField('bloodType', type)}>
                      <Text
                        style={[
                          styles.bloodPillText,
                          isSelected && styles.bloodPillTextSelected,
                        ]}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3. Nearest Hospital Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nearest Hospital Name</Text>
              <TextInput
                style={styles.input}
                value={profile.hospitalName}
                onChangeText={(val) => updateField('hospitalName', val)}
                placeholder="e.g. City General Hospital, Salem"
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* 4. Emergency Contact (Name + Phone) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.input}
                value={profile.emergencyContactName}
                onChangeText={(val) => updateField('emergencyContactName', val)}
                placeholder="e.g. Ramesh (Husband / Family Member)"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={profile.emergencyContactPhone}
                onChangeText={(val) => updateField('emergencyContactPhone', val)}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
              />
            </View>

            {/* 5. Language Preference */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Language Preference</Text>
              <View style={styles.langRow}>
                {LANGUAGES.map((lang) => {
                  const isSelected = profile.language === lang;
                  return (
                    <Pressable
                      key={lang}
                      style={[styles.langButton, isSelected && styles.langButtonSelected]}
                      onPress={() => updateField('language', lang)}>
                      <Text
                        style={[
                          styles.langButtonText,
                          isSelected && styles.langButtonTextSelected,
                        ]}>
                        {lang}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 6. Prior C-Section Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Has there been a previous C-section?</Text>
                <Text style={styles.toggleSubtext}>
                  Surfaces prominent elevated risk guidance during labor
                </Text>
              </View>
              <Switch
                value={profile.hasPriorCSection}
                onValueChange={(val) => updateField('hasPriorCSection', val)}
                trackColor={{ false: '#374151', true: '#DC2626' }}
                thumbColor={profile.hasPriorCSection ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Feedback Toast */}
          {saveStatus && (
            <View style={styles.saveToast}>
              <Text style={styles.saveToastText}>✓ {saveStatus}</Text>
            </View>
          )}

          {/* 7. Save Profile Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save Profile"
            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },

  /* Warning Banner Styles */
  warningBanner: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  warningText: {
    color: '#FEE2E2',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },

  /* Form Card Styles */
  formCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 20,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  inputPressable: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  placeholderText: {
    fontSize: 15,
    color: '#6B7280',
  },
  calendarIcon: {
    fontSize: 16,
  },
  datePickerWrapper: {
    marginTop: 6,
  },
  iosDatePickerContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  iosDoneButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  iosDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Blood Type Pill Selector */
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodPill: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 50,
    alignItems: 'center',
  },
  bloodPillSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  bloodPillText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  bloodPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Language Selector */
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  langButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  langButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  langButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Toggle Row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  /* Save Button & Toast */
  saveToast: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveToastText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
