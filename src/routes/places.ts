import { Router, Request, Response } from 'express';
import {
  searchNearbyPlaces,
  searchPlacesByText,
  POI_CATEGORIES,
  POICategory,
} from '../services/placesApi';

const router = Router();

/**
 * GET /api/places/categories
 * Get available POI categories
 */
router.get('/categories', (_req: Request, res: Response) => {
  const categories = Object.entries(POI_CATEGORIES).map(([key, types]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    types,
  }));

  res.json({ categories });
});

/**
 * POST /api/places/nearby
 * Search for places near a location
 */
router.post('/nearby', async (req: Request, res: Response) => {
  try {
    const { location, category, radius } = req.body;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'Invalid location coordinates' });
    }

    if (!category || !Object.keys(POI_CATEGORIES).includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        valid_categories: Object.keys(POI_CATEGORIES),
      });
    }

    const places = await searchNearbyPlaces(
      location,
      category as POICategory,
      radius || 2000
    );

    return res.json({ places });
  } catch (error) {
    console.error('Places search error:', error);
    return res.status(500).json({
      error: 'Failed to search places',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/places/search
 * Search for places by text query
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, location, radius } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'Invalid location coordinates' });
    }

    const places = await searchPlacesByText(query, location, radius || 5000);

    return res.json({ places });
  } catch (error) {
    console.error('Places search error:', error);
    return res.status(500).json({
      error: 'Failed to search places',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
