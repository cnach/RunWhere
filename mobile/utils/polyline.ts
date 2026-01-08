import { Coordinates } from '../types/route';

/**
 * Decode a Google-encoded polyline string into an array of coordinates
 */
export function decodePolyline(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    // Decode latitude
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Convert our Coordinates format to react-native-maps LatLng format
 */
export function toLatLng(coord: Coordinates): { latitude: number; longitude: number } {
  return {
    latitude: coord.lat,
    longitude: coord.lng,
  };
}

/**
 * Convert array of Coordinates to react-native-maps format
 */
export function toLatLngArray(coords: Coordinates[]): { latitude: number; longitude: number }[] {
  return coords.map(toLatLng);
}
