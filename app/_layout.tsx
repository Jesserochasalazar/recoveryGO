import { Stack, Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Tabs.Screen name="patient" options={{ headerShown: false }} />
      <Tabs.Screen name="dashboard" options={{ headerShown: false }} />

    </Stack>
    
  );
}
