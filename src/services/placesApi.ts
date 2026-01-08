import { Coordinates } from '../types/route';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const GOOGLE_PLACES_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';

export interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  types: string[];
  rating?: number;
  distance_meters?: number;
}

interface GooglePlace {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
}

// Common POI types for runners
export const POI_CATEGORIES = {
  parks: ['park', 'national_park', 'dog_park'],
  water: ['drinking_water', 'water_fountain'],
  restrooms: ['public_restroom', 'restroom'],
  cafes: ['cafe', 'coffee_shop'],
  convenience: ['convenience_store', 'gas_station'],
  landmarks: ['tourist_attraction', 'monument', 'museum'],
} as const;

export type POICategory = keyof typeof POI_CATEGORIES;

/**
 * Search for places near a location
 */
export async function searchNearbyPlaces(
  location: Coordinates,
  category: POICategory,
  radiusMeters: number = 2000
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_ROUTES_API_KEY environment variable is not set');
  }

  const types = POI_CATEGORIES[category];

  const requestBody = {
    includedTypes: types,
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: radiusMeters,
      },
    },
  };

  const response = await fetch(GOOGLE_PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.places) {
    return [];
  }

  return data.places.map((place: GooglePlace) => ({
    place_id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    coordinates: {
      lat: place.location.latitude,
      lng: place.location.longitude,
    },
    types: place.types,
    rating: place.rating,
    distance_meters: calculateDistanceMeters(location, {
      lat: place.location.latitude,
      lng: place.location.longitude,
    }),
  }));
}

/**
 * Search for places by text query
 */
export async function searchPlacesByText(
  query: string,
  location: Coordinates,
  radiusMeters: number = 5000
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_ROUTES_API_KEY environment variable is not set');
  }

  const requestBody = {
    textQuery: query,
    locationBias: {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: radiusMeters,
      },
    },
    maxResultCount: 10,
  };

  const response = await fetch(GOOGLE_PLACES_TEXT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.places) {
    return [];
  }

  return data.places.map((place: GooglePlace) => ({
    place_id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    coordinates: {
      lat: place.location.latitude,
      lng: place.location.longitude,
    },
    types: place.types,
    rating: place.rating,
    distance_meters: calculateDistanceMeters(location, {
      lat: place.location.latitude,
      lng: place.location.longitude,
    }),
  }));
}

function calculateDistanceMeters(from: Coordinates, to: Coordinates): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
