import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebase/firebaseConfig';
import { listUserRoutines, type Routine } from '../../src/utils/userRotuines';

export default function RoutineLibraryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);

  const load = async () => {
    const user = auth.currentUser;
    if (!user) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    try {
      const list = await listUserRoutines(user.uid);
      setRoutines(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Routines</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#22c55e" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {routines.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center' }] }>
              <Text style={styles.emptyText}>No routines yet</Text>
              <Text style={styles.emptySub}>Create one from the builder.</Text>
            </View>
          ) : (
            routines.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.card}
                accessibilityRole="button"
                onPress={() => router.push(`/routines/edit?id=${r.id}`)}
              >
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.cardTitle}>{r.name || 'Untitled Routine'}</Text>
                    {!!r.description && <Text style={styles.cardSub} numberOfLines={2}>{r.description}</Text>}
                    <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
                      <View style={styles.badgeLight}><Text style={styles.badgeLightText}>{r.visibility}</Text></View>
                      {!!r.summary?.totalExercises && (
                        <View style={[styles.badgeLight, { marginLeft: 6 }]}>
                          <Text style={styles.badgeLightText}>{r.summary.totalExercises} exercises</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#25292e',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 18 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#111827', fontWeight: '700' },
  cardSub: { color: '#6b7280', marginTop: 2 },

  badgeLight: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeLightText: { color: '#111827', fontWeight: '600', fontSize: 12 },

  emptyText: { color: '#111827', fontWeight: '700' },
  emptySub: { color: '#6b7280', marginTop: 4 },
});

