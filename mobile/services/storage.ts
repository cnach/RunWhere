import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedRoute, SavedRoute, RunStats } from '../types/route';

const SAVED_ROUTES_KEY = 'runwhere_saved_routes';
const RUN_HISTORY_KEY = 'runwhere_run_history';

export interface CompletedRun {
  id: string;
  route_id: string;
  route_name?: string;
  stats: RunStats;
  completed_at: string;
}

export const storageService = {
  // Saved Routes
  async getSavedRoutes(): Promise<SavedRoute[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_ROUTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get saved routes:', error);
      return [];
    }
  },

  async saveRoute(name: string, route: GeneratedRoute): Promise<SavedRoute> {
    const savedRoute: SavedRoute = {
      id: `route_${Date.now()}`,
      name,
      route,
      created_at: new Date().toISOString(),
    };

    try {
      const existing = await this.getSavedRoutes();
      const updated = [savedRoute, ...existing];
      await AsyncStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
      return savedRoute;
    } catch (error) {
      console.error('Failed to save route:', error);
      throw error;
    }
  },

  async deleteRoute(routeId: string): Promise<void> {
    try {
      const existing = await this.getSavedRoutes();
      const updated = existing.filter((r) => r.id !== routeId);
      await AsyncStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete route:', error);
      throw error;
    }
  },

  // Run History
  async getRunHistory(): Promise<CompletedRun[]> {
    try {
      const data = await AsyncStorage.getItem(RUN_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get run history:', error);
      return [];
    }
  },

  async saveRun(
    routeId: string,
    routeName: string | undefined,
    stats: RunStats
  ): Promise<CompletedRun> {
    const run: CompletedRun = {
      id: `run_${Date.now()}`,
      route_id: routeId,
      route_name: routeName,
      stats,
      completed_at: new Date().toISOString(),
    };

    try {
      const existing = await this.getRunHistory();
      const updated = [run, ...existing];
      await AsyncStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(updated));
      return run;
    } catch (error) {
      console.error('Failed to save run:', error);
      throw error;
    }
  },

  async deleteRun(runId: string): Promise<void> {
    try {
      const existing = await this.getRunHistory();
      const updated = existing.filter((r) => r.id !== runId);
      await AsyncStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete run:', error);
      throw error;
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SAVED_ROUTES_KEY, RUN_HISTORY_KEY]);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  },
};
