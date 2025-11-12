import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../firebase/firebaseConfig';
import { getActiveSession, listEntriesForSession, getDateKey } from '../../src/utils/dailyLog';

type Activity = {
  id: string;
  title: string;
  when: string;
  badge?: string; // e.g., "100%", "3/10", "Goal"
  badgeVariant?: 'solid' | 'outline';
  dotColor?: string; // small left dot color
};

export default function ProgressScreen() {
  const router = useRouter();

  const [weekLabel, setWeekLabel] = useState('Week');
  const [completionRate, setCompletionRate] = useState(0);
  const [consistencyPct, setConsistencyPct] = useState(0);
  const [consistencyLabel, setConsistencyLabel] = useState('0/0 days');
  const [week, setWeek] = useState<{ day: string; value: number; done: boolean }[]>([
    { day: 'Mon', value: 0, done: false },
    { day: 'Tue', value: 0, done: false },
    { day: 'Wed', value: 0, done: false },
    { day: 'Thu', value: 0, done: false },
    { day: 'Fri', value: 0, done: false },
    { day: 'Sat', value: 0, done: false },
    { day: 'Sun', value: 0, done: false },
  ]);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      const session = await getActiveSession(user);
      if (!session) return;
      const entries = await listEntriesForSession(user, session);

      const startDate = session.startDate?.toDate ? session.startDate.toDate() : new Date();
      const endDate = session.endDate?.toDate ? session.endDate.toDate() : new Date();
      const today = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      const elapsedDays = Math.min(
        Math.floor((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / msPerDay) + 1,
        session.durationDays || 0
      );
      const currentWeek = Math.max(1, Math.floor(((today.getTime() - startDate.getTime()) / msPerDay) / 7) + 1);
      const totalWeeks = Math.max(1, Math.ceil((session.durationDays || 0) / 7));
      setWeekLabel(`Week ${currentWeek}${totalWeeks ? ` of ${totalWeeks}` : ''}`);

      // Compute completion rate across entries
      let totalDone = 0;
      let totalExercises = 0;
      entries.forEach((e) => {
        totalDone += Number(e.completedCount || 0);
        totalExercises += Number(e.totalExercises || 0);
      });
      const comp = totalExercises > 0 ? Math.round((totalDone / totalExercises) * 100) : 0;
      setCompletionRate(comp);

      // Consistency: days with any completion out of elapsed days
      const byDate: Record<string, { done: number; total: number }> = {};
      entries.forEach((e) => {
        byDate[e.dateKey] = { done: Number(e.completedCount || 0), total: Number(e.totalExercises || 0) };
      });
      let daysWithActivity = 0;
      for (let i = 0; i < elapsedDays; i++) {
        const date = new Date(startDate.getTime() + i * msPerDay);
        const dk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const d = byDate[dk];
        if (d && d.done > 0) daysWithActivity += 1;
      }
      const consPct = elapsedDays > 0 ? Math.round((daysWithActivity / elapsedDays) * 100) : 0;
      setConsistencyPct(consPct);
      setConsistencyLabel(`${daysWithActivity}/${elapsedDays} days`);

      // This Week bars: compute for the last 7 days ending today
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const seven: { day: string; value: number; done: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(base.getTime() - i * msPerDay);
        const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const entry = byDate[dk];
        const value = entry && entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;
        const done = entry ? entry.done === entry.total && entry.total > 0 : false;
        seven.push({ day: days[d.getDay()], value, done });
      }
      setWeek(seven);
    })();
  }, []);

  const activities: Activity[] = useMemo(() => {
    // Basic activity feed from recent entries (last 5)
    const user = auth.currentUser; // not reactive; fine for initial build
    return [
      // Placeholder; can be enhanced to map real entries
    ];
  }, []);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Progress Tracking</Text>
          <Text style={styles.h2}>Your recovery journey</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Overall Progress */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardHeading}>Overall Progress</Text>
            <View style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>{weekLabel}</Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.metaTextDark}>Completion Rate</Text>
              <Text style={styles.metaTextBold}>{completionRate}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${completionRate}%` }]} />
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.metaTextDark}>Consistency</Text>
              <Text style={styles.metaTextBold}>{consistencyLabel}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${consistencyPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Weekly Chart (simple bar chart) */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>This Week</Text>
          <View style={styles.weekRow}>
            {week.map((d) => (
              <View key={d.day} style={styles.weekCol}>
                <View
                  style={[
                    styles.weekBar,
                    {
                      height: Math.max(8, Math.round((d.value / 100) * 96)),
                      backgroundColor: d.done ? '#22c55e' : '#e5e7eb',
                    },
                  ]}
                />
                <Text style={styles.weekLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={{ marginTop: 12, marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {activities.map((a) => (
            <View key={a.id} style={styles.activityCard}>
              <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: a.dotColor ?? '#22c55e', marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <Text style={styles.activityWhen}>{a.when}</Text>
              </View>
              {a.badge ? (
                a.badgeVariant === 'outline' ? (
                  <View style={styles.badgeOutline}><Text style={styles.badgeOutlineText}>{a.badge}</Text></View>
                ) : (
                  <View style={styles.badgeGoal}><Text style={styles.badgeGoalText}>{a.badge}</Text></View>
                )
              ) : null}
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

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...(Platform.OS === 'android' ? { elevation: 1 } : {}),
  },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeading: { color: '#111827', fontWeight: '700', fontSize: 16 },

  badgePrimary: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  badgePrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  track: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 8, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#22c55e' },

  metaTextDark: { color: '#374151', fontSize: 12 },
  metaTextBold: { color: '#111827', fontSize: 12, fontWeight: '700' },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 8 },

  // Weekly chart
  weekRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, height: 120 },
  weekCol: { alignItems: 'center', justifyContent: 'flex-end', width: 28 },
  weekBar: { width: 18, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  weekLabel: { fontSize: 11, color: '#6b7280', marginTop: 6 },

  // Activities
  activityCard: {
    backgroundColor: '#fff', padding: 12, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  activityTitle: { color: '#111827', fontWeight: '600', fontSize: 14 },
  activityWhen: { color: '#6b7280', fontSize: 12 },

  badgeOutline: { borderWidth: 1, borderColor: '#9ca3af', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeOutlineText: { color: '#374151', fontWeight: '600', fontSize: 12 },

  badgeGoal: { backgroundColor: '#0ea5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeGoalText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
