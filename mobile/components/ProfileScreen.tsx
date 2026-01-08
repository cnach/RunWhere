import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorageService } from '../services/cloudStorage';

interface ProfileScreenProps {
  onClose: () => void;
  onSignIn: () => void;
}

interface UserStats {
  totalRuns: number;
  totalDistance: number;
  totalTime: number;
  savedRoutes: number;
}

export function ProfileScreen({ onClose, onSignIn }: ProfileScreenProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const userStats = await cloudStorageService.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain synced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34;
    return miles.toFixed(1);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {user ? (
        // Logged in state
        <View style={styles.content}>
          <View style={styles.profileSection}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.displayName?.[0] || user.email?.[0] || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>
              {user.displayName || 'Runner'}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>☁️ Synced</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color="#007AFF" />
          ) : stats ? (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Your Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalRuns}</Text>
                  <Text style={styles.statLabel}>Runs</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {formatDistance(stats.totalDistance)}
                  </Text>
                  <Text style={styles.statLabel}>Miles</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {formatTime(stats.totalTime)}
                  </Text>
                  <Text style={styles.statLabel}>Time</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.savedRoutes}</Text>
                  <Text style={styles.statLabel}>Routes</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Not logged in state
        <View style={styles.content}>
          <View style={styles.guestSection}>
            <Text style={styles.guestIcon}>👤</Text>
            <Text style={styles.guestTitle}>Guest Mode</Text>
            <Text style={styles.guestText}>
              Sign in to sync your routes and runs across all your devices
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color="#007AFF" />
          ) : stats ? (
            <View style={styles.localDataSection}>
              <Text style={styles.localDataTitle}>Local Data</Text>
              <Text style={styles.localDataText}>
                {stats.savedRoutes} saved routes • {stats.totalRuns} runs
              </Text>
              <Text style={styles.localDataWarning}>
                ⚠️ This data is only stored on this device
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  syncBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsSection: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  signOutButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  guestSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  localDataSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  localDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  localDataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  localDataWarning: {
    fontSize: 12,
    color: '#F57C00',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
