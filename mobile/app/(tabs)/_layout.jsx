import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../src/theme'

function TabIcon({ name, focused, size = 22 }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={focused ? theme.primary : theme.textMuted} />
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: theme.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ focused }) => <TabIcon name="home"     focused={focused} /> }} />
      <Tabs.Screen name="tasks"   options={{ title: 'Tasks',   tabBarIcon: ({ focused }) => <TabIcon name="checkbox" focused={focused} /> }} />
      <Tabs.Screen name="voters"  options={{ title: 'Voters',  tabBarIcon: ({ focused }) => <TabIcon name="people"   focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person"   focused={focused} /> }} />
    </Tabs>
  )
}
