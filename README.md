# RunWhere

A running route generator app that creates randomized running routes based on a starting location and desired distance.

## Features

### Route Type Selection

Users can choose between two route types:

- **Loop Route**: Start and end at the same location. Perfect for running from home or a parking spot.
- **One-Way Route**: Run from a starting point to a different end destination. Great for point-to-point runs.

## API

### Generate a Route

```
POST /api/routes/generate
```

**Request Body:**

```json
{
  "start": { "lat": 47.6062, "lng": -122.3321 },
  "end": { "lat": 47.6205, "lng": -122.3493 },
  "distance_miles": 5,
  "route_type": "loop" | "one_way",
  "poi": {
    "place_id": "abc123",
    "type": "pass_by" | "stop_at"
  }
}
```

- `start` (required): Starting location coordinates
- `end` (required for one_way, null for loop): End destination coordinates
- `distance_miles` (required): Target distance in miles
- `route_type` (required): Either "loop" or "one_way"
- `poi` (optional): Point of interest to include in the route

**Response:**

```json
{
  "route_id": "uuid",
  "geometry": "encoded_polyline",
  "distance_miles": 5.1,
  "estimated_time_minutes": 51,
  "waypoints": [...],
  "turn_by_turn": [...],
  "route_type": "loop",
  "poi_included": { "name": "Green Lake Park", "type": "stop_at" }
}
```

### Get Route Types

```
GET /api/routes/types
```

Returns available route types with descriptions.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Tech Stack

- Node.js with Express
- TypeScript
- Haversine formula for distance calculations
