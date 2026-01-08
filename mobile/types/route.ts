export type RouteType = 'loop' | 'one_way';

export interface Coordinates {
  lat: number;
  lng: number;
}

export type POIType = 'pass_by' | 'stop_at';

export interface POIConfig {
  place_id: string;
  type: POIType;
  coordinates?: Coordinates;
  name?: string;
}

export interface RouteGenerationRequest {
  start: Coordinates;
  end: Coordinates | null;
  distance_miles: number;
  route_type: RouteType;
  poi?: POIConfig;
}

export interface Waypoint {
  coordinates: Coordinates;
  name?: string;
  is_poi?: boolean;
}

export interface TurnInstruction {
  instruction: string;
  distance_meters: number;
  coordinates: Coordinates;
}

export interface GeneratedRoute {
  route_id: string;
  geometry: string;
  distance_miles: number;
  estimated_time_minutes: number;
  waypoints: Waypoint[];
  turn_by_turn: TurnInstruction[];
  poi_included?: {
    name: string;
    type: POIType;
  };
  route_type: RouteType;
}

export interface RouteTypeInfo {
  type: RouteType;
  name: string;
  description: string;
  requires_end_destination: boolean;
}

export interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  types: string[];
  rating?: number;
  distance_meters?: number;
}

export interface POICategory {
  id: string;
  name: string;
  types: string[];
}

export interface SavedRoute {
  id: string;
  name: string;
  route: GeneratedRoute;
  created_at: string;
}

export interface RunStats {
  distance_meters: number;
  duration_seconds: number;
  pace_per_mile: number;
  coordinates: Coordinates[];
  timestamps: number[];
}
