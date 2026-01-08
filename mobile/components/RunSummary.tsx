import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { RunStats } from '../types/route';

interface RunSummaryProps {
  stats: RunStats;
  onClose: () => void;
}

export function RunSummary({ stats, onClose }: RunSummaryProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    if (!pace || pace > 30) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const distanceMiles = stats.distance_meters / 1609.34;
  const calories = Math.round(distanceMiles * 100); // Rough estimate

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Just completed a ${distanceMiles.toFixed(2)} mile run in ${formatTime(stats.duration_seconds)}! Average pace: ${formatPace(stats.pace_per_mile)} /mi 🏃‍♂️ #RunWhere`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Run Complete!</Text>
        <Text style={styles.subtitle}>Great job out there!</Text>
      </View>

      <View style={styles.mainStat}>
        <Text style={styles.mainStatValue}>{distanceMiles.toFixed(2)}</Text>
        <Text style={styles.mainStatLabel}>miles</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{formatTime(stats.duration_seconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>{formatPace(stats.pace_per_mile)}</Text>
          <Text style={styles.statLabel}>Avg Pace /mi</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{calories}</Text>
          <Text style={styles.statLabel}>Est. Calories</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statValue}>{stats.coordinates.length}</Text>
          <Text style={styles.statLabel}>GPS Points</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainStatValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#007AFF',
  },
  mainStatLabel: {
    fontSize: 18,
    color: '#666',
    marginTop: -4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
