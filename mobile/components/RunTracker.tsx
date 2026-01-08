import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import * as Location from 'expo-location';
import { Coordinates, GeneratedRoute, RunStats } from '../types/route';
import { storageService } from '../services/storage';

interface RunTrackerProps {
  route: GeneratedRoute;
  onFinish: (stats: RunStats) => void;
  onCancel: () => void;
}

type RunState = 'ready' | 'running' | 'paused' | 'finished';

export function RunTracker({ route, onFinish, onCancel }: RunTrackerProps) {
  const [runState, setRunState] = useState<RunState>('ready');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [currentPace, setCurrentPace] = useState<number | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastLocationRef = useRef<Coordinates | null>(null);

  // Timer effect
  useEffect(() => {
    if (runState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current + pausedTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [runState]);

  // Location tracking effect
  useEffect(() => {
    if (runState === 'running') {
      startLocationTracking();
    } else if (runState === 'paused' || runState === 'finished') {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [runState]);

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          const newCoord: Coordinates = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };

          setCoordinates((prev) => [...prev, newCoord]);
          setTimestamps((prev) => [...prev, Date.now()]);

          // Calculate distance from last point
          if (lastLocationRef.current) {
            const dist = calculateDistance(lastLocationRef.current, newCoord);
            setDistance((prev) => prev + dist);

            // Calculate current pace (minutes per mile)
            const timeElapsed = elapsedTime / 1000 / 60; // minutes
            const distMiles = (distance + dist) / 1609.34;
            if (distMiles > 0.01) {
              setCurrentPace(timeElapsed / distMiles);
            }
          }

          lastLocationRef.current = newCoord;
        }
      );
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      Alert.alert('Error', 'Failed to track your location');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const calculateDistance = (from: Coordinates, to: Coordinates): number => {
    const R = 6371000; // Earth radius in meters
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleStart = () => {
    Vibration.vibrate(100);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setRunState('running');
  };

  const handlePause = () => {
    Vibration.vibrate(100);
    pausedTimeRef.current = elapsedTime;
    setRunState('paused');
  };

  const handleResume = () => {
    Vibration.vibrate(100);
    startTimeRef.current = Date.now();
    setRunState('running');
  };

  const handleFinish = () => {
    Vibration.vibrate([100, 100, 100]);
    setRunState('finished');

    const stats: RunStats = {
      distance_meters: distance,
      duration_seconds: Math.floor(elapsedTime / 1000),
      pace_per_mile: distance > 0 ? (elapsedTime / 1000 / 60) / (distance / 1609.34) : 0,
      coordinates,
      timestamps,
    };

    // Save the run
    storageService.saveRun(route.route_id, undefined, stats);
    onFinish(stats);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Run',
      'Are you sure you want to cancel this run? Your progress will be lost.',
      [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Cancel Run',
          style: 'destructive',
          onPress: () => {
            stopLocationTracking();
            onCancel();
          },
        },
      ]
    );
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number | null): string => {
    if (!pace || pace > 30) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34;
    return miles.toFixed(2);
  };

  const progress = route.distance_miles > 0
    ? Math.min(100, (distance / 1609.34 / route.distance_miles) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStats}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          <Text style={styles.statLabel}>miles</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(currentPace)}</Text>
          <Text style={styles.statLabel}>pace /mi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.distance_miles}</Text>
          <Text style={styles.statLabel}>target mi</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {runState === 'ready' && (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Run</Text>
            </TouchableOpacity>
          </>
        )}

        {runState === 'running' && (
          <>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.pauseButtonText}>⏸ Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </>
        )}

        {runState === 'paused' && (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
              <Text style={styles.resumeButtonText}>▶ Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Run State Indicator */}
      {runState === 'running' && (
        <View style={styles.runningIndicator}>
          <View style={styles.runningDot} />
          <Text style={styles.runningText}>Tracking your run...</Text>
        </View>
      )}

      {runState === 'paused' && (
        <View style={styles.pausedIndicator}>
          <Text style={styles.pausedText}>⏸ Run paused</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  mainStats: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    flex: 2,
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  runningText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  pausedIndicator: {
    alignItems: 'center',
    marginTop: 16,
  },
  pausedText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
});
