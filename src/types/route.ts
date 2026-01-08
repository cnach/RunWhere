/**
 * Route types supported by RunWhere
 * - loop: Route starts and ends at the same location
 * - one_way: Route goes from start to a specified end destination
 */
export type RouteType = 'loop' | 'one_way';

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Point of Interest interaction type
 * - pass_by: POI becomes a waypoint on the route
 * - stop_at: POI becomes a waypoint with a note to pause
 */
export type POIType = 'pass_by' | 'stop_at';

/**
 * Point of Interest configuration
 */
export interface POIConfig {
  place_id: string;
  type: POIType;
  coordinates?: Coordinates;
  name?: string;
}

/**
 * Request to generate a running route
 */
export interface RouteGenerationRequest {
  /** Starting location coordinates */
  start: Coordinates;
  /** End destination - required for one_way, null for loop */
  end: Coordinates | null;
  /** Target distance in miles */
  distance_miles: number;
  /** Type of route to generate */
  route_type: RouteType;
  /** Optional point of interest to include in route */
  poi?: POIConfig;
}

/**
 * A waypoint along the route
 */
export interface Waypoint {
  coordinates: Coordinates;
  name?: string;
  is_poi?: boolean;
}

/**
 * Turn-by-turn navigation instruction
 */
export interface TurnInstruction {
  instruction: string;
  distance_meters: number;
  coordinates: Coordinates;
}

/**
 * Generated route response
 */
export interface GeneratedRoute {
  /** Unique route identifier */
  route_id: string;
  /** Encoded polyline geometry for map display */
  geometry: string;
  /** Actual route distance in miles */
  distance_miles: number;
  /** Estimated time to complete in minutes */
  estimated_time_minutes: number;
  /** Waypoints along the route */
  waypoints: Waypoint[];
  /** Turn-by-turn navigation instructions */
  turn_by_turn: TurnInstruction[];
  /** POI included in route, if any */
  poi_included?: {
    name: string;
    type: POIType;
  };
  /** The type of route generated */
  route_type: RouteType;
}

/**
 * Route generation options
 */
export interface RouteGenerationOptions {
  /** Acceptable distance tolerance (default: 0.1 = 10%) */
  tolerance?: number;
  /** Maximum iterations for route adjustment (default: 10) */
  maxIterations?: number;
  /** Number of waypoints for loop routes (default: 2-4 random) */
  waypointCount?: number;
}
