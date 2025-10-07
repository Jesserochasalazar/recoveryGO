// app/doctor/create.tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest: number; // seconds
  instructions?: string;
  isEditing?: boolean;
};

const DURATION_OPTIONS = ['2 weeks', '4 weeks', '6 weeks', '8 weeks'] as const;
type DurationOpt = typeof DURATION_OPTIONS[number];
type VisibilityOpt = 'Private' | 'Public';

export default function DoctorRoutineBuilder() {
  const router = useRouter();

  const [routineName, setRoutineName] = useState('Shoulder Rehabilitation');
  const [description, setDescription] = useState('Progressive shoulder mobility and strength exercises');
  const [duration, setDuration] = useState<DurationOpt>('4 weeks');
  const [visibility, setVisibility] = useState<VisibilityOpt>('Private');

  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: 'Arm Circles', sets: 3, reps: 15, rest: 30 },
    { id: '2', name: 'Wall Push-ups', sets: 2, reps: 8, rest: 60 },
  ]);

  // Add-exercise inline form
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '10', rest: '30' });

  const totalVolume = useMemo(
    () => exercises.reduce((sum, e) => sum + (e.sets * (e.reps || 0)), 0),
    [exercises]
  );

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
    const rest = Number.parseInt(newEx.rest || '0', 10) || 0;

    const ex: Exercise = { id: Date.now().toString(), name, sets, reps, rest };
    setExercises((prev) => [...prev, ex]);
    setNewEx({ name: '', sets: '3', reps: '10', rest: '30' });
    setShowAddExercise(false);
  };

  const handleSaveRoutine = () => {
    const payload = {
      name: routineName.trim() || 'Untitled Routine',
      description: description.trim(),
      duration,
      visibility,
      exercises,
      summary: { totalExercises: exercises.length, totalVolume },
    };
    // TODO: Replace with Firestore/Backend save
    console.log('Saving routine:', payload);
    Alert.alert('Saved', `Routine “${payload.name}” saved.`);
    router.back(); // or router.replace('/doctor/patients')
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

        <Text style={styles.headerTitle}>Create Routine</Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleSaveRoutine}
          style={[styles.headerBtn, { backgroundColor: '#16a34a' }]}
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
              {(['Private', 'Public'] as VisibilityOpt[]).map((opt) => {
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
                onPress={() => Alert.alert('Coming soon', 'Exercise Library coming soon.')}
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
                        defaultValue={String(ex.sets)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { sets: parseInt(t || '0', 10) || 0 })}
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Reps</Text>
                      <TextInput
                        defaultValue={String(ex.reps)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { reps: parseInt(t || '0', 10) || 0 })}
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Rest (s)</Text>
                      <TextInput
                        defaultValue={String(ex.rest)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        onChangeText={(t) => handleExerciseUpdate(ex.id, { rest: parseInt(t || '0', 10) || 0 })}
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleEditToggle(ex.id)}
                      style={[styles.primaryBtn, { marginRight: 8 }]}
                    >
                      <Text style={styles.primaryBtnText}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditToggle(ex.id)}
                      style={styles.outlineBtn}
                    >
                      <Text style={styles.outlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.grid3, { marginTop: 8 }]}>
                  <View style={styles.metaRow}>
                    <Ionicons name="repeat-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{ex.sets} sets</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="barbell-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{ex.reps} reps</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{ex.rest}s rest</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Add Exercise Form */}
          {showAddExercise && (
            <View style={[styles.card, { borderColor: '#22c55e', borderWidth: 2 }]}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Add Exercise</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowAddExercise(false)}
                  style={styles.iconBtnGhost}
                >
                  <Ionicons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <TextInput
                value={newEx.name}
                onChangeText={(t) => setNewEx((p) => ({ ...p, name: t }))}
                placeholder="Exercise name"
                placeholderTextColor="#9ca3af"
                style={[styles.input, { marginTop: 10 }]}
              />

              <View style={[styles.grid3, { marginTop: 8 }]}>
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
                  <Text style={styles.label}>Rest (s)</Text>
                  <TextInput
                    value={newEx.rest}
                    onChangeText={(t) => setNewEx((p) => ({ ...p, rest: t }))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleAddExercise} style={[styles.primaryBtn, { marginTop: 10 }]}>
                <Text style={styles.primaryBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Summary */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={styles.cardTitleDark}>Summary</Text>
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillText}>{exercises.length} exercises</Text>
              </View>
              <View style={[styles.summaryPill, { marginLeft: 8 }]}>
                <Text style={styles.summaryPillText}>{totalVolume} total reps (sets × reps)</Text>
              </View>
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
    paddingTop: 22,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#25292e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderColor: '#ffffff',
    borderWidth: 1,
  },

  labelStrong: { color: '#111827', fontWeight: '600', marginBottom: 6 },
  label: { color: '#374151', fontWeight: '500', marginBottom: 4, fontSize: 13 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: '#DCFCE7' },
  chipText: { color: '#111827', fontWeight: '600', fontSize: 12 },
  chipTextSelected: { color: '#166534' },

  chipPrivate: { backgroundColor: '#E0F2FE' },
  chipPublic: { backgroundColor: '#EDE9FE' },
  chipTextPrivate: { color: '#075985' },
  chipTextPublic: { color: '#6D28D9' },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 6 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },

  cardTitle: { color: '#111827', fontWeight: '700', fontSize: 16 },
  cardTitleDark: { color: '#111827', fontWeight: '600' },

  iconBtnGhost: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  grid3: { flexDirection: 'row', columnGap: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#6b7280', fontSize: 13 },

  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  outlineBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineBtnText: { color: '#111827', fontWeight: '700' },

  summaryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  summaryPillText: { color: '#111827', fontWeight: '600', fontSize: 12 },
});
