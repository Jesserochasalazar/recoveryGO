import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebase/firebaseConfig';
import type { Profile } from '../../src/types';
import { getJSON } from '../../src/utils/storage';
import { listUserRoutines, type Routine, getRoutine } from '../../src/utils/userRotuines';
import { listUserGeneratedPlans, type GeneratedPlan, getGeneratedPlan } from '../../src/utils/generatedPlans';
import {
  getActiveSession,
  startOrReplacePlanSession,
  ensureTodayEntry,
  getDailyEntry,
  updateDailyEntryStatus,
  getDateKey,
  replaceTodayEntryWithPlan,
  type ExerciseSummary,
} from '../../src/utils/dailyLog';

type RoutineItem = {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  status?: 'pending' | 'in_progress' | 'completed';
};

export default function PatientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [generated, setGenerated] = useState<GeneratedPlan[]>([]);

  // Demo data – replace with your real data later

  const [todaysRoutine, setTodaysRoutine] = useState<RoutineItem[]>([]);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>('profile');
      setProfile(p);
    })();
  }, []);

  // Load user's routines for "My Plans" list
  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (active) { setRoutines([]); setGenerated([]); }
        return;
      }
      try {
        const list = await listUserRoutines(user.uid);
        const gen = await listUserGeneratedPlans(user.uid);
        if (active) { setRoutines(list); setGenerated(gen); }
      } catch {
        if (active) { setRoutines([]); setGenerated([]); }
      }
    };
    load();
    return () => { active = false; };
  }, []);

  // Load today's persisted entry (if any) for the signed-in user
  useEffect(() => {
    let active = true;
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        let entry = await getDailyEntry(user, getDateKey());
        if (!entry) {
          const session = await getActiveSession(user);
          const now = Date.now();
          const endMs = (session as any)?.endDate?.toMillis ? (session as any).endDate.toMillis() : 0;
          if (session && endMs > now) {
            entry = await ensureTodayEntry(user, {
              planType: session.planType as any,
              planId: session.planId,
              planName: session.planName,
              exercises: (session as any)?.exercises || [],
            });
          }
        }
        if (entry && active) {
          const items: RoutineItem[] = (entry.exercises || []).map((e) => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            duration: e.duration,
            status: (entry.statuses?.[e.id] as any) || 'pending',
          }));
          setTodaysRoutine(items);
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const progressPct = useMemo(() => {
    if (!todaysRoutine.length) return 0;
    const done = todaysRoutine.filter(x => x.status === 'completed').length;
    return Math.round((done / todaysRoutine.length) * 100);
  }, [todaysRoutine]);

  const handleStartPlan = async (planId: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to start a plan.');
      return;
    }
    try {
      const isRoutine = planId.startsWith('r-');
      const id = isRoutine ? planId.slice(2) : planId.slice(2);
      const plan = isRoutine ? await getRoutine(id) : await getGeneratedPlan(id);
      const name = (plan as any)?.name;
      const durationString = (plan as any)?.duration as any;
      const ex: ExerciseSummary[] = (((plan as any)?.exercises) ?? []).map((e: any, i: number) => ({
        id: e.id || String(Date.now() + i),
        name: e.name || `Exercise ${i + 1}`,
        sets: e.sets,
        reps: e.reps,
        duration: e.duration,
      }));

      const existing = await getDailyEntry(user, getDateKey());

      const doStartFresh = async (resetDuration: boolean) => {
        // Update session (optionally reset duration), overwrite today's entry, update UI
        await startOrReplacePlanSession(user, {
          planType: isRoutine ? 'routine' : 'generated',
          planId: id,
          planName: name,
          durationString,
          exercises: ex,
          keepRemaining: !resetDuration,
        });
        const entry = await replaceTodayEntryWithPlan(user, {
          planType: isRoutine ? 'routine' : 'generated',
          planId: id,
          planName: name,
          exercises: ex,
        });
        const items: RoutineItem[] = (entry.exercises || []).map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          duration: e.duration,
          status: (entry.statuses?.[e.id] as any) || 'pending',
        }));
        setTodaysRoutine(items);
      };

      if (!existing) {
        // No entry yet: start fresh, keep duration window as-is for existing sessions
        await doStartFresh(false);
        return;
      }

      // If entry exists and it's the same plan, just load it
      if ((existing.planType === (isRoutine ? 'routine' : 'generated')) && existing.planId === id) {
        const items: RoutineItem[] = (existing.exercises || []).map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          duration: e.duration,
          status: (existing.statuses?.[e.id] as any) || 'pending',
        }));
        setTodaysRoutine(items);
        return;
      }

      // Entry exists for a different plan: prompt user
      const keepExistingHandler = async () => {
        // Align session to existing entry so session and dashboard match
        try {
          await startOrReplacePlanSession(user, {
            planType: existing.planType as any,
            planId: existing.planId,
            planName: (existing as any).planName,
            durationString: null as any,
            exercises: ((existing.exercises || []) as any[]).map((e) => ({
              id: e.id,
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              duration: e.duration,
            })),
            keepRemaining: true,
          });
        } catch {}
        const items: RoutineItem[] = (existing.exercises || []).map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          duration: e.duration,
          status: (existing.statuses?.[e.id] as any) || 'pending',
        }));
        setTodaysRoutine(items);
      };

      if (Platform.OS === 'web') {
        const confirmFresh = typeof window !== 'undefined' && (window as any).confirm
          ? (window as any).confirm(
              "Today's plan already exists. Start fresh with the new plan (resets today's progress and duration window)?"
            )
          : false;
        if (confirmFresh) await doStartFresh(true);
        else await keepExistingHandler();
      } else {
        Alert.alert(
          "Today's plan already exists",
          "Do you want to keep today's current plan, or start fresh with the new plan and reset today's progress (and duration window)?",
          [
            { text: 'Keep Current', style: 'cancel', onPress: () => { keepExistingHandler(); } },
            { text: 'Start Fresh', style: 'destructive', onPress: async () => { await doStartFresh(true); } },
          ]
        );
      }
    } catch (e: any) {
      console.warn('Failed to start plan', e);
      Alert.alert('Failed to start plan', e?.message ?? 'Please try again.');
    }
  };

  const handleStartExercise = async (id: string) => {
    setTodaysRoutine((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'in_progress' } : it)));
    const user = auth.currentUser; if (user) await updateDailyEntryStatus(user, getDateKey(), id, 'in_progress');
  };

  const handleCompleteExercise = async (id: string) => {
    setTodaysRoutine((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'completed' } : it)));
    const user = auth.currentUser; if (user) await updateDailyEntryStatus(user, getDateKey(), id, 'completed');
  };

  const plansToShow = useMemo(() => {
    const toMs = (t: any): number => {
      try {
        if (!t) return 0;
        if (typeof t === 'number') return t;
        if (typeof t?.toMillis === 'function') return t.toMillis();
        if (typeof t?.toDate === 'function') return t.toDate().getTime();
        if (typeof t?.seconds === 'number') return Math.floor(t.seconds * 1000);
      } catch {}
      return 0;
    };

    const items = [
      ...routines.map((r) => ({
        id: `r-${r.id}`,
        name: r.name || 'Untitled Routine',
        exercises:
          r.summary?.totalExercises ?? (Array.isArray(r.exercises) ? r.exercises.length : 0),
        type: ['Routine', r.visibility, r.duration || ''].filter(Boolean) as string[],
        createdAtMs: toMs((r as any)?.updatedAt ?? (r as any)?.createdAt),
      })),
      ...generated.map((g) => ({
        id: `g-${g.id}`,
        name: g.name || 'AI Generated Routine',
        exercises:
          g.summary?.totalExercises ?? (Array.isArray(g.exercises) ? g.exercises.length : 0),
        type: ['AI', g.visibility, g.duration || ''].filter(Boolean) as string[],
        createdAtMs: toMs((g as any)?.updatedAt ?? (g as any)?.createdAt),
      })),
    ];

    items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return items.map(({ createdAtMs, ...rest }) => rest);
  }, [routines, generated]);

  // Pagination for "My Plans" (5 per page)
  const PLANS_PAGE_SIZE = 5;
  const [planPage, setPlanPage] = useState(0);
  const totalPlanPages = Math.max(1, Math.ceil(plansToShow.length / PLANS_PAGE_SIZE));
  const pagedPlans = useMemo(() => {
    const start = planPage * PLANS_PAGE_SIZE;
    return plansToShow.slice(start, start + PLANS_PAGE_SIZE);
  }, [plansToShow, planPage]);
  useEffect(() => {
    // Reset to first page when list size changes
    setPlanPage(0);
  }, [plansToShow.length]);

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
 <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/patient/progress')}>
  <View style={styles.cardPrimary}>
    <View style={styles.rowBetween}>
      <Text style={styles.cardTitle}>Today’s Progress</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {todaysRoutine.filter(x => x.status === 'completed').length}/{todaysRoutine.length} Complete
        </Text>
      </View>
    </View>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
    </View>
    <Text style={styles.cardHint}>Great job! Keep it up</Text>
  </View>
