import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { storageService, CompletedRun } from '../services/storage';

interface RunHistoryProps {
  visible: boolean;
  onClose: () => void;
}

export function RunHistory({ visible, onClose }: RunHistoryProps) {
  const [runs, setRuns] = useState<CompletedRun[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    totalTime: 0,
  });

  useEffect(() => {
    if (visible) {
      loadRuns();
    }
  }, [visible]);

  const loadRuns = async () => {
    const history = await storageService.getRunHistory();
    setRuns(history);

    // Calculate totals
    const totals = history.reduce(
      (acc, run) => ({
        totalRuns: acc.totalRuns + 1,
        totalDistance: acc.totalDistance + run.stats.distance_meters,
        totalTime: acc.totalTime + run.stats.duration_seconds,
      }),
      { totalRuns: 0, totalDistance: 0, totalTime: 0 }
    );
    setTotalStats(totals);
  };

  const handleDeleteRun = (run: CompletedRun) => {
    Alert.alert(
      'Delete Run',
      'Are you sure you want to delete this run?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteRun(run.id);
            loadRuns();
          },
        },
      ]
    );
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatDate(dateString);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Run History</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{totalStats.totalRuns}</Text>
          <Text style={styles.summaryLabel}>Runs</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>
            {(totalStats.totalDistance / 1609.34).toFixed(1)}
          </Text>
          <Text style={styles.summaryLabel}>Total Miles</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>
            {Math.round(totalStats.totalTime / 60)}
          </Text>
          <Text style={styles.summaryLabel}>Total Mins</Text>
        </View>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.runItem}>
            <View style={styles.runHeader}>
              <Text style={styles.runDate}>{formatTimeAgo(item.completed_at)}</Text>
              <TouchableOpacity onPress={() => handleDeleteRun(item)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.runStats}>
              <View style={styles.runStat}>
                <Text style={styles.runStatValue}>
                  {(item.stats.distance_meters / 1609.34).toFixed(2)}
                </Text>
                <Text style={styles.runStatLabel}>miles</Text>
              </View>
              <View style={styles.runStat}>
                <Text style={styles.runStatValue}>
                  {formatTime(item.stats.duration_seconds)}
                </Text>
                <Text style={styles.runStatLabel}>time</Text>
              </View>
              <View style={styles.runStat}>
                <Text style={styles.runStatValue}>
                  {formatPace(item.stats.pace_per_mile)}
                </Text>
                <Text style={styles.runStatLabel}>pace</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏃</Text>
            <Text style={styles.emptyText}>No runs yet</Text>
            <Text style={styles.emptySubtext}>
              Complete your first run to see your history
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  runItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    fontSize: 16,
    padding: 4,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  runStat: {
    alignItems: 'center',
  },
  runStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  runStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
