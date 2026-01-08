import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { GeneratedRoute, SavedRoute, RunStats } from '../types/route';
import { storageService, CompletedRun } from './storage';

// Firestore collection names
const ROUTES_COLLECTION = 'saved_routes';
const RUNS_COLLECTION = 'run_history';

interface FirestoreSavedRoute {
  name: string;
  route: GeneratedRoute;
  created_at: Timestamp;
}

interface FirestoreCompletedRun {
  route_id: string;
  route_name?: string;
  stats: RunStats;
  completed_at: Timestamp;
}

/**
 * Get the current user's ID or null if not authenticated
 */
function getUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Get reference to user's routes collection
 */
function getUserRoutesRef() {
  const userId = getUserId();
  if (!userId) return null;
  return collection(db, 'users', userId, ROUTES_COLLECTION);
}

/**
 * Get reference to user's runs collection
 */
function getUserRunsRef() {
  const userId = getUserId();
  if (!userId) return null;
  return collection(db, 'users', userId, RUNS_COLLECTION);
}

export const cloudStorageService = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return getUserId() !== null;
  },

  // ============ SAVED ROUTES ============

  /**
   * Get all saved routes (cloud if authenticated, local if not)
   */
  async getSavedRoutes(): Promise<SavedRoute[]> {
    const routesRef = getUserRoutesRef();

    if (!routesRef) {
      // Fallback to local storage for guests
      return storageService.getSavedRoutes();
    }

    try {
      const q = query(routesRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreSavedRoute;
        return {
          id: doc.id,
          name: data.name,
          route: data.route,
          created_at: data.created_at.toDate().toISOString(),
        };
      });
    } catch (error) {
      console.error('Failed to get saved routes from cloud:', error);
      // Fallback to local storage
      return storageService.getSavedRoutes();
    }
  },

  /**
   * Save a route (cloud if authenticated, local if not)
   */
  async saveRoute(name: string, route: GeneratedRoute): Promise<SavedRoute> {
    const routesRef = getUserRoutesRef();

    if (!routesRef) {
      // Fallback to local storage for guests
      return storageService.saveRoute(name, route);
    }

    try {
      const docRef = await addDoc(routesRef, {
        name,
        route,
        created_at: serverTimestamp(),
      });

      return {
        id: docRef.id,
        name,
        route,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to save route to cloud:', error);
      // Fallback to local storage
      return storageService.saveRoute(name, route);
    }
  },

  /**
   * Delete a saved route
   */
  async deleteRoute(routeId: string): Promise<void> {
    const routesRef = getUserRoutesRef();

    if (!routesRef) {
      return storageService.deleteRoute(routeId);
    }

    try {
      await deleteDoc(doc(routesRef, routeId));
    } catch (error) {
      console.error('Failed to delete route from cloud:', error);
      // Try local storage as well
      await storageService.deleteRoute(routeId);
    }
  },

  // ============ RUN HISTORY ============

  /**
   * Get all completed runs (cloud if authenticated, local if not)
   */
  async getRunHistory(): Promise<CompletedRun[]> {
    const runsRef = getUserRunsRef();

    if (!runsRef) {
      return storageService.getRunHistory();
    }

    try {
      const q = query(runsRef, orderBy('completed_at', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreCompletedRun;
        return {
          id: doc.id,
          route_id: data.route_id,
          route_name: data.route_name,
          stats: data.stats,
          completed_at: data.completed_at.toDate().toISOString(),
        };
      });
    } catch (error) {
      console.error('Failed to get run history from cloud:', error);
      return storageService.getRunHistory();
    }
  },

  /**
   * Save a completed run
   */
  async saveRun(
    routeId: string,
    routeName: string | undefined,
    stats: RunStats
  ): Promise<CompletedRun> {
    const runsRef = getUserRunsRef();

    if (!runsRef) {
      return storageService.saveRun(routeId, routeName, stats);
    }

    try {
      const docRef = await addDoc(runsRef, {
        route_id: routeId,
        route_name: routeName,
        stats,
        completed_at: serverTimestamp(),
      });

      return {
        id: docRef.id,
        route_id: routeId,
        route_name: routeName,
        stats,
        completed_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to save run to cloud:', error);
      return storageService.saveRun(routeId, routeName, stats);
    }
  },

  /**
   * Delete a completed run
   */
  async deleteRun(runId: string): Promise<void> {
    const runsRef = getUserRunsRef();

    if (!runsRef) {
      return storageService.deleteRun(runId);
    }

    try {
      await deleteDoc(doc(runsRef, runId));
    } catch (error) {
      console.error('Failed to delete run from cloud:', error);
      await storageService.deleteRun(runId);
    }
  },

  // ============ MIGRATION ============

  /**
   * Migrate local data to cloud after user signs in
   */
  async migrateLocalToCloud(): Promise<{ routes: number; runs: number }> {
    if (!this.isAuthenticated()) {
      return { routes: 0, runs: 0 };
    }

    let routesMigrated = 0;
    let runsMigrated = 0;

    try {
      // Migrate saved routes
      const localRoutes = await storageService.getSavedRoutes();
      for (const route of localRoutes) {
        await this.saveRoute(route.name, route.route);
        await storageService.deleteRoute(route.id);
        routesMigrated++;
      }

      // Migrate run history
      const localRuns = await storageService.getRunHistory();
      for (const run of localRuns) {
        await this.saveRun(run.route_id, run.route_name, run.stats);
        await storageService.deleteRun(run.id);
        runsMigrated++;
      }
    } catch (error) {
      console.error('Migration error:', error);
    }

    return { routes: routesMigrated, runs: runsMigrated };
  },

  /**
   * Get user stats summary
   */
  async getUserStats(): Promise<{
    totalRuns: number;
    totalDistance: number;
    totalTime: number;
    savedRoutes: number;
  }> {
    const runs = await this.getRunHistory();
    const routes = await this.getSavedRoutes();

    const totals = runs.reduce(
      (acc, run) => ({
        totalDistance: acc.totalDistance + run.stats.distance_meters,
        totalTime: acc.totalTime + run.stats.duration_seconds,
      }),
      { totalDistance: 0, totalTime: 0 }
    );

    return {
      totalRuns: runs.length,
      totalDistance: totals.totalDistance,
      totalTime: totals.totalTime,
      savedRoutes: routes.length,
    };
  },
};
