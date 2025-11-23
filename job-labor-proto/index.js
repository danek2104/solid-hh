import { registerRootComponent } from 'expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './services/queryClient';
import ErrorBoundary from './components/ErrorBoundary';

import App from './App';

// Обертка приложения с QueryClientProvider и SafeAreaProvider
const AppWithProviders = () => {
  return (
    <ErrorBoundary showDetails={__DEV__}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppWithProviders);
