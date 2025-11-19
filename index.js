import { registerRootComponent } from 'expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';

import App from './App';

// Обертка приложения с QueryClientProvider
const AppWithProviders = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppWithProviders);
