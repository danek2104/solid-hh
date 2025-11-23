import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isEmployer } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'history') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'reviews') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'chats') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'workers') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#C62828',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: ((isEmployer && route.name === 'profile') || (!isEmployer && route.name === 'workers')) ? { display: 'none' } : {},
      })}
    >
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
      <Tabs.Screen name="history" options={{ title: 'Смены' }} />
      <Tabs.Screen name="reviews" options={{ title: 'Отзывы' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Вакансии' }} />
      <Tabs.Screen name="chats" options={{ title: 'Чаты' }} />
      <Tabs.Screen name="settings" options={{ title: 'Настройки' }} />
      <Tabs.Screen name="workers" options={{ title: 'Работники' }} />
    </Tabs>
  );
}