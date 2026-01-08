import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Coordinates, GeneratedRoute, PlaceResult, POIType, RunStats } from '../types/route';
import { RouteSetup } from '../components/RouteSetup';
import { RouteDisplay } from '../components/RouteDisplay';
import { SavedRoutes } from '../components/SavedRoutes';
import { RunHistory } from '../components/RunHistory';
import { RunTracker } from '../components/RunTracker';
import { RunSummary } from '../components/RunSummary';
import { LoginScreen } from '../components/LoginScreen';
import { ProfileScreen } from '../components/ProfileScreen';
import { decodePolyline, toLatLng, toLatLngArray } from '../utils/polyline';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorageService } from '../services/cloudStorage';

type AppScreen = 'home' | 'savedRoutes' | 'runHistory' | 'tracking' | 'summary' | 'login' | 'profile';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [pickingDestination, setPickingDestination] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<{ place: PlaceResult; type: POIType } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [completedRunStats, setCompletedRunStats] = useState<RunStats | null>(null);
  const [trackedCoordinates, setTrackedCoordinates] = useState<Coordinates[]>([]);
  const [hasSkippedLogin, setHasSkippedLogin] = useState(false);

  // Check if should show login screen
  const shouldShowLogin = !authLoading && !user && !hasSkippedLogin && currentScreen === 'login';

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to generate running routes.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords: Coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setCurrentLocation(coords);

      // Center map on current location
      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  // Migrate local data when user signs in
  useEffect(() => {
    if (user) {
      cloudStorageService.migrateLocalToCloud().then(({ routes, runs }) => {
        if (routes > 0 || runs > 0) {
          Alert.alert(
            'Data Synced',
            `Migrated ${routes} routes and ${runs} runs to your account.`
          );
        }
      });
    }
  }, [user]);

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    if (pickingDestination) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setDestination({ lat: latitude, lng: longitude });
      setPickingDestination(false);
    }
  };

  const handleRouteGenerated = (route: GeneratedRoute) => {
    setGeneratedRoute(route);

    // Fit map to show entire route
    if (route.geometry) {
      const routeCoords = decodePolyline(route.geometry);
      if (routeCoords.length > 0) {
        mapRef.current?.fitToCoordinates(toLatLngArray(routeCoords), {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    }
  };

  const handleClearRoute = () => {
    setGeneratedRoute(null);
    setDestination(null);
    setSelectedPOI(null);
    setTrackedCoordinates([]);
  };

  const handleStartRun = () => {
    if (generatedRoute) {
      setCurrentScreen('tracking');
    }
  };

  const handleFinishRun = (stats: RunStats) => {
    setCompletedRunStats(stats);
    setTrackedCoordinates(stats.coordinates);
    setCurrentScreen('summary');
  };

  const handleCloseSummary = () => {
    setCurrentScreen('home');
    setCompletedRunStats(null);
    handleClearRoute();
  };

  const handleSelectSavedRoute = (route: GeneratedRoute) => {
    setGeneratedRoute(route);
    setCurrentScreen('home');

    // Fit map to show the route
    if (route.geometry) {
      const routeCoords = decodePolyline(route.geometry);
      if (routeCoords.length > 0) {
        mapRef.current?.fitToCoordinates(toLatLngArray(routeCoords), {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    }
  };

  const routeCoordinates = generatedRoute
    ? toLatLngArray(decodePolyline(generatedRoute.geometry))
    : [];

  // Show login screen
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onSkip={() => {
          setHasSkippedLogin(true);
          setCurrentScreen('home');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}

        {/* Tracked run path */}
        {trackedCoordinates.length > 1 && (
          <Polyline
            coordinates={toLatLngArray(trackedCoordinates)}
            strokeColor="#34C759"
            strokeWidth={3}
          />
        )}

        {/* Start marker */}
        {currentLocation && generatedRoute && (
          <Marker
            coordinate={toLatLng(currentLocation)}
            title="Start"
            pinColor="green"
          />
        )}

        {/* End marker for one-way routes */}
        {destination && generatedRoute?.route_type === 'one_way' && (
          <Marker
            coordinate={toLatLng(destination)}
            title="End"
            pinColor="red"
          />
        )}

        {/* Destination preview when picking */}
        {destination && !generatedRoute && (
          <Marker
            coordinate={toLatLng(destination)}
            title="Destination"
            pinColor="orange"
          />
        )}

        {/* Selected POI marker */}
        {selectedPOI && !generatedRoute && (
          <Marker
            coordinate={toLatLng(selectedPOI.place.coordinates)}
            title={selectedPOI.place.name}
            pinColor="yellow"
          />
        )}

        {/* Waypoint markers */}
        {generatedRoute?.waypoints.map((waypoint, index) => (
          <Marker
            key={index}
            coordinate={toLatLng(waypoint.coordinates)}
            title={waypoint.name || `Waypoint ${index + 1}`}
            pinColor={waypoint.is_poi ? 'yellow' : 'blue'}
            opacity={0.8}
          />
        ))}
      </MapView>

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        {/* Profile button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('profile')}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarSmall} />
          ) : (
            <Text style={styles.navButtonText}>👤</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('savedRoutes')}
        >
          <Text style={styles.navButtonText}>💾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('runHistory')}
        >
          <Text style={styles.navButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet - changes based on state */}
      <View style={styles.bottomSheet}>
        {currentScreen === 'tracking' && generatedRoute ? (
          <RunTracker
            route={generatedRoute}
            onFinish={handleFinishRun}
            onCancel={() => setCurrentScreen('home')}
          />
        ) : currentScreen === 'summary' && completedRunStats ? (
          <RunSummary stats={completedRunStats} onClose={handleCloseSummary} />
        ) : generatedRoute ? (
          <RouteDisplay
            route={generatedRoute}
            onRegenerate={() => setGeneratedRoute(null)}
            onClear={handleClearRoute}
            onStartRun={handleStartRun}
          />
        ) : (
          <RouteSetup
            currentLocation={currentLocation}
            destination={destination}
            onPickDestination={() => setPickingDestination(true)}
            onRouteGenerated={handleRouteGenerated}
            selectedPOI={selectedPOI}
            onSelectPOI={setSelectedPOI}
          />
        )}
      </View>

      {/* Destination picking overlay */}
      {pickingDestination && (
        <View style={styles.pickingOverlay}>
          <View style={styles.pickingBanner}>
            <Text style={styles.pickingText}>Tap the map to set your destination</Text>
          </View>
        </View>
      )}

      {/* Saved Routes Screen */}
      <SavedRoutes
        visible={currentScreen === 'savedRoutes'}
        onClose={() => setCurrentScreen('home')}
        onSelectRoute={handleSelectSavedRoute}
        currentRoute={generatedRoute}
      />

      {/* Run History Screen */}
      <RunHistory
        visible={currentScreen === 'runHistory'}
        onClose={() => setCurrentScreen('home')}
      />

      {/* Profile Screen */}
      {currentScreen === 'profile' && (
        <ProfileScreen
          onClose={() => setCurrentScreen('home')}
          onSignIn={() => setCurrentScreen('login')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topNav: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  navButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  navButtonText: {
    fontSize: 20,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pickingOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80,
  },
  pickingBanner: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pickingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
