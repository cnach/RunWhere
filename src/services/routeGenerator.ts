import {
  Coordinates,
  RouteType,
  RouteGenerationRequest,
  GeneratedRoute,
  Waypoint,
  RouteGenerationOptions,
} from '../types/route';
import { v4 as uuidv4 } from 'uuid';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;
const MILES_TO_KM = 1.60934;
const KM_TO_MILES = 0.621371;

// Average running pace: ~10 min/mile = 6 mph = ~10 min/km
const MINUTES_PER_MILE = 10;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Generate a new coordinate given a starting point, distance, and bearing
 * Uses the inverse Haversine formula
 */
export function generateWaypoint(
  center: Coordinates,
  distanceKm: number,
  bearingDegrees: number
): Coordinates {
  const lat1 = toRadians(center.lat);
  const lng1 = toRadians(center.lng);
  const bearing = toRadians(bearingDegrees);
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  };
}

/**
 * Distribute bearings evenly around a circle with some randomization
 */
function distributeEvenly(start: number, end: number, count: number): number[] {
  const step = (end - start) / count;
  const bearings: number[] = [];

  for (let i = 0; i < count; i++) {
    // Add randomization of ±30 degrees for variety
    const randomOffset = (Math.random() - 0.5) * 60;
    bearings.push(start + step * i + step / 2 + randomOffset);
  }

  return bearings;
}

/**
 * Generate waypoints for a loop route
 * Creates waypoints that form a roughly circular path back to start
 */
export function generateLoopWaypoints(
  start: Coordinates,
  targetDistanceKm: number,
  waypointCount?: number
): Waypoint[] {
  // Use 2-4 random waypoints if not specified
  const numWaypoints = waypointCount ?? Math.floor(Math.random() * 3) + 2;

  // Each segment should be roughly equal, accounting for return to start
  // For a loop, we divide by (numWaypoints + 1) to include return segment
  const segmentDistance = targetDistanceKm / (numWaypoints + 1);

  // Distribute bearings evenly around the circle
  const baseBearings = distributeEvenly(0, 360, numWaypoints);

  const waypoints: Waypoint[] = [];

  for (const bearing of baseBearings) {
    // Randomize distance (70% to 130% of segment distance)
    const randomizedDistance = segmentDistance * (0.7 + Math.random() * 0.6);

    const coords = generateWaypoint(start, randomizedDistance, bearing);

    waypoints.push({
      coordinates: coords,
    });
  }

  return waypoints;
}

/**
 * Generate waypoints for a one-way route
 * If target distance is greater than direct distance, adds waypoints to extend the route
 */
export function generateOneWayWaypoints(
  start: Coordinates,
  end: Coordinates,
  targetDistanceKm: number
): Waypoint[] {
  const directDistance = calculateDistance(start, end);

  // If target distance is close to direct distance, no extra waypoints needed
  if (targetDistanceKm <= directDistance * 1.2) {
    return [];
  }

  // Calculate how much extra distance we need
  const extraDistance = targetDistanceKm - directDistance;

  // Calculate midpoint between start and end
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const midpoint: Coordinates = { lat: midLat, lng: midLng };

  // Calculate bearing from start to end
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const deltaLng = toRadians(end.lng - start.lng);

  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

  const directBearing = toDegrees(Math.atan2(y, x));

  // Add waypoints perpendicular to the direct path
  const waypoints: Waypoint[] = [];

  // Number of waypoints based on extra distance needed
  const numWaypoints = Math.min(Math.ceil(extraDistance / (directDistance * 0.5)), 3);

  for (let i = 0; i < numWaypoints; i++) {
    // Perpendicular bearings (90 degrees off the direct path)
    // Alternate sides for variety
    const perpendicularBearing = directBearing + (i % 2 === 0 ? 90 : -90);

    // Distance out from the path (portion of extra distance)
    const outDistance = (extraDistance / numWaypoints / 2) * (0.8 + Math.random() * 0.4);

    // Position along the route (evenly distributed)
    const routeProgress = (i + 1) / (numWaypoints + 1);
    const basePoint: Coordinates = {
      lat: start.lat + (end.lat - start.lat) * routeProgress,
      lng: start.lng + (end.lng - start.lng) * routeProgress,
    };

    const coords = generateWaypoint(basePoint, outDistance, perpendicularBearing);

    waypoints.push({
      coordinates: coords,
    });
  }

  return waypoints;
}

/**
 * Calculate total route distance through waypoints
 */
export function calculateRouteDistance(
  start: Coordinates,
  waypoints: Waypoint[],
  end: Coordinates
): number {
  let totalDistance = 0;
  let currentPoint = start;

  for (const waypoint of waypoints) {
    totalDistance += calculateDistance(currentPoint, waypoint.coordinates);
    currentPoint = waypoint.coordinates;
  }

  totalDistance += calculateDistance(currentPoint, end);

  return totalDistance;
}

