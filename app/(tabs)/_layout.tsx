import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';


export default function TabLayout() {
  return (
   <Tabs
  screenOptions={{
    tabBarActiveTintColor: '#ffd33d',
    headerStyle: {
      backgroundColor: '#25292e',
    },
    headerShadowVisible: false,
    headerTintColor: '#fff',
    tabBarStyle: {
      backgroundColor: '#25292e',
    },
  }}
>
       <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline' } color={color} size={24}/> ),}}
        />
        <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} color={color} size={24}/>
        ),}}/>
        <Tabs.Screen name="plans" options={{ title: 'Plans', tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={24}/>
        ),}}/>
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'settings-sharp' : 'settings-outline'} color={color} size={24}/>
        ),}}/>


    </Tabs>
    
  );
}


//      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />