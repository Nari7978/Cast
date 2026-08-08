import { Stack } from 'expo-router'
import { theme } from '../../src/theme'

export default function SurveyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  )
}
