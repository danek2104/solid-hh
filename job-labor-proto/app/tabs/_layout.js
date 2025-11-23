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
        headerShown: false,
        tabBarActiveTintColor: '#C62828',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            case 'history':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'reviews':
              iconName = focused ? 'star' : 'star-outline';
              break;
            case 'jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'chats':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'workers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Профиль',
          tabBarButton: isEmployer ? () => null : undefined
        }} 
      />
      <Tabs.Screen name="history" options={{ title: 'Смены' }} />
      <Tabs.Screen name="reviews" options={{ title: 'Отзывы' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Вакансии' }} />
      <Tabs.Screen name="chats" options={{ title: 'Чаты' }} />
      <Tabs.Screen 
        name="workers" 
        options={{ 
          title: 'Работники',
          tabBarButton: !isEmployer ? () => null : undefined
        }} 
      />
    </Tabs>
  );
}