# RunWhere Mobile App

React Native (Expo) mobile app for generating running routes.

## Features

- Route type selection: Loop or One-Way routes
- Distance presets: 1, 3, 5, or 10 miles
- Interactive map with route display
- Destination picker for one-way routes

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. Add Google Maps API keys to `app.json`:
   - iOS: `expo.ios.config.googleMapsApiKey`
   - Android: `expo.android.config.googleMaps.apiKey`

4. Start the development server:
   ```bash
   npm start
   ```

## Development

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
mobile/
├── app/                 # Expo Router screens
│   ├── _layout.tsx     # Root layout
│   └── index.tsx       # Home screen with map
├── components/         # React components
│   ├── RouteTypeSelector.tsx
│   ├── DistanceSelector.tsx
│   ├── DestinationPicker.tsx
│   ├── RouteSetup.tsx
│   └── RouteDisplay.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript types
│   └── route.ts
└── utils/              # Utility functions
    └── polyline.ts
```

## Notes

- Requires the RunWhere backend to be running
- For physical device testing, update `EXPO_PUBLIC_API_URL` to your computer's IP address
- Google Maps API key required for map display on Android
