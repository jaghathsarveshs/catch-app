import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROFILES_STORAGE_KEY = '@catch_profiles';
export const ACTIVE_PROFILE_ID_KEY = '@catch_active_profile_id';
export const OLD_STORAGE_KEY = '@catch_user_profile';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const LANGUAGES = ['English', 'Tamil', 'Hindi'] as const;
export type Language = (typeof LANGUAGES)[number];
export type SupportedLanguage = Language;

export interface UserProfile {
  id: string;
  name?: string;
  dueDate: string;
  bloodType: string;
  hospitalName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  language: Language;
  hasPriorCSection: boolean;
  createdAt?: number;
}

export const DEFAULT_PROFILE_VALUES: Omit<UserProfile, 'id'> = {
  name: 'Profile 1',
  dueDate: '',
  bloodType: 'O+',
  hospitalName: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  language: 'English',
  hasPriorCSection: false,
};

/**
 * Migrate legacy single profile (@catch_user_profile) to multi-profile model (@catch_profiles).
 * Preserves all user data without loss.
 */
export async function getProfiles(): Promise<UserProfile[]> {
  try {
    const rawProfiles = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as UserProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p, idx) => ({
          ...p,
          id: p.id || `profile_${Date.now()}_${idx}`,
          name: p.name || `Profile ${idx + 1}`,
        }));
      }
    }

    // Check for legacy single profile if multi-profile array doesn't exist
    const legacyRaw = await AsyncStorage.getItem(OLD_STORAGE_KEY);
    if (legacyRaw) {
      const legacyObj = JSON.parse(legacyRaw) as Partial<UserProfile>;
      const newId = `profile_${Date.now()}`;
      const migratedProfile: UserProfile = {
        ...DEFAULT_PROFILE_VALUES,
        ...legacyObj,
        id: newId,
        name: legacyObj.name || 'Profile 1',
        createdAt: Date.now(),
      };

      const initialArray = [migratedProfile];
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(initialArray));
      await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, newId);
      await AsyncStorage.removeItem(OLD_STORAGE_KEY);

      return initialArray;
    }

    return [];
  } catch (err) {
    console.error('Error fetching/migrating profiles:', err);
    return [];
  }
}

/**
 * Gets the current active profile ID. If unset or invalid, defaults to the first profile's ID.
 */
export async function getActiveProfileId(): Promise<string | null> {
  try {
    const profiles = await getProfiles();
    if (profiles.length === 0) return null;

    const storedActiveId = await AsyncStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    if (storedActiveId && profiles.some((p) => p.id === storedActiveId)) {
      return storedActiveId;
    }

    // Fallback to first profile
    const defaultActiveId = profiles[0].id;
    await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, defaultActiveId);
    return defaultActiveId;
  } catch (err) {
    console.error('Error getting active profile ID:', err);
    return null;
  }
}

/**
 * Gets the active UserProfile object.
 */
export async function getActiveProfile(): Promise<UserProfile | null> {
  try {
    const profiles = await getProfiles();
    if (profiles.length === 0) return null;

    const activeId = await getActiveProfileId();
    const activeProfile = profiles.find((p) => p.id === activeId);

    return activeProfile || profiles[0] || null;
  } catch (err) {
    console.error('Error getting active profile:', err);
    return null;
  }
}

/**
 * Sets the active profile ID.
 */
export async function setActiveProfileId(id: string): Promise<void> {
  try {
    const profiles = await getProfiles();
    if (profiles.some((p) => p.id === id)) {
      await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
    }
  } catch (err) {
    console.error('Error setting active profile ID:', err);
  }
}

/**
 * Retrieves a single profile by ID.
 */
export async function getProfileById(id: string): Promise<UserProfile | null> {
  try {
    const profiles = await getProfiles();
    return profiles.find((p) => p.id === id) || null;
  } catch (err) {
    console.error('Error getting profile by ID:', err);
    return null;
  }
}

/**
 * Saves or updates a profile in the profiles list.
 */
export async function saveProfile(profileToSave: Partial<UserProfile> & { id?: string }): Promise<UserProfile> {
  const profiles = await getProfiles();
  const existingIdx = profileToSave.id ? profiles.findIndex((p) => p.id === profileToSave.id) : -1;

  let finalProfile: UserProfile;

  if (existingIdx >= 0) {
    finalProfile = {
      ...profiles[existingIdx],
      ...profileToSave,
      id: profiles[existingIdx].id,
      name: profileToSave.name?.trim() || profiles[existingIdx].name || `Profile ${existingIdx + 1}`,
    };
    profiles[existingIdx] = finalProfile;
  } else {
    const newId = profileToSave.id || `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profileNum = profiles.length + 1;
    finalProfile = {
      ...DEFAULT_PROFILE_VALUES,
      ...profileToSave,
      id: newId,
      name: profileToSave.name?.trim() || `Profile ${profileNum}`,
      createdAt: Date.now(),
    };
    profiles.push(finalProfile);
  }

  await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));

  // If this is the only profile or newly created, set as active
  if (profiles.length === 1 || existingIdx < 0) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, finalProfile.id);
  }

  return finalProfile;
}

/**
 * Deletes a profile by ID.
 */
export async function deleteProfile(id: string): Promise<UserProfile[]> {
  try {
    let profiles = await getProfiles();
    const activeId = await getActiveProfileId();

    profiles = profiles.filter((p) => p.id !== id);
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));

    if (activeId === id) {
      if (profiles.length > 0) {
        await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, profiles[0].id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      }
    }

    return profiles;
  } catch (err) {
    console.error('Error deleting profile:', err);
    return [];
  }
}
