// app/patient/manual-builder.tsx
import { useLocalSearchParams } from 'expo-router';
import RoutineBuilder from '../components/routineBuilder';

export default function ManualBuilderScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : null;
  return <RoutineBuilder headerTitle="Build Routine" routineId={routineId} />;
}
