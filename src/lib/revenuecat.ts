import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

let isInitialized = false;

/**
 * Initializes RevenueCat Purchases SDK once on app startup.
 * Safely handles missing keys, web platform, or unbuilt native modules.
 */
export async function initRevenueCat(): Promise<void> {
  if (isInitialized) return;

  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] No EXPO_PUBLIC_REVENUECAT_API_KEY env variable found.');
    return;
  }

  // Web platform fallback
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Skipping Purchases initialization on Web platform.');
    return;
  }

  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    isInitialized = true;
    console.log('[RevenueCat] Successfully initialized RevenueCat Purchases.');
  } catch (error) {
    console.warn('[RevenueCat] Failed to initialize (falling back to non-premium):', error);
  }
}

/**
 * Checks whether the current user has an active "premium" entitlement.
 * Returns false on error or uninitialized state.
 */
export async function getPremiumStatus(): Promise<boolean> {
  if (!isInitialized) {
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    return isPremium;
  } catch (error) {
    console.warn('[RevenueCat] Failed to fetch CustomerInfo (returning non-premium):', error);
    return false;
  }
}
