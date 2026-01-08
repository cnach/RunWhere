import {
  RouteGenerationRequest,
  GeneratedRoute,
  RouteTypeInfo,
  Coordinates,
  RouteType,
} from '../types/route';

// Update this to your backend URL
// For local development with Expo, use your computer's IP address
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export const routeApi = {
  /**
   * Generate a running route
   */
  generateRoute: async (params: {
    start: Coordinates;
    end?: Coordinates | null;
    distance_miles: number;
    route_type: RouteType;
  }): Promise<GeneratedRoute> => {
    const request: RouteGenerationRequest = {
      start: params.start,
      end: params.end || null,
      distance_miles: params.distance_miles,
      route_type: params.route_type,
    };

    return fetchApi<GeneratedRoute>('/api/routes/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get available route types
   */
  getRouteTypes: async (): Promise<{ route_types: RouteTypeInfo[] }> => {
    return fetchApi<{ route_types: RouteTypeInfo[] }>('/api/routes/types');
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    return fetchApi<{ status: string; service: string }>('/health');
  },
};

export { ApiError };
