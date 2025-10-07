import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  condition: string;
  status: 'Active' | 'New' | 'Completed';
  progress: number; // 0-100
};

const DEMO_PATIENTS: Patient[] = [
  { id: '1', firstName: 'Alex', lastName: 'Johnson', condition: 'Knee surgery recovery', status: 'Active', progress: 85 },
  { id: '2', firstName: 'Maria', lastName: 'Rodriguez', condition: 'Shoulder rehabilitation', status: 'New', progress: 12 },
  { id: '3', firstName: 'David', lastName: 'Lee', condition: 'Back pain therapy', status: 'Completed', progress: 100 },
  { id: '4', firstName: 'Sofia', lastName: 'Nguyen', condition: 'Ankle mobility', status: 'Active', progress: 56 },
];

export default function PatientsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_PATIENTS;
    return DEMO_PATIENTS.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.condition.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={{ padding: 16 }}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search patients..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {filtered.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.avatar, avatarBg(p.status)]}>
                  <Text style={styles.avatarText}>{initials(p)}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{p.firstName} {p.lastName}</Text>
                  <Text style={styles.cardSub}>{p.condition}</Text>
                </View>
              </View>
              <View style={[styles.badge, badgeStyle(p.status)]}>
                <Text style={[styles.badgeText, badgeTextStyle(p.status)]}>{p.status}</Text>
              </View>
            </View>

            <View style={[styles.rowBetween, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.metaLabel}>Progress: </Text>
                <Text style={styles.metaValue}>{p.progress}%</Text>
              </View>

              {p.status === 'Completed' ? (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => router.push(`/doctor/patient/${p.id}/report`)}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineBtnText}>View Report</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => router.push(`/doctor/patient/${p.id}/assign`)}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineBtnText}>Assign Routine</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={36} color="#9ca3af" />
            <Text style={styles.emptyText}>No patients match “{query}”.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* Helpers */
function initials(p: Patient) {
  return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
}
function avatarBg(status: Patient['status']) {
  switch (status) {
    case 'Active': return { backgroundColor: '#22c55e' };
    case 'New': return { backgroundColor: '#38bdf8' };
    case 'Completed': return { backgroundColor: '#a78bfa' };
    default: return { backgroundColor: '#6b7280' };
  }
}
function badgeStyle(status: Patient['status']) {
  switch (status) {
    case 'Active': return { backgroundColor: '#DCFCE7' };
    case 'New': return { backgroundColor: '#E0F2FE' };
    case 'Completed': return { backgroundColor: '#EDE9FE' };
    default: return { backgroundColor: '#E5E7EB' };
  }
}
function badgeTextStyle(status: Patient['status']) {
  switch (status) {
    case 'Active': return { color: '#166534' };
    case 'New': return { color: '#075985' };
    case 'Completed': return { color: '#6D28D9' };
    default: return { color: '#111827' };
  }
}

/* Styles — aligned with your dashboard colors */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },
  header: {
    paddingTop: 22, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#25292e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#374151' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },

  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 12 },
  searchInput: {
    backgroundColor: '#1f2937',
    color: '#fff',
    paddingVertical: 10,
    paddingLeft: 38,
    paddingRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },

  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '700' },
  cardTitle: { color: '#111827', fontWeight: '600' },
  cardSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { fontWeight: '600', fontSize: 12 },

  metaLabel: { color: '#6b7280', fontSize: 13 },
  metaValue: { color: '#111827', fontWeight: '700', fontSize: 13 },

  outlineBtn: {
    borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: '#fff',
  },
  outlineBtnText: { color: '#111827', fontWeight: '600' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#9ca3af', marginTop: 8 },
});
