import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DistanceSelectorProps {
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
}

const PRESET_DISTANCES = [1, 3, 5, 10];

export function DistanceSelector({
  selectedDistance,
  onDistanceChange,
}: DistanceSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Distance</Text>
      <View style={styles.presetContainer}>
        {PRESET_DISTANCES.map((distance) => (
          <TouchableOpacity
            key={distance}
            style={[
              styles.presetButton,
              selectedDistance === distance && styles.presetButtonActive,
            ]}
            onPress={() => onDistanceChange(distance)}
          >
            <Text
              style={[
                styles.presetText,
                selectedDistance === distance && styles.presetTextActive,
              ]}
            >
              {distance}
            </Text>
            <Text
              style={[
                styles.presetUnit,
                selectedDistance === distance && styles.presetUnitActive,
              ]}
            >
              mi
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.selectedDisplay}>
        <Text style={styles.selectedText}>
          {selectedDistance} {selectedDistance === 1 ? 'mile' : 'miles'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  presetText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  presetTextActive: {
    color: '#007AFF',
  },
  presetUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  presetUnitActive: {
    color: '#007AFF',
  },
  selectedDisplay: {
    marginTop: 12,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    color: '#666',
  },
});
