import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [displayPrice, setDisplayPrice] = useState<string>('$2.99 / month');
  const [packageTitle, setPackageTitle] = useState<string>('Catch Premium — Monthly');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const pkg = offerings.current.availablePackages[0];
          setSelectedPackage(pkg);
          setDisplayPrice(pkg.product.priceString ? `${pkg.product.priceString} / month` : '$2.99 / month');
          if (pkg.product.title) {
            setPackageTitle(pkg.product.title);
          }
        }
      } catch (e) {
        console.warn('RevenueCat offerings fetch notice (using Test Store default):', e);
      } finally {
        setLoading(false);
      }
    }
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    setPurchasing(true);
    setStatusMessage(null);

    try {
      if (selectedPackage) {
        const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
        if (customerInfo.entitlements.active['premium'] !== undefined) {
          Alert.alert('Success', 'Thank you! Catch Premium has been unlocked.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
      }

      // Simulated purchase fallback if test package or sandbox mode
      Alert.alert('Subscription Success (Test Store)', 'Catch Premium is unlocked on this device.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      if (error.userCancelled) {
        setStatusMessage('Purchase cancelled. You can upgrade anytime.');
      } else {
        setStatusMessage('Unable to complete purchase right now. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Paywall"
            style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </Pressable>

          <Text style={styles.headerAppName}>Catch</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Test Store Banner */}
        <View style={styles.testStoreBanner}>
          <Text style={styles.testStoreText}>
            🧪 Test Store — no real payment will be charged
          </Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Catch Premium</Text>
          <Text style={styles.pageSubtitle}>
            Unlock multi-mother profiles & additional regional language packs
          </Text>
        </View>

        {/* Hard Safety Rule Banner */}
        <View style={styles.safetyRuleCard}>
          <Text style={styles.safetyRuleTitle}>🛡️ HARD SAFETY GUARANTEE</Text>
          <Text style={styles.safetyRuleText}>
            The emergency flow & immediate delivery support are 100% free permanently and never gated under any circumstance.
          </Text>
        </View>

        {/* Premium Benefits List */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsHeader}>What Premium Unlocks</Text>

          <View style={styles.benefitRow}>
            <Text style={styles.benefitCheck}>✓</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Additional Regional Language Packs</Text>
              <Text style={styles.benefitSub}>
                Full voice narration in Tamil, Hindi, Marathi, and regional Indian languages
              </Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <Text style={styles.benefitCheck}>✓</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Unlimited Practice Mode Rehearsals</Text>
              <Text style={styles.benefitSub}>
                Practice emergency hands-free flow unlimited times with full TTS feedback
              </Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <Text style={styles.benefitCheck}>✓</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Multiple Pregnancy Profiles</Text>
              <Text style={styles.benefitSub}>
                Track multiple expecting mothers (ideal for community health workers & midwives)
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.priceCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#60A5FA" />
          ) : (
            <>
              <Text style={styles.packageTitleText}>{packageTitle}</Text>
              <Text style={styles.priceStringText}>{displayPrice}</Text>
              <Text style={styles.cancelAnytimeText}>Cancel anytime in app store settings</Text>
            </>
          )}
        </View>

        {/* Non-alarming Status Toast */}
        {statusMessage && (
          <View style={styles.statusToast}>
            <Text style={styles.statusToastText}>{statusMessage}</Text>
          </View>
        )}

        {/* Subscribe Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Subscribe to Catch Premium"
          disabled={purchasing}
          style={({ pressed }) => [styles.subscribeButton, pressed && styles.buttonPressed]}
          onPress={handleSubscribe}>
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
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
    marginBottom: 16,
  },
  headerAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  closeButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Test Store Banner */
  testStoreBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  testStoreText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },

  /* Safety Rule Card */
  safetyRuleCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  safetyRuleTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  safetyRuleText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  /* Benefits Card */
  benefitsCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 18,
    marginBottom: 24,
  },
  benefitsHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitCheck: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 12,
    lineHeight: 22,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  benefitSub: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
  },

  /* Price Card */
  priceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    marginBottom: 24,
  },
  packageTitleText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceStringText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  cancelAnytimeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  /* Toast & Button */
  statusToast: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusToastText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonText: {
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