/**
 * Simple polyline encoding (Google's format)
 * Encodes a list of coordinates into a string
 */
function encodePolyline(coordinates: Coordinates[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);

    encoded += encodeNumber(lat - prevLat);
    encoded += encodeNumber(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

function encodeNumber(num: number): string {
  let value = num < 0 ? ~(num << 1) : num << 1;
  let encoded = '';

  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Generate a running route based on the request parameters
 */
export async function generateRoute(
  request: RouteGenerationRequest,
  options: RouteGenerationOptions = {}
): Promise<GeneratedRoute> {
  const { tolerance = 0.1, maxIterations = 10 } = options;

  const targetDistanceKm = request.distance_miles * MILES_TO_KM;
  let waypoints: Waypoint[] = [];
  let routeDistanceKm: number;
  let iteration = 0;

  // Determine end point based on route type
  const endPoint: Coordinates =
    request.route_type === 'loop' ? request.start : request.end!;

  if (request.route_type === 'one_way' && !request.end) {
    throw new Error('End destination is required for one-way routes');
  }

  // Generate waypoints based on route type
  if (request.route_type === 'loop') {
    // Loop route: generate waypoints that form a circular path
    do {
      waypoints = generateLoopWaypoints(
        request.start,
        targetDistanceKm,
        options.waypointCount
      );
      routeDistanceKm = calculateRouteDistance(request.start, waypoints, request.start);
      iteration++;

      // Scale waypoints if distance is off
      if (Math.abs(routeDistanceKm - targetDistanceKm) > targetDistanceKm * tolerance) {
        const scaleFactor = targetDistanceKm / routeDistanceKm;
        waypoints = waypoints.map((wp) => ({
          ...wp,
          coordinates: generateWaypoint(
            request.start,
            calculateDistance(request.start, wp.coordinates) * scaleFactor,
            toDegrees(
              Math.atan2(
                wp.coordinates.lng - request.start.lng,
                wp.coordinates.lat - request.start.lat
              )
            )
          ),
        }));
        routeDistanceKm = calculateRouteDistance(request.start, waypoints, request.start);
      }
    } while (
      Math.abs(routeDistanceKm - targetDistanceKm) > targetDistanceKm * tolerance &&
      iteration < maxIterations
    );
  } else {
    // One-way route: extend path if needed to reach target distance
    waypoints = generateOneWayWaypoints(request.start, endPoint, targetDistanceKm);
    routeDistanceKm = calculateRouteDistance(request.start, waypoints, endPoint);
  }

  // Add POI as a waypoint if specified
  if (request.poi?.coordinates) {
    const poiWaypoint: Waypoint = {
      coordinates: request.poi.coordinates,
      name: request.poi.name,
      is_poi: true,
    };

    // Insert POI at appropriate position (roughly middle of route)
    const insertIndex = Math.floor(waypoints.length / 2);
    waypoints.splice(insertIndex, 0, poiWaypoint);

    // Recalculate distance
    routeDistanceKm = calculateRouteDistance(request.start, waypoints, endPoint);
  }

  // Build coordinate list for geometry encoding
  const allCoordinates: Coordinates[] = [
    request.start,
    ...waypoints.map((wp) => wp.coordinates),
    endPoint,
  ];

  // Generate simple turn-by-turn instructions
  const turnByTurn = waypoints.map((wp, index) => ({
    instruction: wp.is_poi
      ? `${request.poi?.type === 'stop_at' ? 'Stop at' : 'Pass by'} ${wp.name || 'waypoint'}`
      : `Continue to waypoint ${index + 1}`,
    distance_meters:
      calculateDistance(
        index === 0 ? request.start : waypoints[index - 1].coordinates,
        wp.coordinates
      ) * 1000,
    coordinates: wp.coordinates,
  }));

  // Add final instruction
  turnByTurn.push({
    instruction:
      request.route_type === 'loop' ? 'Return to start' : 'Arrive at destination',
    distance_meters:
      calculateDistance(
        waypoints.length > 0 ? waypoints[waypoints.length - 1].coordinates : request.start,
        endPoint
      ) * 1000,
    coordinates: endPoint,
  });

  const distanceMiles = routeDistanceKm * KM_TO_MILES;

  return {
    route_id: uuidv4(),
    geometry: encodePolyline(allCoordinates),
    distance_miles: Math.round(distanceMiles * 10) / 10,
    estimated_time_minutes: Math.round(distanceMiles * MINUTES_PER_MILE),
    waypoints,
    turn_by_turn: turnByTurn,
    route_type: request.route_type,
    poi_included: request.poi
      ? {
          name: request.poi.name || 'Point of Interest',
          type: request.poi.type,
        }
      : undefined,
  };
}
