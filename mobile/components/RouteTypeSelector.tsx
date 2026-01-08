import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteType } from '../types/route';

interface RouteTypeSelectorProps {
  selectedType: RouteType;
  onTypeChange: (type: RouteType) => void;
}

export function RouteTypeSelector({
  selectedType,
  onTypeChange,
}: RouteTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Route Type</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            selectedType === 'loop' && styles.toggleButtonActive,
          ]}
          onPress={() => onTypeChange('loop')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedType === 'loop' && styles.toggleTextActive,
            ]}
          >
            Loop
          </Text>
          <Text
            style={[
              styles.toggleSubtext,
              selectedType === 'loop' && styles.toggleSubtextActive,
            ]}
          >
            Return to start
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            selectedType === 'one_way' && styles.toggleButtonActive,
          ]}
          onPress={() => onTypeChange('one_way')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedType === 'one_way' && styles.toggleTextActive,
            ]}
          >
            One-Way
          </Text>
          <Text
            style={[
              styles.toggleSubtext,
              selectedType === 'one_way' && styles.toggleSubtextActive,
            ]}
          >
            To destination
          </Text>
        </TouchableOpacity>
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: '#007AFF',
  },
  toggleButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#007AFF',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  toggleTextActive: {
    color: '#fff',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  toggleSubtextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
