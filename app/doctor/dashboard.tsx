import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Profile } from '../../src/types';
import { getJSON } from '../../src/utils/storage';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>('profile');
      setProfile(p);
    })();
  }, []);

  const displayName = profile
    ? `${profile.userType === 'doctor' ? 'Dr. ' : ''}${profile.firstName}`
    : 'Dr. Alex';

  
  const subTitle = 'Doctor/Therapist'; 

  return (
    <View style={styles.screen}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>{displayName}</Text>
          <Text style={styles.h2}>{subTitle}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push('/doctor/settings')}
          style={styles.iconBtn}
        >
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push('/doctor/patients')}
        >
          <Ionicons name="people-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Manage Patients</Text>
            <Text style={styles.actionSub}>View and assign routines</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push('/doctor/create')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Create New Routine</Text>
            <Text style={styles.actionSub}>Build custom recovery plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* Optional: quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Active Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Plans Pending</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },

  header: {
    paddingTop: 22,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#25292e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h1: { color: '#fff', fontWeight: '700', fontSize: 20 },
  h2: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 9999, backgroundColor: '#374151' },

  body: { padding: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 10 },

  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: { color: '#111827', fontWeight: '600' },
  actionSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  statsRow: { flexDirection: 'row', marginTop: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  statNumber: { color: '#22c55e', fontWeight: '800', fontSize: 20 },
  statLabel: { color: '#6b7280', fontSize: 12 },
});
// Note: Adjust the import paths for Profile type and getJSON function based on your project structure.