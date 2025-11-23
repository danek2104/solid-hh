import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Компонент для отображения ошибок пользователю
 */
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss,
  title,
  message,
  showIcon = true,
}) => {
  const displayMessage = message || (error?.message || 'Произошла ошибка');

  return (
    <View style={styles.container}>
      {showIcon && (
        <Ionicons 
          name="alert-circle" 
          size={48} 
          color="#C62828" 
          style={styles.icon}
        />
      )}
      
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      <Text style={styles.message}>{displayMessage}</Text>

      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={styles.button}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Попробовать снова</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Закрыть
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Компонент для отображения inline ошибок в формах
 */
export const InlineError = ({ error, style }) => {
  if (!error) return null;

  return (
    <View style={[styles.inlineContainer, style]}>
      <Ionicons name="alert-circle" size={16} color="#C62828" />
      <Text style={styles.inlineText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    marginVertical: 16,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C62828',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#C62828',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  inlineText: {
    fontSize: 12,
    color: '#C62828',
    flex: 1,
  },
});

