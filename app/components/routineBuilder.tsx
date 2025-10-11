import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebase/firebaseConfig';
import type { Exercise } from '../../src/exercise';
import { createRoutine, getRoutine, upsertRoutine, type RoutineVisibility } from '../../src/utils/userRotuines';

const DURATION_OPTIONS = ['2 weeks', '4 weeks', '6 weeks', '8 weeks'] as const;

type Props = {
  headerTitle?: string;
  routineId?: string | null;
  defaultVisibility?: RoutineVisibility;
  seedExercises?: Exercise[];
  onSaved?: (id: string) => void;
};

export default function RoutineBuilder({
  headerTitle = 'Create Routine',
  routineId = null,
  defaultVisibility = 'Private',
  seedExercises,
  onSaved,
}: Props) {
  const router = useRouter();

  const [routineName, setRoutineName] = useState('Shoulder Rehabilitation');
  const [description, setDescription] = useState('Progressive shoulder mobility and strength exercises');
  const [duration, setDuration] = useState<(typeof DURATION_OPTIONS)[number]>('4 weeks');
  const [visibility, setVisibility] = useState<RoutineVisibility>(defaultVisibility);
  const [busy, setBusy] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>(
    seedExercises ?? [
      { id: '1', name: 'Arm Circles', sets: 3, reps: 15, rest: '30s' },
      { id: '2', name: 'Wall Push-ups', sets: 2, reps: 8, rest: '60s' },
    ]
  );

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '10', rest: '30s', category: '', bodyPart: '' });

  const totalVolume = useMemo(
    () => exercises.reduce((sum, e) => sum + ((e.sets || 0) * (e.reps || 0)), 0),
    [exercises]
  );

  useEffect(() => {
    let active = true;
    if (!routineId) return;
    (async () => {
      setBusy(true);
      try {
        const existing = await getRoutine(routineId);
        if (active && existing) {
          setRoutineName(existing.name || 'Untitled Routine');
          setDescription(existing.description || '');
          setVisibility(existing.visibility);
          if (existing.duration) setDuration(existing.duration as any);
          setExercises(existing.exercises || []);
        }
      } catch (e) {
        // ignore and keep defaults
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [routineId]);

  const handleEditToggle = (id: string) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, isEditing: !e.isEditing } : e)));
  };

  const handleExerciseUpdate = (id: string, patch: Partial<Exercise>) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddExercise = () => {
    const name = newEx.name.trim();
    if (!name) {
      Alert.alert('Missing name', 'Please enter an exercise name.');
      return;
    }
    const sets = Number.parseInt(newEx.sets || '0', 10) || 0;
    const reps = Number.parseInt(newEx.reps || '0', 10) || 0;
    const rest = newEx.rest || '30s';

    const ex: Exercise = { id: Date.now().toString(), name, sets, reps, rest, category: newEx.category || undefined, bodyPart: newEx.bodyPart || undefined };
    setExercises((prev) => [...prev, ex]);
    setNewEx({ name: '', sets: '3', reps: '10', rest: '30s', category: '', bodyPart: '' });
    setShowAddExercise(false);
  };

  const handleSaveRoutine = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to save routines.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: (routineName || '').trim() || 'Untitled Routine',
        description: (description || '').trim(),
        duration,
        visibility,
        exercises,
        summary: { totalExercises: exercises.length, totalVolume },
      };
      const id = await upsertRoutine(user, routineId ?? null, payload);
      Alert.alert('Saved', `Routine "${payload.name}" saved.`);
      if (onSaved) onSaved(id);
      else router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save routine');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{headerTitle}</Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleSaveRoutine}
          style={[styles.headerBtn, { backgroundColor: '#16a34a' }]}
          disabled={busy}
        >
          <Ionicons name="save-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Routine Details */}
          <View style={styles.card}>
            <Text style={styles.labelStrong}>Routine Name</Text>
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Enter routine name"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={[styles.labelStrong, { marginTop: 12 }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add description"
              placeholderTextColor="#9ca3af"
              multiline
              style={[styles.input, styles.inputMultiline]}
            />

            {/* Duration (chips) */}
            <Text style={[styles.labelStrong, { marginTop: 12 }]}>Duration</Text>
            <View style={styles.rowWrap}>
              {DURATION_OPTIONS.map((opt) => {
                const selected = opt === duration;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setDuration(opt)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Visibility (chips) */}
            <Text style={[styles.labelStrong, { marginTop: 12 }]}>Visibility</Text>
            <View style={styles.rowWrap}>
              {(['Private', 'Public'] as RoutineVisibility[]).map((opt) => {
                const selected = opt === visibility;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setVisibility(opt)}
                    style={[
                      styles.chip,
                      selected && (opt === 'Private' ? styles.chipPrivate : styles.chipPublic),
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && (opt === 'Private' ? styles.chipTextPrivate : styles.chipTextPublic),
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Exercises header + actions */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push('/routines/library')}
                style={[styles.outlineBtn, { marginRight: 8 }]}
              >
                <Ionicons name="book-outline" size={16} color="#111827" style={{ marginRight: 6 }} />
                <Text style={styles.outlineBtnText}>Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowAddExercise(true)}
                style={styles.primaryBtn}
              >
                <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Exercise list */}
          {exercises.map((ex) => (
            <View key={ex.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{ex.name}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => handleEditToggle(ex.id)}
                    style={styles.iconBtnGhost}
                    accessibilityRole="button"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(ex.id)}
                    style={styles.iconBtnGhost}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              {ex.isEditing ? (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.grid3}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Sets</Text>
                      <TextInput
                        defaultValue={String(ex.sets ?? 0)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { sets: parseInt(t || '0', 10) || 0 })}
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>{ex.duration ? 'Duration' : 'Reps'}</Text>
                      {ex.duration ? (
                        <TextInput
                          defaultValue={ex.duration}
                          onChangeText={(t) => handleExerciseUpdate(ex.id, { duration: t, reps: undefined })}
                          style={styles.input}
                          placeholder="30s"
                          placeholderTextColor="#9ca3af"
                        />
                      ) : (
                        <TextInput
                          defaultValue={String(ex.reps ?? 0)}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          onChangeText={(t) => handleExerciseUpdate(ex.id, { reps: parseInt(t || '0', 10) || 0, duration: undefined })}
                          style={styles.input}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Rest</Text>
                      <TextInput
                        defaultValue={ex.rest}
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { rest: t })}
                        style={styles.input}
                        placeholder="30s"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                  <View style={styles.grid3}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Category</Text>
                      <TextInput
                        defaultValue={ex.category || ''}
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { category: t || undefined })}
                        style={styles.input}
                        placeholder="Strength/Mobility"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Body Part</Text>
                      <TextInput
                        defaultValue={ex.bodyPart || ''}
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { bodyPart: t || undefined })}
                        style={styles.input}
                        placeholder="Legs/Back/Knee"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={{ flex: 1 }} />
                  </View>
                </View>
              ) : (
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {(ex.sets ?? 0) > 0 && (ex.reps ?? 0) > 0
                      ? `${ex.sets} sets · ${ex.reps} reps`
                      : ex.duration || 'Configure'}
                  </Text>
                  <Text style={[styles.metaText, { marginLeft: 8 }]}>{ex.rest} rest</Text>
                  {ex.category ? (
                    <View style={[styles.chip, { marginLeft: 8 }]}>
                      <Text style={styles.chipText}>{ex.category}</Text>
                    </View>
                  ) : null}
                  {ex.bodyPart ? (
                    <View style={[styles.chip, { marginLeft: 8 }]}>
                      <Text style={styles.chipText}>{ex.bodyPart}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ))}

          {/* Add exercise inline form */}
          {showAddExercise && (
            <View style={styles.card}>
              <Text style={styles.labelStrong}>Add Exercise</Text>
              <TextInput
                value={newEx.name}
                onChangeText={(t) => setNewEx((p) => ({ ...p, name: t }))}
                placeholder="Exercise name"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <View style={styles.grid3}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Sets</Text>
                  <TextInput
                    value={newEx.sets}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, sets: t }))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    value={newEx.reps}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, reps: t }))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Rest</Text>
                  <TextInput
                    value={newEx.rest}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, rest: t }))}
                    placeholder="30s"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.grid3}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    value={newEx.category}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, category: t }))}
                    placeholder="Strength/Mobility"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Body Part</Text>
                  <TextInput
                    value={newEx.bodyPart}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, bodyPart: t }))}
                    placeholder="Legs/Back/Knee"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }} />
              </View>

              <View style={[styles.rowBetween, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowAddExercise(false)}>
                  <Text style={styles.outlineBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddExercise}>
                  <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Summary */}
          <View style={[styles.card, { marginBottom: 24 }]}>
            <Text style={styles.labelStrong}>Summary</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Total Exercises</Text>
              <Text style={styles.labelStrong}>{exercises.length}</Text>
            </View>
            <View style={[styles.rowBetween, { marginTop: 6 }]}>
              <Text style={styles.label}>Total Volume</Text>
              <Text style={styles.labelStrong}>{totalVolume}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#25292e',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 18 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10,
  },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  labelStrong: { color: '#111827', fontWeight: '700', marginBottom: 6 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#111827',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  rowWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 16, marginRight: 8, marginTop: 8,
  },
  chipSelected: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextSelected: { color: '#065F46' },
  chipPrivate: { backgroundColor: '#E5E7EB', borderColor: '#6B7280' },
  chipPublic: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  chipTextPrivate: { color: '#111827' },
  chipTextPublic: { color: '#065F46' },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 16 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#22c55e', backgroundColor: '#ffffff',
    paddingVertical: 12, borderRadius: 12,
  },
  outlineBtnText: { color: '#22c55e', fontWeight: '700', fontSize: 16 },
  primaryBtn: { backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  iconBtnGhost: { padding: 8, borderRadius: 9999, backgroundColor: '#E5E7EB', marginLeft: 6 },
  cardTitle: { color: '#111827', fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaText: { color: '#6b7280', fontSize: 12 },
  grid3: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 10 },
});
