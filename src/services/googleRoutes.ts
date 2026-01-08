import { Coordinates } from '../types/route';

const GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/**
 * Google Routes API request/response types
 */
interface GoogleWaypoint {
  location: {
    latLng: {
      latitude: number;
      longitude: number;
    };
  };
}

interface GoogleRoutesRequest {
  origin: GoogleWaypoint;
  destination: GoogleWaypoint;
  intermediates?: GoogleWaypoint[];
  travelMode: 'WALK';
  computeAlternativeRoutes?: boolean;
  routeModifiers?: {
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
  };
  polylineEncoding?: 'ENCODED_POLYLINE';
}

interface GoogleRouteLeg {
  distanceMeters: number;
  duration: string;
  polyline: {
    encodedPolyline: string;
  };
  steps?: Array<{
    distanceMeters: number;
    staticDuration: string;
    polyline: {
      encodedPolyline: string;
    };
    startLocation: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
    endLocation: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
    navigationInstruction?: {
      maneuver: string;
      instructions: string;
    };
  }>;
}

interface GoogleRoute {
  distanceMeters: number;
  duration: string;
  polyline: {
    encodedPolyline: string;
  };
  legs: GoogleRouteLeg[];
}

interface GoogleRoutesResponse {
  routes: GoogleRoute[];
}

/**
 * Result from Google Routes API call
 */
export interface RoutesApiResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  steps: Array<{
    instruction: string;
    distanceMeters: number;
    startLocation: Coordinates;
    endLocation: Coordinates;
  }>;
}

/**
 * Convert our Coordinates to Google's waypoint format
 */
function toGoogleWaypoint(coords: Coordinates): GoogleWaypoint {
  return {
    location: {
      latLng: {
        latitude: coords.lat,
        longitude: coords.lng,
      },
    },
  };
}

/**
 * Parse duration string (e.g., "1234s") to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)s/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Call Google Routes API to get walking directions
 */
export async function getWalkingRoute(
  origin: Coordinates,
  destination: Coordinates,
  intermediates: Coordinates[] = []
): Promise<RoutesApiResult> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_ROUTES_API_KEY environment variable is not set');
  }

  const requestBody: GoogleRoutesRequest = {
    origin: toGoogleWaypoint(origin),
    destination: toGoogleWaypoint(destination),
    travelMode: 'WALK',
    polylineEncoding: 'ENCODED_POLYLINE',
    routeModifiers: {
      avoidHighways: true,
    },
  };

  if (intermediates.length > 0) {
    requestBody.intermediates = intermediates.map(toGoogleWaypoint);
  }

  const response = await fetch(GOOGLE_ROUTES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.startLocation,routes.legs.steps.endLocation',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Routes API error: ${response.status} - ${errorText}`);
  }

  const data: GoogleRoutesResponse = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No routes found');
  }

  const route = data.routes[0];

  // Extract steps from all legs
  const steps: RoutesApiResult['steps'] = [];
  for (const leg of route.legs) {
    if (leg.steps) {
      for (const step of leg.steps) {
        steps.push({
          instruction: step.navigationInstruction?.instructions || 'Continue',
          distanceMeters: step.distanceMeters,
          startLocation: {
            lat: step.startLocation.latLng.latitude,
            lng: step.startLocation.latLng.longitude,
          },
          endLocation: {
            lat: step.endLocation.latLng.latitude,
            lng: step.endLocation.latLng.longitude,
          },
        });
      }
    }
  }

  return {
    distanceMeters: route.distanceMeters,
    durationSeconds: parseDuration(route.duration),
    encodedPolyline: route.polyline.encodedPolyline,
    steps,
  };
}

/**
 * Get walking route with distance in miles
 */
export async function getWalkingRouteWithMiles(
  origin: Coordinates,
  destination: Coordinates,
  intermediates: Coordinates[] = []
): Promise<RoutesApiResult & { distanceMiles: number; durationMinutes: number }> {
  const result = await getWalkingRoute(origin, destination, intermediates);

  return {
    ...result,
    distanceMiles: Math.round((result.distanceMeters / 1609.34) * 10) / 10,
    durationMinutes: Math.round(result.durationSeconds / 60),
  };
}
