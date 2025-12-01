import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, TextInput, Button, HelperText, Portal, Modal, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯' },
];

const COUNTRY_CODES = [
  { code: '+7', flag: '🇷🇺', mask: '(999) 000-00-00', label: 'Russia' },
  { code: '+998', flag: '🇺🇿', mask: '(99) 000-00-00', label: 'Uzbekistan' },
  { code: '+992', flag: '🇹🇯', mask: '(99) 000-00-00', label: 'Tajikistan' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
  const [visibleModal, setVisibleModal] = useState(false);
  
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleSendCode = () => {
    if (phone.length < 7) return;
    const fullPhone = `${selectedCode.code}${phone}`;
    router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <Portal>
            <Modal visible={visibleModal} onDismiss={() => setVisibleModal(false)} contentContainerStyle={styles.modalContent}>
              <Text variant="titleMedium" style={styles.modalTitle}>Выберите код страны</Text>
              {COUNTRY_CODES.map((c) => (
                <List.Item
                  key={c.code}
                  title={`${c.flag}  ${c.code}`}
                  onPress={() => {
                    setSelectedCode(c);
                    setVisibleModal(false);
                  }}
                  style={styles.modalItem}
                  right={props => selectedCode.code === c.code ? <List.Icon {...props} icon="check" color="#0066CC"/> : null}
                />
              ))}
            </Modal>
          </Portal>

          <View style={styles.langContainer}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langButton, 
                  i18n.language === lang.code && styles.langButtonActive
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.langText,
                  i18n.language === lang.code && styles.langTextActive
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>{t('welcome')}</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {t('enterPhone')}
            </Text>

            <View style={styles.phoneRow}>
               <TouchableOpacity 
                  onPress={() => setVisibleModal(true)}
                  style={styles.codeSelector}
                >
                   <Text style={{fontSize: 18}}>{selectedCode.flag} {selectedCode.code}</Text>
                </TouchableOpacity>

                <TextInput
                  label={t('phoneLabel')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={styles.phoneInput}
                  placeholder={selectedCode.mask}
                />
            </View>
            
            <HelperText type="info" visible={true}>
              {t('sendCodeInfo')}
            </HelperText>

            <Button 
              mode="contained" 
              onPress={handleSendCode} 
              style={styles.button}
              contentStyle={styles.buttonContent}
              disabled={phone.length < 5}
            >
              {t('continue')}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 12,
  },
  langButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 80,
  },
  langButtonActive: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F7FF',
  },
  flag: {
    fontSize: 24,
    marginBottom: 4,
  },
  langText: {
    fontSize: 12,
    color: '#666',
  },
  langTextActive: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    marginTop: -50, // Offset for balance
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeSelector: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginTop: 6, // Align with TextInput visually
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalItem: {
    paddingVertical: 0,
  }
});
