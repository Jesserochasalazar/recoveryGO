import { useLocalSearchParams } from 'expo-router';
import RoutineBuilder from '../components/routineBuilder';

export default function EditRoutineScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : null;
  return <RoutineBuilder headerTitle={routineId ? 'Edit Routine' : 'Create Routine'} routineId={routineId} />;
}

