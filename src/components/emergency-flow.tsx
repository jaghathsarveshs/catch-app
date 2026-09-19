import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

type SequenceItem =
  | {
      type: 'step';
      stepNumber: number;
      totalSteps: number;
      phase: string;
      text: string;
      durationMs: number;
    }
  | {
      type: 'warning';
      title: string;
      phase: string;
      triggers: string[];
      responseRule: string;
      durationMs: number;
    };

const EMERGENCY_SEQUENCE: SequenceItem[] = [
  // Phase 1: Before birth
  {
    type: 'step',
    stepNumber: 1,
    totalSteps: 10,
    phase: 'BEFORE BIRTH',
    text: 'Call for help immediately (102/108)',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 2,
    totalSteps: 10,
    phase: 'BEFORE BIRTH',
    text: 'Call a known doctor/midwife if available',
    durationMs: 12000,
  },

  // Phase 2: Escalation warning card (15 seconds)
  {
    type: 'warning',
    title: 'If any of these happen, stop and get real help immediately',
    phase: 'CRITICAL SAFETY CHECK',
    triggers: [
      'Heavy / unusual bleeding',
      'Cord wrapped tightly around the neck',
      'Breech presentation',
      'Baby not breathing or responding',
      'Stalled labor',
      'Flagged prior C-section',
    ],
    responseRule: 'Get real help by any means — never attempt a DIY instruction.',
    durationMs: 15000,
  },

  // Phase 3: Supporting delivery
  {
    type: 'step',
    stepNumber: 3,
    totalSteps: 10,
    phase: 'SUPPORTING DELIVERY',
    text: 'Encourage pushing with contractions',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 4,
    totalSteps: 10,
    phase: 'SUPPORTING DELIVERY',
    text: 'Help find a comfortable position',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 5,
    totalSteps: 10,
    phase: 'SUPPORTING DELIVERY',
    text: "Support the baby's head and body gently as it emerges; never pull",
    durationMs: 12000,
  },

  // Phase 4: Immediately after birth
  {
    type: 'step',
    stepNumber: 6,
    totalSteps: 10,
    phase: 'IMMEDIATELY AFTER BIRTH',
    text: 'Dry and warm the baby (especially the head)',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 7,
    totalSteps: 10,
    phase: 'IMMEDIATELY AFTER BIRTH',
    text: 'Skin-to-skin contact',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 8,
    totalSteps: 10,
    phase: 'IMMEDIATELY AFTER BIRTH',
    text: 'Do not cut or tie the cord',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 9,
    totalSteps: 10,
    phase: 'IMMEDIATELY AFTER BIRTH',
    text: 'Do not pull the cord to deliver the placenta',
    durationMs: 12000,
  },
  {
    type: 'step',
    stepNumber: 10,
    totalSteps: 10,
    phase: 'IMMEDIATELY AFTER BIRTH',
    text: 'Reassure that some blood/fluid loss is normal',
    durationMs: 12000,
  },
];

const getSpeechText = (item: SequenceItem): string => {
  if (item.type === 'step') {
    return item.text;
  }
  return `${item.phase}. ${item.title}. ${item.triggers.join('. ')}. ${item.responseRule}`;
};

export interface EmergencyFlowProps {
  isPractice?: boolean;
}

