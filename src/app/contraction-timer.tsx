import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@catch_contraction_history';

export interface ContractionLog {
  id: string;
  startTime: number; // Unix timestamp in ms
  endTime: number; // Unix timestamp in ms
  durationSeconds: number;
  intervalSeconds: number | null; // time since PREVIOUS contraction start
}

export default function ContractionTimerScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ContractionLog[]>([]);
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load contraction history from AsyncStorage on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ContractionLog[];
          setHistory(parsed);
        }
      } catch (e) {
        console.error('Failed to load contraction history:', e);
      }
    }
    loadHistory();
  }, []);

  // Timer tick effect when active
  useEffect(() => {
    if (isTiming) {
      intervalTimerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(diff);
        }
      }, 500);
    } else {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    }

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [isTiming]);

  // Start or Stop contraction timing
  const toggleTimer = async () => {
    if (!isTiming) {
      // Start timing
      const now = Date.now();
      startTimeRef.current = now;
      setElapsedSeconds(0);
      setIsTiming(true);
    } else {
      // Stop timing & log contraction
      const endTime = Date.now();
      const startTime = startTimeRef.current || endTime;
      const durationSeconds = Math.max(1, Math.floor((endTime - startTime) / 1000));

      // Compute interval since PREVIOUS contraction start
      let intervalSeconds: number | null = null;
      if (history.length > 0) {
        const previousStartTime = history[0].startTime;
        intervalSeconds = Math.max(1, Math.floor((startTime - previousStartTime) / 1000));
      }

      const newLog: ContractionLog = {
        id: String(endTime),
        startTime,
        endTime,
        durationSeconds,
        intervalSeconds,
      };

      const updatedHistory = [newLog, ...history];
      setHistory(updatedHistory);
      setIsTiming(false);
      setElapsedSeconds(0);
      startTimeRef.current = null;

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Failed to save contraction history:', e);
      }
    }
  };

  // Clear history with confirmation prompt
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Contraction History?',
      'Are you sure you want to delete all logged contraction records? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
            } catch (e) {
              console.error('Failed to clear history:', e);
            }
          },
        },
      ]
    );
  };

  // Calculate summary metrics
  const totalLogged = history.length;
  const validIntervals = history
    .map((item) => item.intervalSeconds)
    .filter((val): val is number => val !== null);

  const avgIntervalMinutes =
    validIntervals.length > 0
      ? (validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length / 60).toFixed(1)
      : null;

  // Format helpers
  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const formatInterval = (secs: number | null) => {
    if (secs === null) return 'First entry';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const formatTimeStr = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
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
            <Text style={styles.backButtonText}>← Home</Text>
          </Pressable>
          <Text style={styles.headerAppName}>Catch</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Contraction Timer</Text>
          <Text style={styles.pageSubtitle}>
            Log contraction durations & intervals to monitor labor progress
          </Text>
        </View>

        {/* Running Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalLogged}</Text>
            <Text style={styles.summaryLabel}>Contractions Logged</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {avgIntervalMinutes ? `${avgIntervalMinutes} min` : 'N/A'}
            </Text>
            <Text style={styles.summaryLabel}>Average Interval</Text>
          </View>
        </View>

        {/* Main Timer Display & Large Toggle Button */}
        <View style={styles.timerCard}>
          <Text style={styles.timerDigits}>{formatTimerDigits(elapsedSeconds)}</Text>
          <Text style={styles.timerStatusText}>
            {isTiming ? 'Timing contraction…' : 'Tap Start when contraction begins'}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isTiming ? 'Stop Contraction' : 'Start Contraction'}
            style={({ pressed }) => [
              styles.timerButton,
              isTiming ? styles.stopTimerButton : styles.startTimerButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={toggleTimer}>
            <Text style={styles.timerButtonText}>
              {isTiming ? 'Stop Contraction' : 'Start Contraction'}
            </Text>
          </Pressable>
        </View>

        {/* History List Header */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historySectionTitle}>History Logs</Text>

          {history.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear History"
              style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
              onPress={handleClearHistory}>
              <Text style={styles.clearButtonText}>Clear History</Text>
            </Pressable>
          )}
        </View>

        {/* Logged Contractions List */}
        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No contractions logged yet. Tap Start Contraction above when labor begins.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item, index) => (
              <View key={item.id} style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <Text style={styles.logIndexText}>#{history.length - index}</Text>
                  <Text style={styles.logTimeText}>{formatTimeStr(item.startTime)}</Text>
                </View>

                <View style={styles.logMetricsRow}>
                  <View style={styles.logMetricCol}>
                    <Text style={styles.logMetricValue}>{formatDuration(item.durationSeconds)}</Text>
                    <Text style={styles.logMetricLabel}>Duration</Text>
                  </View>

                  <View style={styles.logMetricCol}>
                    <Text style={styles.logMetricValue}>{formatInterval(item.intervalSeconds)}</Text>
                    <Text style={styles.logMetricLabel}>Interval Since Previous</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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

  /* Summary Card */
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#60A5FA',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#1F2937',
  },

  /* Timer Display Card */
  timerCard: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
    marginBottom: 28,
  },
  timerDigits: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 6,
  },
  timerStatusText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  timerButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startTimerButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  stopTimerButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* History Header */
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },

  /* History List */
  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 8,
  },
  logIndexText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
  },
  logTimeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  logMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logMetricCol: {
    flex: 1,
  },
  logMetricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  logMetricLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
