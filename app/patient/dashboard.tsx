import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Profile } from '../../src/types';
import { getJSON } from '../../src/utils/storage';

type Plan = { id: string; name: string; exercises: number; type: string[] };
type RoutineItem = {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  completed: boolean;
};

export default function PatientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Demo data – replace with your real data later
  const savedPlans: Plan[] = [
    { id: 'p1', name: 'Knee Recovery – Beginner', exercises: 8, type: ['mobility', 'strength'] },
    { id: 'p2', name: 'Lower Back Strengthening', exercises: 10, type: ['core', 'stability'] },
  ];

  const todaysRoutine: RoutineItem[] = [
    { id: 'r1', name: 'Knee Flexion', sets: 3, reps: 10, completed: true },
    { id: 'r2', name: 'Balance Training', duration: '2 min', completed: false },
    { id: 'r3', name: 'Hamstring Stretch', duration: '5 min', completed: false },
  ];

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>('profile');
      setProfile(p);
    })();
  }, []);

  const progressPct = useMemo(() => {
    if (!todaysRoutine.length) return 0;
    const done = todaysRoutine.filter(x => x.completed).length;
    return Math.round((done / todaysRoutine.length) * 100);
  }, [todaysRoutine]);

  const handleStartPlan = (planId: string) => {
    // Navigate to a plan detail or the Plans tab
    router.push('/patient/plans');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Good morning, {profile?.firstName ?? 'Alex'}</Text>
          <Text style={styles.h2}>Day 12 of recovery</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push('/patient/settings')}
          style={styles.iconBtn}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Progress Overview */}
        <View style={styles.cardPrimary}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Today’s Progress</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {todaysRoutine.filter(x => x.completed).length}/{todaysRoutine.length} Complete
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.cardHint}>Great job! Keep it up</Text>
        </View>

        {/* My Plans (patients only) */}
        {savedPlans.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>My Plans</Text>
              <TouchableOpacity onPress={() => router.push('/patient/plans')} style={styles.ghostBtn}>
                <Ionicons name="add" size={16} color="#111827" />
                <Text style={styles.ghostBtnText}>New</Text>
              </TouchableOpacity>
            </View>

            {savedPlans.map(p => (
              <View key={p.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardHeading}>{p.name}</Text>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => handleStartPlan(p.id)}>
                    <Text style={styles.smallBtnText}>Start</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={styles.metaText}>{p.exercises} exercises</Text>
                  <View style={{ flexDirection: 'row', marginLeft: 8, flexWrap: 'wrap' }}>
                    {p.type.map(t => (
                      <View key={t} style={styles.chip}>
                        <Text style={styles.chipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today’s Routine */}
        <View style={{ marginTop: 16, paddingBottom: 16 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Today’s Routine</Text>
            <TouchableOpacity onPress={() => router.push('/patient/plans')} style={styles.ghostBtn}>
              <Ionicons name="add" size={16} color="#111827" />
              <Text style={styles.ghostBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {todaysRoutine.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'time-outline'}
                  size={22}
                  color={item.completed ? '#22c55e' : '#6b7280'}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeading}>{item.name}</Text>
                  <Text style={styles.metaText}>
                    {item.sets && item.reps
                      ? `${item.sets} sets × ${item.reps} reps`
                      : item.duration || 'Complete exercise'}
                  </Text>
                </View>

                {item.completed ? (
                  <View style={styles.badgeLight}>
                    <Text style={styles.badgeLightText}>Complete</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },
  header: {
    paddingTop: 22, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#25292e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  h1: { color: '#fff', fontWeight: '700', fontSize: 20 },
  h2: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 9999, backgroundColor: '#374151' },

  cardPrimary: {
    backgroundColor: '#16a34a', borderRadius: 12, padding: 16,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#fff', fontWeight: '600' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  cardHint: { color: '#f0fdf4', marginTop: 6 },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  ghostBtnText: { marginLeft: 4, color: '#111827', fontWeight: '600' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10 },
  cardHeading: { color: '#111827', fontWeight: '600' },
  metaText: { color: '#6b7280', fontSize: 12 },

  chip: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, marginRight: 6, marginTop: 6 },
  chipText: { fontSize: 11, color: '#111827' },

  smallBtn: { backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700' },

  badgeLight: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeLightText: { color: '#111827', fontWeight: '600', fontSize: 12 },
});