</TouchableOpacity>


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
                  name={item.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                  size={22}
                  color={item.status === 'completed' ? '#22c55e' : '#6b7280'}
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

                {item.status === 'completed' ? (
                  <View style={styles.badgeLight}>
                    <Text style={styles.badgeLightText}>Complete</Text>
                  </View>
                ) : item.status === 'in_progress' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.badgeLight, { marginRight: 8 }]}>
                      <Text style={styles.badgeLightText}>In-Progress</Text>
                    </View>
                    <TouchableOpacity style={styles.smallBtn} onPress={() => handleCompleteExercise(item.id)}>
                      <Text style={styles.smallBtnText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.smallBtn} onPress={() => handleStartExercise(item.id)}>
                    <Text style={styles.smallBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* My Plans (patients only) */}
        {plansToShow.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>My Plans</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Pagination controls */}
                <TouchableOpacity
                  onPress={() => setPlanPage((p) => Math.max(0, p - 1))}
                  disabled={planPage === 0}
                  style={[styles.ghostBtn, { marginRight: 8, opacity: planPage === 0 ? 0.5 : 1 }]}
                >
                  <Ionicons name="chevron-back" size={16} color="#111827" />
                  <Text style={styles.ghostBtnText}>Prev</Text>
                </TouchableOpacity>
                <View style={[styles.ghostBtn, { paddingHorizontal: 10, paddingVertical: 6 }]}> 
                  <Text style={styles.ghostBtnText}>{planPage + 1}/{totalPlanPages}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1))}
                  disabled={planPage >= totalPlanPages - 1}
                  style={[styles.ghostBtn, { marginLeft: 8, opacity: planPage >= totalPlanPages - 1 ? 0.5 : 1 }]}
                >
                  <Text style={styles.ghostBtnText}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/patient/plans')} style={[styles.ghostBtn, { marginLeft: 8 }]}>
                  <Ionicons name="add" size={16} color="#111827" />
                  <Text style={styles.ghostBtnText}>New</Text>
                </TouchableOpacity>
              </View>
            </View>

            {pagedPlans.map(p => (
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
