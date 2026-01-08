import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GeneratedRoute } from '../types/route';

interface RouteDisplayProps {
  route: GeneratedRoute;
  onRegenerate: () => void;
  onClear: () => void;
  onStartRun?: () => void;
}

export function RouteDisplay({
  route,
  onRegenerate,
  onClear,
  onStartRun,
}: RouteDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Route</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {route.route_type === 'loop' ? 'Loop' : 'One-Way'}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.distance_miles}</Text>
          <Text style={styles.statLabel}>miles</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.estimated_time_minutes}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.waypoints.length}</Text>
          <Text style={styles.statLabel}>waypoints</Text>
        </View>
      </View>

      {route.poi_included && (
        <View style={styles.poiContainer}>
          <Text style={styles.poiText}>
            {route.poi_included.type === 'stop_at' ? '📍 Stop at' : '👀 Pass by'}{' '}
            {route.poi_included.name}
          </Text>
        </View>
      )}

      {/* Start Run Button */}
      {onStartRun && (
        <TouchableOpacity style={styles.startRunButton} onPress={onStartRun}>
          <Text style={styles.startRunButtonText}>🏃 Start Run</Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.regenerateButton]}
          onPress={onRegenerate}
        >
          <Text style={styles.regenerateButtonText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={onClear}
        >
          <Text style={styles.clearButtonText}>New Route</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  badge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
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
  poiContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  poiText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  startRunButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  startRunButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  regenerateButton: {
    backgroundColor: '#007AFF',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
