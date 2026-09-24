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
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
} from '@/lib/profile-storage';
import { getPremiumStatus } from '@/lib/revenuecat';

export default function ProfilesListScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load profiles on mount & when screen comes into focus
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getProfiles();
      const currentActive = await getActiveProfileId();
      setProfiles(list);
      setActiveId(currentActive);
    } catch (e) {
      console.error('Failed to load profiles:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectActive = async (profile: UserProfile) => {
    if (profile.id === activeId) return;

    try {
      await setActiveProfileId(profile.id);
      setActiveId(profile.id);
      setFeedbackMsg(`"${profile.name || 'Profile'}" set as active emergency profile!`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      console.error('Failed to set active profile:', e);
      Alert.alert('Error', 'Failed to change active profile.');
    }
  };

  const handleAddNew = async () => {
    try {
      const isPremium = await getPremiumStatus();
      if (!isPremium && profiles.length >= 1) {
        Alert.alert(
          'Premium Feature',
          'Multiple pregnancy profiles is a Catch Premium feature. Upgrade to unlock unlimited profiles.',
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

      // Navigate to profile form in create mode
      router.push('/profile?id=new');
    } catch (e) {
      console.error('Error checking premium status:', e);
      router.push('/profile?id=new');
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
          <Text style={styles.pageTitle}>Pregnancy Profiles</Text>
          <Text style={styles.pageSubtitle}>
            Manage profiles for maternal details, emergency contacts, and risk flags. The active profile is used during emergency assistance.
          </Text>
        </View>

        {/* Feedback Toast */}
        {feedbackMsg && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ {feedbackMsg}</Text>
          </View>
        )}

        {/* Profiles List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading profiles...</Text>
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Profiles Saved Yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first pregnancy profile to store essential maternal and emergency details.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {profiles.map((item, index) => {
              const isActive = item.id === activeId;
              const displayName = item.name || `Profile ${index + 1}`;

              return (
                <View
                  key={item.id}
                  style={[styles.profileCard, isActive && styles.profileCardActive]}>
                  {/* Active Header Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.profileNameText}>{displayName}</Text>
                      {item.hasPriorCSection && (
                        <View style={styles.csectionBadge}>
                          <Text style={styles.csectionBadgeText}>⚠️ C-Section Flagged</Text>
                        </View>
                      )}
                    </View>
                    {isActive ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.makeActiveButton, pressed && styles.buttonPressed]}
                        onPress={() => handleSelectActive(item)}>
                        <Text style={styles.makeActiveButtonText}>Set Active</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Card Details */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expected Due Date:</Text>
                      <Text style={styles.detailValue}>
                        {item.dueDate ? item.dueDate : 'Not specified'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Blood Type:</Text>
                      <Text style={styles.detailValue}>{item.bloodType || 'O+'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hospital:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {item.hospitalName || 'Not specified'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Emergency Contact:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {item.emergencyContactName
                          ? `${item.emergencyContactName} (${item.emergencyContactPhone || 'No phone'})`
                          : item.emergencyContactPhone || 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  {/* Card Actions */}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
                      onPress={() => router.push(`/profile?id=${item.id}`)}>
                      <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add New Profile Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add New Pregnancy Profile"
          style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
          onPress={handleAddNew}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Profile</Text>
        </Pressable>

        {/* Premium Note */}
        <Text style={styles.premiumNote}>
          Free tier includes 1 active profile. Upgrade to Catch Premium for unlimited profiles.
        </Text>
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
  emptyContainer: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  listContainer: {
    gap: 16,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#1F2937',
  },
  profileCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#0F172A',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  csectionBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  csectionBadgeText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  makeActiveButton: {
    backgroundColor: '#1E293B',
    borderColor: '#374151',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  makeActiveButtonText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsGrid: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 14,
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
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#1E293B',
    borderColor: '#374151',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  premiumNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
