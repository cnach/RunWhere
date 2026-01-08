import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { RouteType, Coordinates, GeneratedRoute, PlaceResult, POIType } from '../types/route';
import { RouteTypeSelector } from './RouteTypeSelector';
import { DistanceSelector } from './DistanceSelector';
import { DestinationPicker } from './DestinationPicker';
import { POISearch } from './POISearch';
import { routeApi } from '../services/api';

interface RouteSetupProps {
  currentLocation: Coordinates | null;
  destination: Coordinates | null;
  onPickDestination: () => void;
  onRouteGenerated: (route: GeneratedRoute) => void;
  selectedPOI: { place: PlaceResult; type: POIType } | null;
  onSelectPOI: (poi: { place: PlaceResult; type: POIType } | null) => void;
}

export function RouteSetup({
  currentLocation,
  destination,
  onPickDestination,
  onRouteGenerated,
  selectedPOI,
  onSelectPOI,
}: RouteSetupProps) {
  const [routeType, setRouteType] = useState<RouteType>('loop');
  const [distance, setDistance] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate =
    currentLocation !== null &&
    (routeType === 'loop' || destination !== null);

  const handleGenerateRoute = async () => {
    if (!currentLocation) {
      setError('Please wait for your location to be detected');
      return;
    }

    if (routeType === 'one_way' && !destination) {
      setError('Please select an end destination for one-way route');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const route = await routeApi.generateRoute({
        start: currentLocation,
        end: routeType === 'one_way' ? destination : null,
        distance_miles: distance,
        route_type: routeType,
        poi: selectedPOI
          ? {
              place_id: selectedPOI.place.place_id,
              type: selectedPOI.type,
              coordinates: selectedPOI.place.coordinates,
              name: selectedPOI.place.name,
            }
          : undefined,
      });

      onRouteGenerated(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Plan Your Run</Text>

        <RouteTypeSelector
          selectedType={routeType}
          onTypeChange={setRouteType}
        />

        <DistanceSelector
          selectedDistance={distance}
          onDistanceChange={setDistance}
        />

        <DestinationPicker
          destination={destination}
          onPickDestination={onPickDestination}
          visible={routeType === 'one_way'}
        />

        <POISearch
          currentLocation={currentLocation}
          selectedPOI={selectedPOI}
          onSelectPOI={onSelectPOI}
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            !canGenerate && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateRoute}
          disabled={!canGenerate || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Route</Text>
          )}
        </TouchableOpacity>

        {!currentLocation && (
          <Text style={styles.locationWarning}>
            Waiting for your location...
          </Text>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  locationWarning: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomPadding: {
    height: 20,
  },
});
