import { Tabs, Redirect } from 'expo-router';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {
  const { isAuthenticated, isEmployer } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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