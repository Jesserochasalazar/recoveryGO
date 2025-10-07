import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';


export default function PatientLayout() {
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
       <Tabs.Screen name="dashboard" options={{ title: 'Dashboard',headerShown: false, tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline' } color={color} size={24}/> ),}}
        />
        <Tabs.Screen name="progress" options={{ title: 'Progress',headerShown: false, tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} color={color} size={24}/>
        ),}}/>
        <Tabs.Screen name="plans" options={{ title: 'Plans',headerShown: false, tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={24}/>
        ),}}/>
        <Tabs.Screen name="manual-builder" options={{ title: 'Manual Builder',headerShown: false, tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'build-sharp' : 'build-outline'} color={color} size={24}/>
        ),}}/>
        <Tabs.Screen name="settings" options={{ title: 'Settings',headerShown: false, tabBarIcon: ({ color, focused }) =>  
        (<Ionicons name={focused ? 'settings-sharp' : 'settings-outline'} color={color} size={24}/>
        ),}}/>


    </Tabs>
    
  );
}


//      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />