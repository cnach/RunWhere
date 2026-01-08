import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SavedRoute, GeneratedRoute } from '../types/route';
import { storageService } from '../services/storage';

interface SavedRoutesProps {
  visible: boolean;
  onClose: () => void;
  onSelectRoute: (route: GeneratedRoute) => void;
  currentRoute?: GeneratedRoute | null;
}

export function SavedRoutes({
  visible,
  onClose,
  onSelectRoute,
  currentRoute,
}: SavedRoutesProps) {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRoutes();
    }
  }, [visible]);

  const loadRoutes = async () => {
    const routes = await storageService.getSavedRoutes();
    setSavedRoutes(routes);
  };

  const handleSaveCurrentRoute = async () => {
    if (!currentRoute || !routeName.trim()) return;

    setLoading(true);
    try {
      await storageService.saveRoute(routeName.trim(), currentRoute);
      setShowSaveModal(false);
      setRouteName('');
      loadRoutes();
      Alert.alert('Success', 'Route saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = (route: SavedRoute) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${route.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteRoute(route.id);
            loadRoutes();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Routes</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {currentRoute && (
        <TouchableOpacity
          style={styles.saveCurrentButton}
          onPress={() => setShowSaveModal(true)}
        >
          <Text style={styles.saveCurrentButtonText}>
            💾 Save Current Route
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={savedRoutes}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.routeItem}
            onPress={() => {
              onSelectRoute(item.route);
              onClose();
            }}
          >
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{item.name}</Text>
              <View style={styles.routeMeta}>
                <Text style={styles.routeDistance}>
                  {item.route.distance_miles} mi
                </Text>
                <Text style={styles.routeType}>
                  {item.route.route_type === 'loop' ? '🔄 Loop' : '➡️ One-way'}
                </Text>
                <Text style={styles.routeDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteRoute(item)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No saved routes yet</Text>
            <Text style={styles.emptySubtext}>
              Generate a route and save it for quick access
            </Text>
          </View>
        }
      />

      {/* Save Route Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Route</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter route name"
              placeholderTextColor="#999"
              value={routeName}
              onChangeText={setRouteName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSaveModal(false);
                  setRouteName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  !routeName.trim() && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleSaveCurrentRoute}
                disabled={!routeName.trim() || loading}
              >
                <Text style={styles.modalSaveText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  saveCurrentButton: {
    backgroundColor: '#E8F4FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  saveCurrentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  routeDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  routeType: {
    fontSize: 14,
    color: '#666',
  },
  routeDate: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