export function EmergencyFlow({ isPractice = false }: EmergencyFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [shakeFeedback, setShakeFeedback] = useState<string | null>(null);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentItem = EMERGENCY_SEQUENCE[currentIndex];
  const isLast = currentIndex === EMERGENCY_SEQUENCE.length - 1;

  // Visual shake / action detection flash feedback
  const triggerFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setShakeFeedback(message);
    feedbackTimerRef.current = setTimeout(() => {
      setShakeFeedback(null);
    }, 2200);
  }, []);

  // 1. Action: Get an Ambulance (102) + GPS Location SMS Alert (or simulation in Practice Mode)
  const handleGetAmbulance = async () => {
    if (isPractice) {
      triggerFeedback('🧪 PRACTICE MODE: In a real emergency, this would dial 102 & send location SMS');
      return;
    }

    // Immediately open phone dialer for 102
    try {
      await Linking.openURL('tel:102');
    } catch (err) {
      console.error('Failed to open dialer for 102:', err);
    }

    // Concurrently fetch location & send SMS if emergency contact is configured
    try {
      const stored = await AsyncStorage.getItem('@catch_user_profile');
      if (stored) {
        const profile = JSON.parse(stored);
        const contactPhone = profile?.emergencyContactPhone?.trim();

        if (contactPhone) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          let mapsUrl = '';

          if (status === 'granted') {
            try {
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              mapsUrl = ` https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
            } catch (locErr) {
              console.warn('Could not retrieve current position:', locErr);
            }
          }

          const smsText = `Emergency - need help. My location:${mapsUrl || ' Location unavailable'}`;
          const smsUrl = `sms:${contactPhone}?body=${encodeURIComponent(smsText)}`;
          await Linking.openURL(smsUrl);
        }
      }
    } catch (smsErr) {
      console.warn('SMS alert step completed or skipped:', smsErr);
    }
  };

  // 2. Action: Talk to a Doctor (104) (or simulation in Practice Mode)
  const handleTalkToDoctor = async () => {
    if (isPractice) {
      triggerFeedback('🧪 PRACTICE MODE: In a real emergency, this would dial 104 medical consultation');
      return;
    }

    try {
      await Linking.openURL('tel:104');
    } catch (err) {
      console.error('Failed to open dialer for 104:', err);
    }
  };

  // Shared Action 1: Repeat current step & replay TTS
  const repeatCurrentStep = useCallback(() => {
    triggerFeedback('⚡ Repeat Step (Single Shake)');
    Speech.stop();
    const textToSpeak = getSpeechText(currentItem);
    Speech.speak(textToSpeak, { rate: 0.88 });
    setTimerKey((prev) => prev + 1);
  }, [currentItem, triggerFeedback]);

  // Shared Action 2: Go back to previous step
  const goBackStep = useCallback(() => {
    if (currentIndex > 0) {
      triggerFeedback('⚡ Go Back (Double Shake)');
      setCurrentIndex((prev) => prev - 1);
    } else {
      triggerFeedback('⚠️ Already at Step 1');
    }
  }, [currentIndex, triggerFeedback]);

  // TTS Narration Effect: speaks once per step change
  useEffect(() => {
    Speech.stop();
    const textToSpeak = getSpeechText(currentItem);
    Speech.speak(textToSpeak, {
      rate: 0.88,
    });

    return () => {
      Speech.stop();
    };
  }, [currentIndex, currentItem]);

  // Auto-advance timer (re-subscribes when timerKey or step changes)
  useEffect(() => {
    if (isLast) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, currentItem.durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, isLast, currentItem.durationMs, timerKey]);

  // Accelerometer Shake Detection (Single Shake = Repeat, Double Shake = Go Back)
  useEffect(() => {
    let pendingShakeTimer: ReturnType<typeof setTimeout> | null = null;
    let cooldown = false;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      if (cooldown) return;

      const totalG = Math.sqrt(x * x + y * y + z * z);
      const SHAKE_THRESHOLD = 1.9; // Intentional shake threshold in Gs

      if (totalG > SHAKE_THRESHOLD) {
        if (pendingShakeTimer) {
          // Second shake within 1.4s -> DOUBLE SHAKE (Go Back)
          clearTimeout(pendingShakeTimer);
          pendingShakeTimer = null;
          cooldown = true;

          goBackStep();

          setTimeout(() => {
            cooldown = false;
          }, 800);
        } else {
          // First shake -> start 1.4s detection window
          pendingShakeTimer = setTimeout(() => {
            pendingShakeTimer = null;
            cooldown = true;

            repeatCurrentStep();

            setTimeout(() => {
              cooldown = false;
            }, 600);
          }, 1200);
        }
      }
    });

    return () => {
      if (pendingShakeTimer) clearTimeout(pendingShakeTimer);
      subscription.remove();
    };
  }, [repeatCurrentStep, goBackStep]);

  const handleBack = () => {
    Speech.stop();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      {/* Practice Mode Top Banner */}
      {isPractice && (
        <View style={styles.practiceBanner}>
          <Text style={styles.practiceBannerText}>
            PRACTICE MODE — No real calls will be made
          </Text>
        </View>
      )}

      {/* Shake / Feedback Confirmation Toast */}
      {shakeFeedback && (
        <View style={[styles.shakeFeedbackBanner, isPractice && { top: 104 }]}>
          <Text style={styles.shakeFeedbackText}>{shakeFeedback}</Text>
        </View>
      )}

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={handleBack}>
          <Text style={styles.backButtonText}>← Home</Text>
        </Pressable>

        <Text style={styles.appName}>
          {isPractice ? 'Catch Practice' : 'Catch Emergency'}
        </Text>

        <View style={styles.counterBadge}>
          {currentItem.type === 'step' ? (
            <Text style={styles.counterText}>
              Step {currentItem.stepNumber} of {currentItem.totalSteps}
            </Text>
          ) : (
            <Text style={styles.warningBadgeText}>WARNING CARD</Text>
          )}
        </View>
      </View>

      {/* Persistent Emergency Direct Action Buttons */}
      <View style={styles.persistentEmergencyContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPractice ? "Practice Ambulance Button" : "Get an Ambulance - Dial 102"}
          style={({ pressed }) => [styles.ambulanceButton, pressed && styles.buttonPressed]}
          onPress={handleGetAmbulance}>
          <Text style={styles.ambulanceButtonTitle}>🚑 Get an Ambulance</Text>
          <Text style={styles.ambulanceButtonSub}>
            {isPractice ? 'Simulate 102 Call' : 'Dials 102 + SMS Alert'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPractice ? "Practice Doctor Button" : "Talk to a Doctor - Dial 104"}
          style={({ pressed }) => [styles.doctorButton, pressed && styles.buttonPressed]}
          onPress={handleTalkToDoctor}>
          <Text style={styles.doctorButtonTitle}>🩺 Talk to a Doctor</Text>
          <Text style={styles.doctorButtonSub}>
            {isPractice ? 'Simulate 104 Call' : 'Dials 104 Helpline'}
          </Text>
        </Pressable>
      </View>

      {/* Main Full-Screen Display Area */}
      <View style={styles.mainContent}>
        {currentItem.type === 'step' ? (
          <View style={styles.stepCard}>
            <View style={styles.phasePill}>
              <Text style={styles.phasePillText}>{currentItem.phase}</Text>
            </View>

            <View style={styles.stepTextContainer}>
              <Text style={styles.stepText}>{currentItem.text}</Text>
            </View>

            <View style={styles.autoAdvanceIndicator}>
              <Text style={styles.autoAdvanceText}>
                {isLast ? 'Sequence Complete' : `Auto-advancing in ${currentItem.durationMs / 1000}s…`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.warningCard}>
            <View style={styles.warningHeaderPill}>
              <Text style={styles.warningHeaderIcon}>⚠️</Text>
              <Text style={styles.warningHeaderPillText}>{currentItem.phase}</Text>
            </View>

            <Text style={styles.warningTitle}>{currentItem.title}</Text>

            <ScrollView style={styles.triggersList} contentContainerStyle={styles.triggersListContent}>
              {currentItem.triggers.map((trigger, idx) => (
                <View key={idx} style={styles.triggerRow}>
                  <Text style={styles.triggerBullet}>•</Text>
                  <Text style={styles.triggerText}>{trigger}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.responseRuleBox}>
              <Text style={styles.responseRuleText}>{currentItem.responseRule}</Text>
            </View>

            <View style={styles.warningTimerPill}>
              <Text style={styles.warningTimerText}>
                Staying on screen for 15s for critical safety…
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Backup Control Buttons */}
      <View style={styles.bottomControlsContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Repeat current step"
          style={({ pressed }) => [styles.controlButton, styles.repeatButton, pressed && styles.buttonPressed]}
          onPress={repeatCurrentStep}>
          <Text style={styles.controlButtonText}>↺ Repeat</Text>
          <Text style={styles.controlSubtext}>1 Shake</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to previous step"
          disabled={currentIndex === 0}
          style={({ pressed }) => [
            styles.controlButton,
            styles.goBackButton,
            currentIndex === 0 && styles.disabledButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={goBackStep}>
          <Text style={[styles.controlButtonText, currentIndex === 0 && styles.disabledButtonText]}>
            ⏮ Go Back
          </Text>
          <Text style={styles.controlSubtext}>2 Shakes</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  practiceBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceBannerText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
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
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  counterText: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
  },
  warningBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  persistentEmergencyContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  ambulanceButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  ambulanceButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  ambulanceButtonSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  doctorButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  doctorButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  doctorButtonSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  shakeFeedbackBanner: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  shakeFeedbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepCard: {
    width: '100%',
    maxWidth: 540,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  phasePill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  phasePillText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  stepTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  stepText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 0.2,
  },
  autoAdvanceIndicator: {
    marginTop: 36,
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  autoAdvanceText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  warningCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 24,
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  warningHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  warningHeaderIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  warningHeaderPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  warningTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 16,
  },
  triggersList: {
    flex: 1,
    maxHeight: 220,
    marginBottom: 16,
  },
  triggersListContent: {
    gap: 10,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  triggerBullet: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 10,
    lineHeight: 22,
  },
  triggerText: {
    color: '#FEE2E2',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  responseRuleBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 14,
  },
  responseRuleText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  warningTimerPill: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  warningTimerText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControlsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#374151',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatButton: {
    borderColor: '#3B82F6',
  },
  goBackButton: {
    borderColor: '#374151',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  controlSubtext: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: '#1F2937',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
