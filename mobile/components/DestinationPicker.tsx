import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Coordinates } from '../types/route';

interface DestinationPickerProps {
  destination: Coordinates | null;
  onPickDestination: () => void;
  visible: boolean;
}

export function DestinationPicker({
  destination,
  onPickDestination,
  visible,
}: DestinationPickerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>End Destination</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={onPickDestination}>
        {destination ? (
          <View>
            <Text style={styles.destinationText}>Destination set</Text>
            <Text style={styles.coordinatesText}>
              {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📍</Text>
            <Text style={styles.placeholderText}>Tap to set destination</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.helpText}>
        Tap the map to select your end destination
      </Text>
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
  pickerButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
