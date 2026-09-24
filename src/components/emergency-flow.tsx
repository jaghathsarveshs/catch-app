import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveProfile } from '@/lib/profile-storage';
import * as Location from 'expo-location';
import { getTranslation, SequenceItem, SupportedLanguage } from '@/constants/translations';
import { getPremiumStatus } from '@/lib/revenuecat';

const getSpeechText = (item: SequenceItem): string => {
  if (item.type === 'step') {
    return item.text.replace(/\//g, ' or ');
  }
  return `${item.phase}. ${item.title}. ${item.triggers.join('. ')}. ${item.responseRule}`.replace(/\//g, ' or ');
};

export interface EmergencyFlowProps {
  isPractice?: boolean;
}

export function EmergencyFlow({ isPractice = false }: EmergencyFlowProps) {
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>('English');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [shakeFeedback, setShakeFeedback] = useState<string | null>(null);
  const [showGestureIntro, setShowGestureIntro] = useState<boolean>(false);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load active profile's language preference on mount, with premium gate check
  useEffect(() => {
    async function loadProfileLanguage() {
      try {
        const activeProfile = await getActiveProfile();
        if (activeProfile?.language) {
          if (activeProfile.language === 'Hindi') {
            const isPremium = await getPremiumStatus();
            if (!isPremium) {
              console.warn(
                '[Language Fallback] Active profile language is set to Hindi, but user is on free tier. Gracefully falling back to English.'
              );
              setActiveLanguage('English');
              return;
            }
          }
          setActiveLanguage(activeProfile.language);
        }
      } catch (err) {
        console.warn('Failed to load profile language:', err);
      }
    }
    loadProfileLanguage();
  }, []);

  // Check first-time shake gesture intro display
  useEffect(() => {
    async function checkGestureIntro() {
      try {
        const hasSeen = await AsyncStorage.getItem('@catch_has_seen_gesture_intro');
        if (!hasSeen) {
          setShowGestureIntro(true);
        }
      } catch (err) {
        console.warn('Failed to check gesture intro key:', err);
      }
    }
    checkGestureIntro();
  }, []);

  const dismissGestureIntro = async () => {
    setShowGestureIntro(false);
    try {
      await AsyncStorage.setItem('@catch_has_seen_gesture_intro', 'true');
    } catch (err) {
      console.warn('Failed to save gesture intro key:', err);
    }
  };

  const translationSet = getTranslation(activeLanguage);
  const sequence = translationSet.sequence;
  const englishSequence = getTranslation('English').sequence;

  const isCompleted = currentIndex >= sequence.length;
  const currentItem = !isCompleted ? sequence[currentIndex] : null;

  const [secondsLeft, setSecondsLeft] = useState<number>(
    currentItem ? Math.round(currentItem.durationMs / 1000) : 0
  );

  const totalDurationSecs = currentItem ? Math.round(currentItem.durationMs / 1000) : 12;
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / totalDurationSecs));

  // Robust TTS function with fallback to English if device TTS voice is missing/fails
  const speakCurrentStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= sequence.length) return;

      const item = sequence[index];
      const englishItem = englishSequence[index];

      const targetText = getSpeechText(item);
      const fallbackText = getSpeechText(englishItem);
      const locale = translationSet.locale;

      Speech.stop();

      if (locale === 'en-IN') {
        Speech.speak(targetText, { rate: 0.88 });
        return;
      }

      let fallbackTriggered = false;
      try {
        Speech.speak(targetText, {
          language: locale,
          rate: 0.88,
          onError: (err) => {
            if (!fallbackTriggered) {
              fallbackTriggered = true;
              console.warn(
                `[TTS Warning] Voice for locale '${locale}' failed or is not installed. Falling back to English TTS:`,
                err
              );
              Speech.stop();
              Speech.speak(fallbackText, { language: 'en-IN', rate: 0.88 });
            }
          },
        });
      } catch (err) {
        console.warn(
          `[TTS Warning] Synchronous error speaking locale '${locale}'. Falling back to English TTS:`,
          err
        );
        Speech.stop();
        Speech.speak(fallbackText, { language: 'en-IN', rate: 0.88 });
      }
    },
    [sequence, englishSequence, translationSet.locale]
  );

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

    try {
      await Linking.openURL('tel:102');
    } catch (err) {
      console.error('Failed to open dialer for 102:', err);
    }

    try {
      const activeProfile = await getActiveProfile();
      if (activeProfile) {
        const contactPhone = activeProfile.emergencyContactPhone?.trim();

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

          const profileName = activeProfile.name?.trim();
          const subjectText = profileName ? `${profileName} needs help` : 'need help';
          const smsText = `Emergency - ${subjectText}. My location:${mapsUrl || ' Location unavailable'}`;
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
    if (isCompleted || !currentItem) return;
    triggerFeedback('⚡ Repeat Step (Single Shake)');
    speakCurrentStep(currentIndex);
    setTimerKey((prev) => prev + 1);
  }, [currentIndex, currentItem, isCompleted, speakCurrentStep, triggerFeedback]);

  // Shared Action 2: Go back to previous step
  const goBackStep = useCallback(() => {
    if (currentIndex > 0) {
      triggerFeedback('⚡ Go Back (Double Shake)');
      Speech.stop();
      setCurrentIndex((prev) => prev - 1);
    } else {
      triggerFeedback('⚠️ Already at Step 1');
    }
  }, [currentIndex, triggerFeedback]);

  // Shared Action 3: Advance to next step immediately
  const goNextStep = useCallback(() => {
    if (currentIndex < sequence.length) {
      triggerFeedback('⏭ Next Step');
      Speech.stop();
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, sequence.length, triggerFeedback]);

  // Restart sequence from beginning
  const handleRestart = () => {
    Speech.stop();
    setCurrentIndex(0);
    setTimerKey((prev) => prev + 1);
  };

  // TTS Narration Effect: speaks once per step change
  useEffect(() => {
    if (isCompleted || !currentItem) {
      Speech.stop();
      return;
    }

    speakCurrentStep(currentIndex);

    return () => {
      Speech.stop();
    };
  }, [currentIndex, currentItem, isCompleted, speakCurrentStep]);

  // Live 1-Second Countdown Timer Effect
  useEffect(() => {
    if (isCompleted || !currentItem) return;

    const initialSecs = Math.round(currentItem.durationMs / 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(initialSecs);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCurrentIndex((curr) => curr + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, currentItem, timerKey, isCompleted]);

  // Accelerometer Shake Detection (Single Shake = Repeat, Double Shake = Go Back)
  useEffect(() => {
    if (isCompleted) return;

    let pendingShakeTimer: ReturnType<typeof setTimeout> | null = null;
    let cooldown = false;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      if (cooldown) return;

      const totalG = Math.sqrt(x * x + y * y + z * z);
      const SHAKE_THRESHOLD = 1.9;

      if (totalG > SHAKE_THRESHOLD) {
        if (pendingShakeTimer) {
          clearTimeout(pendingShakeTimer);
          pendingShakeTimer = null;
          cooldown = true;

          goBackStep();

          setTimeout(() => {
            cooldown = false;
          }, 800);
        } else {
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
  }, [repeatCurrentStep, goBackStep, isCompleted]);

  const handleBack = () => {
    Speech.stop();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Full-Screen Completion View
  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

        {/* Practice Mode Top Banner */}
        {isPractice && (
          <View style={styles.practiceBanner}>
            <Text style={styles.practiceBannerText}>
              {translationSet.ui.practiceModeBanner}
            </Text>
          </View>
        )}

        {/* Shake / Action Toast */}
        {shakeFeedback && (
          <View style={[styles.shakeFeedbackBanner, isPractice && { top: 104 }]}>
            <Text style={styles.shakeFeedbackText}>{shakeFeedback}</Text>
          </View>
        )}

        {/* Top Header - Simpler 3-part layout */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={handleBack}>
            <Text style={styles.backButtonText}>← Home</Text>
          </Pressable>

          <View style={styles.headerCenterContainer}>
            <View style={styles.counterBadge}>
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
            onPress={() => {
              Speech.stop();
              router.push('/settings');
            }}>
            <Text style={styles.settingsButtonIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Persistent Emergency Direct Action Buttons */}
        <View style={styles.persistentEmergencyContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPractice ? 'Practice Ambulance Button' : 'Get an Ambulance - Dial 102'}
            style={({ pressed }) => [styles.ambulanceButton, pressed && styles.buttonPressed]}
            onPress={handleGetAmbulance}>
            <Text style={styles.ambulanceButtonTitle}>{translationSet.buttons.getAmbulance}</Text>
            <Text style={styles.ambulanceButtonSub}>
              {isPractice
                ? translationSet.buttons.getAmbulanceSubPractice
                : translationSet.buttons.getAmbulanceSub}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPractice ? 'Practice Doctor Button' : 'Talk to a Doctor - Dial 104'}
            style={({ pressed }) => [styles.doctorButton, pressed && styles.buttonPressed]}
            onPress={handleTalkToDoctor}>
            <Text style={styles.doctorButtonTitle}>{translationSet.buttons.talkToDoctor}</Text>
            <Text style={styles.doctorButtonSub}>
              {isPractice
                ? translationSet.buttons.talkToDoctorSubPractice
                : translationSet.buttons.talkToDoctorSub}
            </Text>
          </Pressable>
        </View>

        {/* Full-Screen Completion Card */}
        <ScrollView
          style={styles.mainContentContainer}
          contentContainerStyle={styles.mainContentScrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.completedCard}>
            <View style={styles.completedBadgeIcon}>
              <Text style={styles.completedIconText}>✓</Text>
            </View>

            <Text style={styles.completedTitle}>
              {isPractice
                ? translationSet.completion.titlePractice
                : translationSet.completion.titleEmergency}
            </Text>

            <Text style={styles.completedSubtitle}>
              {isPractice
                ? translationSet.completion.subtitlePractice
                : translationSet.completion.subtitleEmergency}
            </Text>

            <View style={styles.completionActionsContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restart Sequence"
                style={({ pressed }) => [styles.restartButton, pressed && styles.buttonPressed]}
                onPress={handleRestart}>
                <Text style={styles.restartButtonText}>{translationSet.buttons.restartSequence}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Return to Home"
                style={({ pressed }) => [styles.returnHomeButton, pressed && styles.buttonPressed]}
                onPress={handleBack}>
                <Text style={styles.returnHomeButtonText}>{translationSet.buttons.returnHome}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active Flow Step View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      {/* Practice Mode Top Banner */}
      {isPractice && (
        <View style={styles.practiceBanner}>
          <Text style={styles.practiceBannerText}>
            {translationSet.ui.practiceModeBanner}
          </Text>
        </View>
      )}

      {/* Shake / Action Toast */}
      {shakeFeedback && (
        <View style={[styles.shakeFeedbackBanner, isPractice && { top: 104 }]}>
          <Text style={styles.shakeFeedbackText}>{shakeFeedback}</Text>
        </View>
      )}

      {/* Top Header - Simpler 3-part layout (Home, Step Counter, Settings) */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={handleBack}>
          <Text style={styles.backButtonText}>← Home</Text>
        </Pressable>

        <View style={styles.headerCenterContainer}>
          <View style={styles.counterBadge}>
            {currentItem!.type === 'step' ? (
              <Text style={styles.counterText} numberOfLines={1}>
                {translationSet.ui.step} {currentItem!.stepNumber} {translationSet.ui.of} {currentItem!.totalSteps}
              </Text>
            ) : (
              <Text style={styles.warningBadgeText} numberOfLines={1}>
                {translationSet.ui.warningCard}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
          onPress={() => {
            Speech.stop();
            router.push('/settings');
          }}>
          <Text style={styles.settingsButtonIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* First-Time Shake Gesture Intro Tooltip */}
      {showGestureIntro && (
        <View style={styles.gestureIntroBanner}>
          <Text style={styles.gestureIntroText}>
            💡 <Text style={{ fontWeight: '800' }}>Hands-Free Controls:</Text> Shake phone once to repeat step, twice to go back.
          </Text>
          <Pressable style={styles.gestureIntroDismiss} onPress={dismissGestureIntro}>
            <Text style={styles.gestureIntroDismissText}>Got it</Text>
          </Pressable>
        </View>
      )}

      {/* Persistent Emergency Direct Action Buttons */}
      <View style={styles.persistentEmergencyContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPractice ? 'Practice Ambulance Button' : 'Get an Ambulance - Dial 102'}
          style={({ pressed }) => [styles.ambulanceButton, pressed && styles.buttonPressed]}
          onPress={handleGetAmbulance}>
          <Text style={styles.ambulanceButtonTitle}>{translationSet.buttons.getAmbulance}</Text>
          <Text style={styles.ambulanceButtonSub}>
            {isPractice
              ? translationSet.buttons.getAmbulanceSubPractice
              : translationSet.buttons.getAmbulanceSub}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPractice ? 'Practice Doctor Button' : 'Talk to a Doctor - Dial 104'}
          style={({ pressed }) => [styles.doctorButton, pressed && styles.buttonPressed]}
          onPress={handleTalkToDoctor}>
          <Text style={styles.doctorButtonTitle}>{translationSet.buttons.talkToDoctor}</Text>
          <Text style={styles.doctorButtonSub}>
            {isPractice
              ? translationSet.buttons.talkToDoctorSubPractice
              : translationSet.buttons.talkToDoctorSub}
          </Text>
        </Pressable>
      </View>

      {/* Main Full-Screen Display Area */}
      <ScrollView
        style={styles.mainContentContainer}
        contentContainerStyle={styles.mainContentScrollContent}
        showsVerticalScrollIndicator={false}>
        {currentItem!.type === 'step' ? (
          <View style={styles.stepCard}>
            <View style={styles.phasePill}>
              <Text style={styles.phasePillText}>{currentItem!.phase}</Text>
            </View>

            <View style={styles.stepTextContainer}>
              <Text style={styles.stepText}>{currentItem!.text}</Text>
            </View>

            <View style={styles.autoAdvanceIndicator}>
              <Text style={styles.autoAdvanceText}>
                {translationSet.ui.autoAdvancingIn} {secondsLeft}s…
              </Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.warningCard}>
            <View style={styles.warningHeaderPill}>
              <Text style={styles.warningHeaderIcon}>⚠️</Text>
              <Text style={styles.warningHeaderPillText}>{currentItem!.phase}</Text>
            </View>

            <Text style={styles.warningTitle}>{currentItem!.title}</Text>

            <View style={styles.triggersList}>
              {currentItem!.triggers.map((trigger, idx) => (
                <View key={idx} style={styles.triggerRow}>
                  <Text style={styles.triggerBullet}>•</Text>
                  <Text style={styles.triggerText}>{trigger}</Text>
                </View>
              ))}
            </View>

            <View style={styles.responseRuleBox}>
              <Text style={styles.responseRuleText}>{currentItem!.responseRule}</Text>
            </View>

            <View style={styles.warningTimerPill}>
              <Text style={styles.warningTimerText}>
                {translationSet.ui.stayingOnScreenFor} {secondsLeft}s…
              </Text>
              <View style={styles.warningProgressTrack}>
                <View style={[styles.warningProgressFill, { width: `${progressRatio * 100}%` }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Backup Control Buttons (Decluttered: Go Back, Repeat, Next) */}
      <View style={styles.bottomControlsContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to previous step"
          disabled={currentIndex === 0}
          style={({ pressed }) => [
            styles.controlButton,
            currentIndex === 0 && styles.disabledButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={goBackStep}>
          <Text style={[styles.controlButtonText, currentIndex === 0 && styles.disabledButtonText]}>
            {translationSet.buttons.goBack}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Repeat current step"
          style={({ pressed }) => [styles.controlButton, styles.repeatButton, pressed && styles.buttonPressed]}
          onPress={repeatCurrentStep}>
          <Text style={styles.controlButtonText}>{translationSet.buttons.repeat}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Advance to next step"
          style={({ pressed }) => [styles.controlButton, styles.nextButton, pressed && styles.buttonPressed]}
          onPress={goNextStep}>
          <Text style={styles.controlButtonText}>{translationSet.buttons.next}</Text>
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
    paddingHorizontal: 16,
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
  headerCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  settingsButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonIcon: {
    fontSize: 16,
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
  completedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gestureIntroBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  gestureIntroText: {
    color: '#DBEAFE',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  gestureIntroDismiss: {
    backgroundColor: '#2563EB',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gestureIntroDismissText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  persistentEmergencyContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  ambulanceButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  ambulanceButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  ambulanceButtonSub: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  doctorButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  doctorButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  doctorButtonSub: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  shakeFeedbackBanner: {
    position: 'absolute',
    top: 58,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  shakeFeedbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mainContentContainer: {
    flex: 1,
    width: '100%',
  },
  mainContentScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  phasePill: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  phasePillText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  stepTextContainer: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  stepText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    flexWrap: 'wrap',
  },
  autoAdvanceIndicator: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  autoAdvanceText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  warningCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 500,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    minHeight: 320,
  },
  warningHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  warningHeaderIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  warningHeaderPillText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    flexWrap: 'wrap',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 25,
    flexWrap: 'wrap',
  },
  triggersList: {
    width: '100%',
    marginBottom: 14,
  },
  triggersListContent: {
    gap: 8,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  triggerBullet: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
    lineHeight: 20,
  },
  triggerText: {
    color: '#FEE2E2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  responseRuleBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F87171',
    marginBottom: 12,
  },
  responseRuleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  warningTimerPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  warningTimerText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  warningProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  warningProgressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  completedCard: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 28,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  completedBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completedIconText: {
    color: '#34D399',
    fontSize: 32,
    fontWeight: '900',
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
    flexWrap: 'wrap',
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  completionActionsContainer: {
    width: '100%',
    gap: 12,
  },
  restartButton: {
    backgroundColor: '#1E293B',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexWrap: 'wrap',
  },
  returnHomeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  returnHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flexWrap: 'wrap',
  },
  bottomControlsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  repeatButton: {
    borderColor: '#3B82F6',
  },
  nextButton: {
    borderColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.4,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
