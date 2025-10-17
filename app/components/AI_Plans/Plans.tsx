import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AccountType = 'patient' | 'doctor';

type Props = {
  accountType: AccountType;
  backRouteOverride?: string;
  createRouteOverride?: string;
  selectPlanRouteOverride?: string;
};

export default function Plans({
  accountType,
  backRouteOverride,
  createRouteOverride,
  selectPlanRouteOverride,
}: Props) {
  const router = useRouter();

  const backRoute = backRouteOverride ?? `/${accountType}/dashboard`;
  const createRoute = createRouteOverride ??
    (accountType === 'patient' ? '/patient/manual-builder' : '/doctor/create');
  const selectPlanRoute = selectPlanRouteOverride ?? `/${accountType}/dashboard`;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push(backRoute)}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recovery Plans</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Create Custom Plan */}
        <TouchableOpacity
          style={[styles.outlineBtn, { marginTop: 12 }]}
          accessibilityRole="button"
          onPress={() => router.push(createRoute)}
        >
          <Ionicons name="create-outline" size={18} color="#22c55e" style={{ marginRight: 8 }} />
          <Text style={styles.outlineBtnText}>Create Custom Plan</Text>
        </TouchableOpacity>

        {/* bottom spacer so content doesn't hide behind tab bar */}
        <View style={{ height: 72 }} />

        {/* Recommended Plans */}
        <Text style={styles.sectionTitle}>Recommended Plans</Text>

        {/* Plan 1 */}
        <View style={[styles.card, { borderWidth: 2, borderColor: '#22c55e' }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.cardTitleDark, { color: '#16a34a' }]}>Post-Surgery Knee Recovery</Text>
              <Text style={styles.cardSubDark}>4-week progressive plan</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#22c55e' }]}>
              <Text style={[styles.badgeText, { color: '#fff' }]}>AI Generated</Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>28 days • 15 min/day</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="trending-up-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>Gradual intensity increase</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.solidBtn, { marginTop: 14 }]}
            onPress={() => router.push(selectPlanRoute)}
          >
            <Text style={styles.solidBtnText}>Select This Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Plan 2 */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitleDark}>Basic Mobility Recovery</Text>
              <Text style={styles.cardSubDark}>2-week starter plan</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[styles.badgeText, { color: '#111827' }]}>Template</Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>14 days • 10 min/day</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="disc-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>Focus on flexibility</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.outlineBtn, { marginTop: 14 }]} accessibilityRole="button">
            <Text style={styles.outlineBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#25292e',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 18 },

  content: { padding: 16 },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 16, marginBottom: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10,
  },
  cardTitleDark: { color: '#111827', fontWeight: '700' },
  cardSubDark: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { color: '#6b7280', fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  solidBtn: {
    backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  solidBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#22c55e', backgroundColor: '#ffffff',
    paddingVertical: 12, borderRadius: 12,
  },
  outlineBtnText: { color: '#22c55e', fontWeight: '700', fontSize: 16 },
});
