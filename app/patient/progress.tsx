import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

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

  // Demo metrics (swap with real data later)
  const completionRate = 85; // %
  const consistencyPct = 86; // % (12/14 days)
  const weekLabel = 'Week 2';

  // Simple weekly bars. Values are "percent of target" per day
  const week = useMemo(
    () => [
      { day: 'Mon', value: 30, done: true },
      { day: 'Tue', value: 45, done: true },
      { day: 'Wed', value: 60, done: true },
      { day: 'Thu', value: 75, done: true },
      { day: 'Fri', value: 90, done: true },
      { day: 'Sat', value: 15, done: false },
      { day: 'Sun', value: 10, done: false },
    ],
    []
  );

  const activities: Activity[] = [
    { id: 'a1', title: 'Completed morning routine', when: 'Today, 9:30 AM', badge: '100%', badgeVariant: 'solid', dotColor: '#16a34a' },
    { id: 'a2', title: 'Pain level logged', when: 'Yesterday, 8:15 PM', badge: '3/10', badgeVariant: 'outline', dotColor: '#22c55e' },
    { id: 'a3', title: 'New milestone reached', when: '2 days ago', badge: 'Goal', badgeVariant: 'solid', dotColor: '#0ea5e9' },
  ];

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
              <Text style={styles.metaTextBold}>12/14 days</Text>
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
