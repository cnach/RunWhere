import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  PanResponder,
  Dimensions,
} from 'react-native';

interface DistanceSelectorProps {
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
}

const PRESET_DISTANCES = [1, 3, 5, 10];
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 26.2; // Marathon distance
const SLIDER_WIDTH = Dimensions.get('window').width - 80;

export function DistanceSelector({
  selectedDistance,
  onDistanceChange,
}: DistanceSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const isPreset = PRESET_DISTANCES.includes(selectedDistance);

  const handlePresetPress = (distance: number) => {
    setShowCustom(false);
    onDistanceChange(distance);
  };

  const handleCustomToggle = () => {
    setShowCustom(!showCustom);
    if (!showCustom) {
      setCustomInput(selectedDistance.toString());
    }
  };

  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    onDistanceChange(Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, rounded)));
  };

  const handleCustomInputSubmit = () => {
    const value = parseFloat(customInput);
    if (!isNaN(value) && value >= MIN_DISTANCE && value <= MAX_DISTANCE) {
      onDistanceChange(Math.round(value * 10) / 10);
    }
  };

  const sliderPosition = ((selectedDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * SLIDER_WIDTH;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      const position = gestureState.x0 - 40;
      const value = (position / SLIDER_WIDTH) * (MAX_DISTANCE - MIN_DISTANCE) + MIN_DISTANCE;
      handleSliderChange(value);
    },
    onPanResponderMove: (_, gestureState) => {
      const position = gestureState.moveX - 40;
      const value = (position / SLIDER_WIDTH) * (MAX_DISTANCE - MIN_DISTANCE) + MIN_DISTANCE;
      handleSliderChange(value);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Distance</Text>
        <TouchableOpacity onPress={handleCustomToggle}>
          <Text style={styles.customToggle}>
            {showCustom ? 'Presets' : 'Custom'}
          </Text>
        </TouchableOpacity>
      </View>

      {!showCustom ? (
        <View style={styles.presetContainer}>
          {PRESET_DISTANCES.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.presetButton,
                selectedDistance === distance && styles.presetButtonActive,
              ]}
              onPress={() => handlePresetPress(distance)}
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
      ) : (
        <View style={styles.customContainer}>
          {/* Slider */}
          <View style={styles.sliderContainer} {...panResponder.panHandlers}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: Math.max(0, Math.min(sliderPosition, SLIDER_WIDTH)) },
                ]}
              />
            </View>
            <View
              style={[
                styles.sliderThumb,
                { left: Math.max(0, Math.min(sliderPosition - 12, SLIDER_WIDTH - 24)) },
              ]}
            />
          </View>

          {/* Slider labels */}
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{MIN_DISTANCE} mi</Text>
            <Text style={styles.sliderLabel}>{MAX_DISTANCE} mi</Text>
          </View>

          {/* Custom input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.customInput}
              value={customInput}
              onChangeText={setCustomInput}
              onBlur={handleCustomInputSubmit}
              onSubmitEditing={handleCustomInputSubmit}
              keyboardType="decimal-pad"
              placeholder="Enter distance"
              placeholderTextColor="#999"
            />
            <Text style={styles.inputUnit}>miles</Text>
          </View>
        </View>
      )}

      <View style={styles.selectedDisplay}>
        <Text style={styles.selectedValue}>{selectedDistance}</Text>
        <Text style={styles.selectedUnit}>
          {selectedDistance === 1 ? 'mile' : 'miles'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customToggle: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  customContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
  },
  selectedDisplay: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  selectedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  selectedUnit: {
    fontSize: 16,
    color: '#666',
  },
});
