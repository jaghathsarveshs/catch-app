import React from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>OFFLINE READY</Text>
          </View>
          <Text style={styles.title}>Catch</Text>
          <Text style={styles.subtitle}>Support the push.</Text>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.buttonContainer}>
          {/* 1. Emergency Now Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emergency Now - Voice guided immediate delivery support"
            style={({ pressed }) => [
              styles.button,
              styles.emergencyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push('/emergency');
            }}>
            <View style={styles.buttonTextContainer}>
              <View style={styles.buttonHeaderRow}>
                <Text style={styles.emergencyButtonText}>Emergency Now</Text>
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>CRITICAL</Text>
                </View>
              </View>
              <Text style={styles.emergencySubtext}>
                Voice-guided immediate delivery support & fast emergency dispatch
              </Text>
            </View>
          </Pressable>

          {/* 2. Practice Mode Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Practice Mode - Simulate emergency flow without real calls"
            style={({ pressed }) => [
              styles.button,
              styles.practiceButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push('/practice');
            }}>
            <View style={styles.buttonTextContainer}>
              <View style={styles.buttonHeaderRow}>
                <Text style={styles.practiceButtonText}>Practice Mode</Text>
                <View style={styles.practiceBadge}>
                  <Text style={styles.practiceBadgeText}>SIMULATION</Text>
                </View>
              </View>
              <Text style={styles.practiceSubtext}>
                Run hands-free delivery rehearsal with no real emergency calls
              </Text>
            </View>
          </Pressable>

          {/* 3. My Profile Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My Profile - Due date, blood group, emergency contact"
            style={({ pressed }) => [
              styles.button,
              styles.profileButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push('/profiles');
            }}>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.profileButtonText}>My Profile</Text>
              <Text style={styles.profileSubtext}>
                Manage due date, blood group, hospital & emergency contacts
              </Text>
            </View>
          </Pressable>

          {/* 4. Contraction Timer Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Contraction Timer - Log labor duration and interval spacing"
            style={({ pressed }) => [
              styles.button,
              styles.timerButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push('/contraction-timer');
            }}>
            <View style={styles.buttonTextContainer}>
              <View style={styles.buttonHeaderRow}>
                <Text style={styles.timerButtonText}>Contraction Timer</Text>
                <View style={styles.timerBadge}>
                  <Text style={styles.timerBadgeText}>LABOR LOG</Text>
                </View>
              </View>
              <Text style={styles.timerSubtext}>
                Log contraction duration & interval spacing between contractions
              </Text>
            </View>
          </Pressable>

          {/* 5. Go Premium Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go Premium - Unlock additional languages and multi-mother profiles"
            style={({ pressed }) => [
              styles.button,
              styles.premiumButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push('/paywall');
            }}>
            <View style={styles.buttonTextContainer}>
              <View style={styles.buttonHeaderRow}>
                <Text style={styles.premiumButtonText}>Go Premium</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>UNLOCKED</Text>
                </View>
              </View>
              <Text style={styles.premiumSubtext}>
                Unlock additional language packs, unlimited rehearsals & multi-mother profiles
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Designed for bystanders • Direct bridge to 102 & 104 emergency help
          </Text>
        </View>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 18,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  buttonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  buttonTextContainer: {
    flexDirection: 'column',
  },

  /* Emergency Button Styles */
  emergencyButton: {
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  emergencySubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    fontWeight: '400',
  },
  emergencyBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Practice Mode Button Styles */
  practiceButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  practiceButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.2,
  },
  practiceSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    fontWeight: '400',
  },
  practiceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  practiceBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  /* My Profile Button Styles */
  profileButton: {
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  profileButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F3F4F6',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontWeight: '400',
  },

  /* Contraction Timer Button Styles */
  timerButton: {
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  timerButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.2,
  },
  timerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  timerBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timerSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontWeight: '400',
  },

  /* Go Premium Button Styles */
  premiumButton: {
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  premiumButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.2,
  },
  premiumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  premiumBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  premiumSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontWeight: '400',
  },

  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
});