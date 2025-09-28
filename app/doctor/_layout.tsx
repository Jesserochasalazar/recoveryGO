import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function DoctorTabs() {
  return (
    <Tabs screenOptions={{
    tabBarActiveTintColor: '#ffd33d',
    headerStyle: {
      backgroundColor: '#25292e',
    },
    headerShadowVisible: false,
    headerTintColor: '#fff',
    tabBarStyle: {
      backgroundColor: '#25292e',
    },
  }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline' } color={color} size={24}/> ),}}
        />
      <Tabs.Screen name="patients" options={{ title:'Patients',
        tabBarIcon: ({color, focused}) => <Ionicons name={focused?'people':'people-outline'} size={24} color={color} />
      }}/>
      <Tabs.Screen name="create" options={{ title:'Create',
        tabBarIcon: ({color, focused}) => <Ionicons name={focused?'add-circle':'add-circle-outline'} size={24} color={color} />
      }}/>
      <Tabs.Screen name="settings" options={{ title:'Settings',
        tabBarIcon: ({color, focused}) => <Ionicons name={focused?'settings-sharp':'settings-outline'} size={24} color={color} />
      }}/>
    </Tabs>
  );
}
