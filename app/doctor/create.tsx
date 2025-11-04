// app/doctor/create.tsx
import { useLocalSearchParams } from 'expo-router';
import RoutineBuilder from '../components/routineBuilder';
import type { Exercise } from '../../src/exercise';

export default function DoctorRoutineBuilder() {
  const params = useLocalSearchParams<{ id?: string; draft?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : null;

  let seedExercises: Exercise[] | undefined;
  let defaultVisibility: 'Private' | 'Public' | undefined;
  try {
    if (typeof params.draft === 'string') {
      const draft = JSON.parse(params.draft);
      if (Array.isArray(draft?.exercises)) seedExercises = draft.exercises as Exercise[];
      if (draft?.visibility === 'Private' || draft?.visibility === 'Public') defaultVisibility = draft.visibility;
    }
  } catch {}

  return (
    <RoutineBuilder
      headerTitle="Create Routine"
      routineId={routineId}
      defaultVisibility={defaultVisibility}
      seedExercises={seedExercises}
    />
  );
}
