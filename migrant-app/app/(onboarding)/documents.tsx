import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from 'react-i18next';

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useUserStore(); // Fixed: use 'user' instead of 'profile' (based on new store)
  const { t } = useTranslation();

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.header}>{t('docsTitle')}</Text>
        <Text variant="bodyMedium" style={styles.subHeader}>
          {t('docsSubtitle')}
        </Text>

        <View style={styles.docList}>
            <List.Item
                title={t('docPatent')}
                description={`${firstName} ${lastName}`}
                left={props => <List.Icon {...props} icon="file-document-outline" color="#0066CC" />}
                right={props => <List.Icon {...props} icon="check-circle" color="#2E7D32" />}
            />
            <Divider />
            <List.Item
                title={t('docContract')}
                description="С выбранными работодателями"
                left={props => <List.Icon {...props} icon="file-sign" color="#0066CC" />}
                right={props => <List.Icon {...props} icon="check-circle" color="#2E7D32" />}
            />
             <Divider />
            <List.Item
                title={t('docCard')}
                description="Для заполнения на границе"
                left={props => <List.Icon {...props} icon="card-account-details-outline" color="#0066CC" />}
                right={props => <List.Icon {...props} icon="check-circle" color="#2E7D32" />}
            />
        </View>

        {/* Placeholder for where the Camera would go */}
        {/* To fix the warning, we simply don't put children inside CameraView if we use it. */}
        {/* For now, let's just show a button to 'Scan' which is a mock action */}
        
        <View style={styles.scanPlaceholder}>
             <Button icon="camera" mode="outlined" onPress={() => alert('Scan feature coming soon')}>
                 Scan Documents
             </Button>
        </View>

        <Button 
          mode="contained" 
          onPress={() => router.push('/(onboarding)/calendar')} 
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('next')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    color: '#666',
    marginBottom: 32,
  },
  docList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#eee',
  },
  scanPlaceholder: {
      marginBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
      height: 100,
      borderWidth: 1,
      borderColor: '#ccc',
      borderStyle: 'dashed',
      borderRadius: 8,
  },
  button: {
  },
  buttonContent: {
    paddingVertical: 8,
  }
});