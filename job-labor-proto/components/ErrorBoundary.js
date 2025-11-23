import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Error Boundary компонент для перехвата ошибок React
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Обновить состояние для отображения fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логировать ошибку для отладки
    console.error('ErrorBoundary поймал ошибку:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Здесь можно отправить ошибку в сервис мониторинга (Sentry, Bugsnag и т.д.)
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Вызвать callback для сброса состояния приложения, если передан
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Если передан кастомный fallback UI, использовать его
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Стандартный fallback UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color="#C62828" />
            </View>
            
            <Text style={styles.title}>Что-то пошло не так</Text>
            
            <Text style={styles.message}>
              Произошла непредвиденная ошибка. Приложение временно недоступно.
            </Text>

            {this.props.showDetails && this.state.error && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Детали ошибки:</Text>
                <Text style={styles.detailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.detailsStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Попробовать снова</Text>
            </TouchableOpacity>

            {this.props.onLogout && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={this.props.onLogout}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Выйти из аккаунта
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#7A7A7A',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  detailsStack: {
    fontSize: 10,
    color: '#BDBDBD',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C62828',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#C62828',
  },
});

export default ErrorBoundary;

