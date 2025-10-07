// app/patient/manual-builder.tsx
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
  sets?: number;
  reps?: number;
  duration?: string; 
  rest: string;     
  isEditing?: boolean;
  category?: string; 
  bodyPart?: string; 
};

export default function ManualBuilderScreen() {
  const router = useRouter();

  // Seed with a couple examples
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: 'Leg Raises', sets: 3, reps: 10, rest: '30s', category: 'Strength', bodyPart: 'Legs' },
    { id: '2', name: 'Wall Sits', duration: '30s', sets: 3, rest: '60s', category: 'Strength', bodyPart: 'Legs' },
  ]);

  const [planName, setPlanName] = useState('My Custom Routine');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', sets: '1', reps: '1', rest: '30s' });

  const categories = useMemo(
    () => Array.from(new Set(exercises.map((ex) => ex.category).filter(Boolean))) as string[],
    [exercises]
  );

  const handleEditExercise = (id: string) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, isEditing: true } : ex)));
  };

  const handleSaveExercise = (id: string, updated: Partial<Exercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updated, isEditing: false } : ex))
    );
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleAddExercise = () => {
    const name = newExercise.name.trim();
    if (!name) {
      Alert.alert('Missing name', 'Please enter an exercise name.');
      return;
    }
    const setsNum = Number.parseInt(newExercise.sets || '1', 10) || 1;
    const repsNum = Number.parseInt(newExercise.reps || '1', 10) || 1;

    const ex: Exercise = {
      id: Date.now().toString(),
      name,
      sets: setsNum,
      reps: repsNum,
      rest: newExercise.rest || '30s',
    };
    setExercises((prev) => [...prev, ex]);
    setNewExercise({ name: '', sets: '1', reps: '1', rest: '30s' });
    setShowAddExercise(false);
  };

  const handleSavePlan = () => {
    const plan = {
      name: planName.trim() || 'Untitled Routine',
      exercises,
      type: categories.length ? categories : ['Custom'],
    };

    // Stub: replace with your persistence (e.g., AsyncStorage/Firestore)
    console.log('Saving plan:', plan);
    Alert.alert('Saved', `Saved "${plan.name}" with ${exercises.length} exercise(s).`);
    router.back(); // or router.replace('/patient/dashboard')
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Build Routine</Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleSavePlan}
          style={[styles.iconBtn, { backgroundColor: '#16a34a' }]}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Routine Info */}
          <View style={styles.card}>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="Routine name"
              placeholderTextColor="#9ca3af"
              style={styles.planNameInput}
            />
            <Text style={styles.metaLight}>Created today • {exercises.length} exercises</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <View key={c} style={styles.chip}>
                    <Text style={styles.chipText}>{c}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Custom</Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions row */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <View style={{ flexDirection: 'row' }}>
              {/* Library – placeholder only */}
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
                <Text style={styles.primaryBtnText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Existing exercise list */}
          {exercises.map((ex) => (
            <View key={ex.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  {ex.bodyPart ? (
                    <View style={[styles.chip, { marginLeft: 8 }]}>
                      <Text style={styles.chipText}>{ex.bodyPart}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleEditExercise(ex.id)}
                    style={styles.iconBtnGhost}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleDeleteExercise(ex.id)}
                    style={styles.iconBtnGhost}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              {ex.isEditing ? (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.grid3}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Sets</Text>
                      <TextInput
                        defaultValue={String(ex.sets ?? 1)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        onChangeText={(txt) => (ex.sets = Number.parseInt(txt || '0', 10) || 0)}
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>{ex.duration ? 'Duration' : 'Reps'}</Text>
                      {ex.duration ? (
                        <TextInput
                          defaultValue={ex.duration}
                          onChangeText={(txt) => (ex.duration = txt)}
                          style={styles.input}
                          placeholder="30s"
                          placeholderTextColor="#9ca3af"
                        />
                      ) : (
                        <TextInput
                          defaultValue={String(ex.reps ?? 1)}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          onChangeText={(txt) => (ex.reps = Number.parseInt(txt || '0', 10) || 0)}
                          style={styles.input}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Rest</Text>
                      <TextInput
                        defaultValue={ex.rest}
                        onChangeText={(txt) => (ex.rest = txt)}
                        style={styles.input}
                        placeholder="30s"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => handleSaveExercise(ex.id, ex)}
                      style={[styles.primaryBtn, { marginRight: 8 }]}
                    >
                      <Text style={styles.primaryBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() =>
                        setExercises((prev) =>
                          prev.map((e) => (e.id === ex.id ? { ...e, isEditing: false } : e))
                        )
                      }
                      style={styles.outlineBtn}
                    >
                      <Text style={styles.outlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.grid3, { marginTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLight}>Sets</Text>
                    <Text style={styles.cardStrong}>{ex.sets ?? '-'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLight}>{ex.duration ? 'Duration' : 'Reps'}</Text>
                    <Text style={styles.cardStrong}>{ex.duration ?? ex.reps ?? '-'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLight}>Rest</Text>
                    <Text style={styles.cardStrong}>{ex.rest}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Add Exercise Form */}
          {showAddExercise && (
            <View style={[styles.card, { borderStyle: 'solid', borderWidth: 2, borderColor: '#22c55e' }]}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Add Custom Exercise</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowAddExercise(false)}
                  style={styles.iconBtnGhost}
                >
                  <Ionicons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10 }}>
                <TextInput
                  value={newExercise.name}
                  onChangeText={(txt) => setNewExercise((p) => ({ ...p, name: txt }))}
                  placeholder="Exercise name"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />

                <View style={[styles.grid3, { marginTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Sets</Text>
                    <TextInput
                      value={newExercise.sets}
                      onChangeText={(txt) => setNewExercise((p) => ({ ...p, sets: txt }))}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Reps</Text>
                    <TextInput
                      value={newExercise.reps}
                      onChangeText={(txt) => setNewExercise((p) => ({ ...p, reps: txt }))}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Rest</Text>
                    <TextInput
                      value={newExercise.rest}
                      onChangeText={(txt) => setNewExercise((p) => ({ ...p, rest: txt }))}
                      placeholder="30s"
                      placeholderTextColor="#9ca3af"
                      style={styles.input}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleAddExercise}
                  style={[styles.primaryBtn, { marginTop: 10 }]}
                >
                  <Text style={styles.primaryBtnText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Empty hint if no exercises and not adding */}
          {!showAddExercise && exercises.length === 0 && (
            <View style={[styles.card, { borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' }]}>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="add-circle-outline" size={40} color="#6b7280" />
                <Text style={[styles.metaLight, { marginTop: 8 }]}>
                  No exercises yet. Add from library or create your own.
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Coming soon', 'Exercise Library coming soon.')}
                    style={[styles.primaryBtn, { marginRight: 8 }]}
                  >
                    <Ionicons name="book-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Browse Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowAddExercise(true)} style={styles.outlineBtn}>
                    <Ionicons name="add" size={16} color="#111827" style={{ marginRight: 6 }} />
                    <Text style={styles.outlineBtnText}>Add Custom</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  iconBtn: {
    padding: 8,
    borderRadius: 9999,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 6 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderColor: '#ffffff',
    borderWidth: 1,
  },

  planNameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metaLight: { color: '#6b7280', fontSize: 12 },

  chip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    marginRight: 6,
    marginTop: 6,
  },
  chipText: { fontSize: 11, color: '#111827' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },

  cardTitle: { color: '#111827', fontWeight: '700', fontSize: 16 },
  cardStrong: { color: '#111827', fontWeight: '600', marginTop: 2 },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    color: '#111827',
    marginTop: 4,
  },
  label: { color: '#6b7280', fontSize: 12 },

  grid3: { flexDirection: 'row', columnGap: 8 },

  iconBtnGhost: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginLeft: 6,
  },

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
});
