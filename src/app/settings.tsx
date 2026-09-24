import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  UserProfile,
  getActiveProfile,
  saveProfile,
  SupportedLanguage,
  LANGUAGES,
} from '@/lib/profile-storage';
import { getPremiumStatus } from '@/lib/revenuecat';

export default function SettingsScreen() {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getActiveProfile();
      setActiveProfile(profile);
    } catch (e) {
      console.error('Failed to load active profile in settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    if (!activeProfile) return;
    if (activeProfile.language === lang) return;

    if (lang === 'Hindi') {
      try {
        const isPremium = await getPremiumStatus();
        if (!isPremium) {
          Alert.alert(
            'Premium Feature',
            'The Hindi language pack is a Catch Premium feature. Upgrade to unlock Hindi guidance.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'View Premium',
                onPress: () => router.push('/paywall'),
              },
            ]
          );
          return;
        }
      } catch (e) {
        console.error('Error checking premium status for Hindi:', e);
      }
    }

    try {
      const updated = await saveProfile({
        id: activeProfile.id,
        language: lang,
      });
      setActiveProfile(updated);
      setToastMsg(`Language preference set to ${lang}`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.error('Failed to update language preference:', e);
      Alert.alert('Error', 'Failed to update language setting.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
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
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>
            Manage emergency language preferences and view active maternal profile details.
          </Text>
        </View>

        {/* Feedback Toast */}
        {toastMsg && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ {toastMsg}</Text>
          </View>
        )}

        {/* 1. Language Preference Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Flow Language</Text>
          <Text style={styles.sectionSubtext}>
            Updates the spoken voice narration and displayed text in the Emergency & Practice flows for the active profile.
          </Text>

          <View style={styles.languageOptionsGroup}>
            {LANGUAGES.map((lang) => {
              const isSelected = activeProfile?.language === lang;
              const isHindi = lang === 'Hindi';

              return (
                <Pressable
                  key={lang}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${lang} language`}
                  style={({ pressed }) => [
                    styles.languageOption,
                    isSelected && styles.languageOptionSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleSelectLanguage(lang)}>
                  <View style={styles.languageLabelRow}>
                    <Text
                      style={[
                        styles.languageOptionText,
                        isSelected && styles.languageOptionTextSelected,
                      ]}>
                      {lang}
                    </Text>
                    {isHindi && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>👑 PREMIUM</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.radioButtonOuter}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Active Profile Summary (Read-Only) */}
        <View style={styles.sectionCard}>
          <View style={styles.profileSummaryHeader}>
            <Text style={styles.sectionTitle}>Active Profile Summary</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
              style={({ pressed }) => [styles.editProfileLink, pressed && styles.buttonPressed]}
              onPress={() => {
                if (activeProfile?.id) {
                  router.push(`/profile?id=${activeProfile.id}`);
                } else {
                  router.push('/profiles');
                }
              }}>
              <Text style={styles.editProfileLinkText}>✏️ Edit Profile</Text>
            </Pressable>
          </View>

          {loading ? (
            <Text style={styles.infoSubtext}>Loading active profile details...</Text>
          ) : !activeProfile ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.infoSubtext}>No active profile selected.</Text>
            </View>
          ) : (
            <View style={styles.profileDetailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Profile Name:</Text>
                <Text style={styles.detailValue}>{activeProfile.name || 'Profile 1'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expected Due Date:</Text>
                <Text style={styles.detailValue}>
                  {activeProfile.dueDate || 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Type:</Text>
                <Text style={styles.detailValue}>{activeProfile.bloodType || 'O+'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nearest Hospital:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {activeProfile.hospitalName || 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Emergency Contact:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {activeProfile.emergencyContactName
                    ? `${activeProfile.emergencyContactName} (${activeProfile.emergencyContactPhone || 'No phone'})`
                    : activeProfile.emergencyContactPhone || 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prior C-Section:</Text>
                <Text style={[styles.detailValue, activeProfile.hasPriorCSection && styles.warningValue]}>
                  {activeProfile.hasPriorCSection ? '⚠️ Flagged (Elevated Risk)' : 'None'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Manage Profiles Link */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage All Profiles"
          style={({ pressed }) => [styles.manageProfilesButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/profiles')}>
          <Text style={styles.manageProfilesButtonText}>📋 Manage All Pregnancy Profiles</Text>
        </Pressable>
      </ScrollView>
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
  toast: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  toastText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 16,
  },
  languageOptionsGroup: {
    gap: 12,
  },
  languageOption: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#0F172A',
  },
  languageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  languageOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  premiumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  radioButtonOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  editProfileLink: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  editProfileLinkText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  infoSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 12,
  },
  profileDetailsList: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  warningValue: {
    color: '#F87171',
  },
  manageProfilesButton: {
    backgroundColor: '#1E293B',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageProfilesButtonText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
