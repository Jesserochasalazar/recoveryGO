import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { auth } from '../../../firebase/firebaseConfig';
import { createGeneratedPlan, listUserGeneratedPlans, type GeneratedPlan } from '../../../src/utils/generatedPlans';

type AccountType = 'patient' | 'doctor';

type Props = {
  accountType: AccountType;
  backRouteOverride?: Href;
  createRouteOverride?: Href;
  selectPlanRouteOverride?: Href;
};

export default function Plans({
  accountType,
  backRouteOverride,
  createRouteOverride,
  selectPlanRouteOverride,
}: Props) {
  const router = useRouter();

  const backRoute = (backRouteOverride ?? `/${accountType}/dashboard`) as Href;
  const manualCreateRoute = (createRouteOverride ??
    (accountType === 'patient' ? '/patient/manual-builder' : '/doctor/create')) as Href;
  const selectPlanRoute = (selectPlanRouteOverride ?? `/${accountType}/dashboard`) as Href;

  const [showAIForm, setShowAIForm] = useState(false);
  const [injuryType, setInjuryType] = useState('Shoulder');
  const [goals, setGoals] = useState('Mobility and strength');
  const [durationWeeks, setDurationWeeks] = useState('8');
  const [numExercises, setNumExercises] = useState('5');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [visibility, setVisibility] = useState<'Private' | 'Public'>('Public');
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<GeneratedPlan[] | null>(null);

  const canGenerate = useMemo(() => {
    return !!injuryType && !!goals && Number(durationWeeks) > 0 && Number(numExercises) > 0;
  }, [injuryType, goals, durationWeeks, numExercises]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!auth.currentUser) return;
      try {
        const res = await listUserGeneratedPlans(auth.currentUser.uid);
        if (active) setPlans(res);
      } catch (e) {
        console.warn('Failed to load generated plans', e);
      }
    })();
    return () => { active = false; };
  }, []);

  async function onGenerateAndSave() {
    if (!auth.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to generate a routine.');
      return;
    }
    try {
      setBusy(true);
      const payload = {
        injuryType,
        goals,
        durationWeeks: Number(durationWeeks),
        numExercises: Number(numExercises),
        difficulty,
        visibility,
      } as const;
      const data = await generateRoutineFromAIClient(payload);
      const normalized = normalizeForSave(data, visibility);
      await createGeneratedPlan(auth.currentUser, normalized);
      const res = await listUserGeneratedPlans(auth.currentUser.uid);
      setPlans(res);
      setShowAIForm(false);
      Alert.alert('Created', 'Your AI plan has been generated.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Generation failed', e?.message ?? 'Please try again later.');
    } finally {
      setBusy(false);
    }
  }

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
        {/* Create Custom Plan (toggle inline AI prompt) */}
        <TouchableOpacity
          style={[styles.outlineBtn, { marginTop: 12 }]}
          accessibilityRole="button"
          onPress={() => setShowAIForm((s) => !s)}
        >
          <Ionicons name="create-outline" size={18} color="#22c55e" style={{ marginRight: 8 }} />
          <Text style={styles.outlineBtnText}>Create Custom Plan</Text>
        </TouchableOpacity>

        {showAIForm && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={[styles.cardTitleDark, { marginBottom: 6 }]}>Describe Your Recovery Plan</Text>
            <Text style={styles.label}>Injury or focus area</Text>
            <TextInput style={styles.input} value={injuryType} onChangeText={setInjuryType} placeholder="e.g., Shoulder" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Goals</Text>
            <TextInput style={styles.input} value={goals} onChangeText={setGoals} placeholder="e.g., Mobility and strength" placeholderTextColor="#9CA3AF" />
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.label}>Duration (weeks)</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={durationWeeks} onChangeText={setDurationWeeks} />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.label}># Exercises</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={numExercises} onChangeText={setNumExercises} />
              </View>
            </View>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.segment}>
              {(['easy', 'moderate', 'hard'] as const).map((d) => (
                <TouchableOpacity key={d} style={[styles.segmentBtn, difficulty === d && styles.segmentBtnActive]} onPress={() => setDifficulty(d)}>
                  <Text style={[styles.segmentText, difficulty === d && styles.segmentTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.segment}>
              {(['Public', 'Private'] as const).map((v) => (
                <TouchableOpacity key={v} style={[styles.segmentBtn, visibility === v && styles.segmentBtnActive]} onPress={() => setVisibility(v)}>
                  <Text style={[styles.segmentText, visibility === v && styles.segmentTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.solidBtn, { opacity: canGenerate && !busy ? 1 : 0.6 }]} disabled={!canGenerate || busy} onPress={onGenerateAndSave}>
              <Text style={styles.solidBtnText}>{busy ? 'Generating…' : 'Generate & Save'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Plans */}
        <Text style={styles.sectionTitle}> Plans</Text>
        {plans?.length ? (
          <View>
            {plans.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.cardTitleDark}>{p.name}</Text>
                    {p.description ? <Text style={styles.cardSubDark}>{p.description}</Text> : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#E5E7EB' }]}>
                    <Text style={[styles.badgeText, { color: '#111827' }]}>{p.visibility}</Text>
                  </View>
                </View>
                {p.duration ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                      <Text style={styles.metaText}>{p.duration}</Text>
                    </View>
                    {p.summary?.totalExercises != null && (
                      <View style={styles.metaRow}>
                        <Ionicons name="fitness-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                        <Text style={styles.metaText}>{p.summary.totalExercises} exercises</Text>
                      </View>
                    )}
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', marginTop: 14 }}>
                  <TouchableOpacity style={[styles.solidBtn, { flex: 1, marginRight: 6 }]} onPress={() => router.push(selectPlanRoute)}>
                    <Text style={styles.solidBtnText}>Use This Plan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { flex: 1, marginLeft: 6 }]}
                    onPress={() => {
                      const draft = JSON.stringify(p);
                      if (accountType === 'patient') {
                        router.push({ pathname: '/patient/manual-builder', params: { draft } });
                      } else {
                        router.push({ pathname: '/doctor/create', params: { draft } });
                      }
                    }}
                  >
                    <Text style={styles.outlineBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.metaText, { color: '#9CA3AF', marginBottom: 8 }]}>No saved AI plans yet.</Text>
        )}

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

        {/* bottom spacer so content doesn't hide behind tab bar */}
        <View style={{ height: 72 }} />
      </ScrollView>
    </View>
  );
}

function normalizeForSave(data: any, fallbackVisibility: 'Private' | 'Public') {
  const name = (data?.name as string) || 'AI Generated Routine';
  const description = (data?.description as string) || '';
  const duration = (data?.duration as string) || '';
  const visibility = (data?.visibility as 'Private' | 'Public') || fallbackVisibility;
  const exercises = Array.isArray(data?.exercises) ? data.exercises : [];
  const withIds = exercises.map((e: any, i: number) => ({ ...e, id: e.id || String(Date.now() + i), rest: e.rest || '30s' }));
  const totalVolume = withIds.reduce((sum: number, e: any) => sum + ((e.sets || 0) * (e.reps || 0)), 0);
  return {
    name,
    description,
    duration,
    visibility,
    exercises: withIds,
    summary: { totalExercises: withIds.length, totalVolume },
  };
}

// Local client-only OpenAI call for testing.
// IMPORTANT: Do not ship real secrets in client apps. Prefer a server function.
async function generateRoutineFromAIClient(params: {
  injuryType: string;
  goals: string;
  durationWeeks: number;
  numExercises: number;
  difficulty?: 'easy' | 'moderate' | 'hard';
  visibility?: 'Private' | 'Public';
}) {
  const apiKey = (process.env as any)?.EXPO_PUBLIC_OPENAI_API_KEY
    || (Constants?.expoConfig as any)?.extra?.OPENAI_API_KEY
    || (Constants as any)?.manifest?.extra?.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY or extra.OPENAI_API_KEY.');
  }

  const system = 'You are a physical therapy planning assistant. Output STRICT JSON only, no prose.';
  const prompt = `Create a personalized recovery routine:\nInjury: ${params.injuryType}\nGoals: ${params.goals}\nDuration: ${params.durationWeeks} weeks (format duration as e.g. "${params.durationWeeks} weeks")\nNumber of exercises: ${params.numExercises}\nDifficulty: ${params.difficulty ?? 'moderate'}\nReturn JSON with fields: name, description, duration, visibility, exercises[], summary{totalExercises,totalVolume}.\nEnsure each exercise has name, sets, reps, rest (default 30s), and optional category/bodyPart.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(params) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${text}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
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

  label: { color: '#111827', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderColor: '#E5E7EB', borderWidth: 1 },
  segment: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4, marginTop: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#E5E7EB' },
  segmentText: { color: '#6b7280', fontWeight: '600' },
  segmentTextActive: { color: '#111827' },
});
