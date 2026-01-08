import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Coordinates, PlaceResult, POIType } from '../types/route';
import { placesApi } from '../services/api';

interface POISearchProps {
  currentLocation: Coordinates | null;
  onSelectPOI: (poi: { place: PlaceResult; type: POIType } | null) => void;
  selectedPOI: { place: PlaceResult; type: POIType } | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  parks: '🌳',
  water: '💧',
  restrooms: '🚻',
  cafes: '☕',
  convenience: '🏪',
  landmarks: '🏛️',
};

const CATEGORIES = [
  { id: 'parks', name: 'Parks' },
  { id: 'cafes', name: 'Cafes' },
  { id: 'water', name: 'Water' },
  { id: 'restrooms', name: 'Restrooms' },
  { id: 'convenience', name: 'Stores' },
  { id: 'landmarks', name: 'Landmarks' },
];

export function POISearch({
  currentLocation,
  onSelectPOI,
  selectedPOI,
}: POISearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [poiType, setPOIType] = useState<POIType>('pass_by');

  useEffect(() => {
    if (selectedCategory && currentLocation) {
      searchByCategory(selectedCategory);
    }
  }, [selectedCategory, currentLocation]);

  const searchByCategory = async (category: string) => {
    if (!currentLocation) return;

    setLoading(true);
    try {
      const result = await placesApi.searchNearby({
        location: currentLocation,
        category,
        radius: 3000,
      });
      setPlaces(result.places);
    } catch (error) {
      console.error('Failed to search places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByText = async () => {
    if (!currentLocation || !searchQuery.trim()) return;

    setLoading(true);
    setSelectedCategory(null);
    try {
      const result = await placesApi.searchByText({
        query: searchQuery,
        location: currentLocation,
        radius: 5000,
      });
      setPlaces(result.places);
    } catch (error) {
      console.error('Failed to search places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    onSelectPOI({ place, type: poiType });
    setExpanded(false);
  };

  const handleClearPOI = () => {
    onSelectPOI(null);
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1609.34).toFixed(1)}mi`;
  };

  if (!expanded) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.collapsedContainer}
          onPress={() => setExpanded(true)}
        >
          <Text style={styles.label}>Add Point of Interest</Text>
          {selectedPOI ? (
            <View style={styles.selectedPOI}>
              <Text style={styles.selectedPOIName}>{selectedPOI.place.name}</Text>
              <Text style={styles.selectedPOIType}>
                {selectedPOI.type === 'stop_at' ? '📍 Stop' : '👀 Pass by'}
              </Text>
              <TouchableOpacity onPress={handleClearPOI}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.addButton}>+ Add</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Point of Interest</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text style={styles.closeButton}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* POI Type Selection */}
      <View style={styles.poiTypeContainer}>
        <TouchableOpacity
          style={[
            styles.poiTypeButton,
            poiType === 'pass_by' && styles.poiTypeButtonActive,
          ]}
          onPress={() => setPOIType('pass_by')}
        >
          <Text
            style={[
              styles.poiTypeText,
              poiType === 'pass_by' && styles.poiTypeTextActive,
            ]}
          >
            👀 Pass By
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.poiTypeButton,
            poiType === 'stop_at' && styles.poiTypeButtonActive,
          ]}
          onPress={() => setPOIType('stop_at')}
        >
          <Text
            style={[
              styles.poiTypeText,
              poiType === 'stop_at' && styles.poiTypeTextActive,
            ]}
          >
            📍 Stop At
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchByText}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={searchByText} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategory === category.id && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>
              {CATEGORY_ICONS[category.id]}
            </Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#007AFF" />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.place_id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.placeItem}
              onPress={() => handleSelectPlace(item)}
            >
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{item.name}</Text>
                <Text style={styles.placeAddress} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <View style={styles.placeDistance}>
                <Text style={styles.distanceText}>
                  {formatDistance(item.distance_meters)}
                </Text>
                {item.rating && (
                  <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedCategory || searchQuery
                ? 'No places found nearby'
                : 'Select a category or search'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  collapsedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedPOI: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPOIName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    maxWidth: 120,
  },
  selectedPOIType: {
    fontSize: 12,
    color: '#666',
  },
  clearButton: {
    fontSize: 16,
    color: '#999',
    paddingHorizontal: 8,
  },
  expandedContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  poiTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  poiTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  poiTypeButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  poiTypeText: {
    fontSize: 14,
    color: '#666',
  },
  poiTypeTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryPillActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  resultsList: {
    maxHeight: 200,
  },
  placeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  placeInfo: {
    flex: 1,
    marginRight: 8,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  placeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeDistance: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
});
