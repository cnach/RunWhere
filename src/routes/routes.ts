import { Router, Request, Response } from 'express';
import { generateRoute } from '../services/routeGenerator';
import { RouteGenerationRequest, RouteType } from '../types/route';

const router = Router();

/**
 * Validate route generation request
 */
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  const req = body as Partial<RouteGenerationRequest>;

  if (!req.start || typeof req.start.lat !== 'number' || typeof req.start.lng !== 'number') {
    return { valid: false, error: 'Invalid start coordinates' };
  }

  if (typeof req.distance_miles !== 'number' || req.distance_miles <= 0) {
    return { valid: false, error: 'Distance must be a positive number' };
  }

  if (req.distance_miles > 50) {
    return { valid: false, error: 'Distance cannot exceed 50 miles' };
  }

  if (!req.route_type || !['loop', 'one_way'].includes(req.route_type)) {
    return { valid: false, error: 'Route type must be "loop" or "one_way"' };
  }

  if (req.route_type === 'one_way') {
    if (!req.end || typeof req.end.lat !== 'number' || typeof req.end.lng !== 'number') {
      return { valid: false, error: 'End destination is required for one-way routes' };
    }
  }

  if (req.poi) {
    if (!req.poi.place_id || typeof req.poi.place_id !== 'string') {
      return { valid: false, error: 'POI must have a valid place_id' };
    }
    if (!['pass_by', 'stop_at'].includes(req.poi.type)) {
      return { valid: false, error: 'POI type must be "pass_by" or "stop_at"' };
    }
  }

  return { valid: true };
}

/**
 * POST /api/routes/generate
 * Generate a running route based on parameters
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const request: RouteGenerationRequest = {
      start: req.body.start,
      end: req.body.end || null,
      distance_miles: req.body.distance_miles,
      route_type: req.body.route_type as RouteType,
      poi: req.body.poi,
    };

    const route = await generateRoute(request);

    return res.json(route);
  } catch (error) {
    console.error('Route generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate route',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/routes/types
 * Get available route types with descriptions
 */
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    route_types: [
      {
        type: 'loop',
        name: 'Loop Route',
        description: 'Start and end at the same location - perfect for running from home or a parking spot',
        requires_end_destination: false,
      },
      {
        type: 'one_way',
        name: 'One-Way Route',
        description: 'Run from a starting point to a different end destination - great for point-to-point runs',
        requires_end_destination: true,
      },
    ],
  });
});

export default router;
