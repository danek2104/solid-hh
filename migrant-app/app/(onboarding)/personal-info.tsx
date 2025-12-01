import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ProgressBar, Checkbox, SegmentedButtons, Portal, Modal, List, HelperText, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, LanguageSkill } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

const AVAILABLE_LANGUAGES = ['russian', 'uzbek', 'tajik'];

const LANG_FLAGS: Record<string, string> = {
  russian: '🇷🇺',
  uzbek: '🇺🇿',
  tajik: '🇹🇯',
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUserStore(); // Use user object
  const { t } = useTranslation();

  const CITIZENSHIP_OPTIONS = [
    { label: t('lang_uzbek'), value: 'Узбекистан', flag: '🇺🇿' },
    { label: t('lang_tajik'), value: 'Таджикистан', flag: '🇹🇯' },
    { label: t('lang_russian'), value: 'Россия', flag: '🇷🇺' },
  ];
  
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    patronymic: user?.patronymic || '',
    passportSeries: user?.passportSeries || '',
    passportNumber: user?.passportNumber || '',
    citizenship: user?.citizenship || '',
  });

  // Initial load of languages
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageSkill[]>(user?.languages || []);
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const cameraRef = React.useRef<CameraView>(null);
  
  const [citizenModalVisible, setCitizenModalVisible] = useState(false);

  const handleLanguageToggle = (langKey: string) => {
    const exists = selectedLanguages.find(l => l.name === langKey);
    if (exists) {
      setSelectedLanguages(selectedLanguages.filter(l => l.name !== langKey));
    } else {
      setSelectedLanguages([...selectedLanguages, { name: langKey, level: 'intermediate' }]);
    }
  };

  const handleLevelChange = (langKey: string, level: string) => {
    setSelectedLanguages(selectedLanguages.map(l => 
      l.name === langKey ? { ...l, level: level as any } : l
    ));
  };

  const handleScan = async () => {
      if (!permission) return;
      if (!permission.granted) await requestPermission();
      setTempImage(null);
      setIsCameraVisible(true);
  };

  const takePicture = async () => {
      if (cameraRef.current) {
          const photo = await cameraRef.current.takePictureAsync();
          if (photo) setTempImage(photo.uri);
      }
  };

  const confirmImage = () => {
      if (tempImage) {
        setPassportImage(tempImage);
        setIsCameraVisible(false);
        setForm({
            ...form,
            firstName: 'Иван',
            lastName: 'Иванов',
            passportNumber: '123456',
            passportSeries: '1234',
            citizenship: 'Узбекистан'
        });
      }
  };

  const validate = () => {
    let newErrors: Record<string, string> = {};
    if (!form.lastName.trim()) newErrors.lastName = t('requiredField');
    if (!form.firstName.trim()) newErrors.firstName = t('requiredField');
    if (!form.patronymic.trim()) newErrors.patronymic = t('requiredField');
    if (!form.citizenship) newErrors.citizenship = t('citizenship');
    if (!form.passportSeries.trim()) newErrors.passportSeries = t('requiredField');
    if (!form.passportNumber.trim()) newErrors.passportNumber = t('requiredField');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validate()) {
        setSaving(true);
        try {
            // 1. Sync with Backend (if user has ID)
            if (user?.id) {
                await api.put(`/users/${user.id}`, {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    patronymic: form.patronymic,
                    citizenship: form.citizenship,
                    passport_series: form.passportSeries,
                    passport_number: form.passportNumber,
                    languages: selectedLanguages
                });
            }
            
            // 2. Update local store (after success)
            const profileData = {
                ...form,
                languages: selectedLanguages,
            };
            updateProfile(profileData);

            router.push('/(onboarding)/skills');
        } catch (error) {
            console.error("Failed to save profile", error);
            alert("Error saving profile. Please try again.");
        } finally {
            setSaving(false);
        }
    }
  };

  // Helper to get flag for selected citizenship
  const getCitizenshipFlag = () => {
      const found = CITIZENSHIP_OPTIONS.find(c => c.value === form.citizenship);
      return found ? found.flag : '🌍';
  };

  const getCitizenshipLabel = () => {
      const found = CITIZENSHIP_OPTIONS.find(c => c.value === form.citizenship);
      return found ? found.label : form.citizenship;
  }

  if (isCameraVisible) {
      // ... (Camera UI code remains same, simplified for brevity in this replace block)
       if (tempImage) {
        return (
            <View style={styles.cameraContainer}>
                <Image source={{ uri: tempImage }} style={[styles.camera, StyleSheet.absoluteFill]} />
                <View style={styles.previewHeader}><Text style={styles.overlayText}>{t('cameraCheck')}</Text></View>
                <View style={styles.previewBottomControls}>
                      <Button mode="contained" onPress={() => setTempImage(null)} style={styles.previewButton} buttonColor="#666">{t('cameraRetake')}</Button>
                      <Button mode="contained" onPress={confirmImage} style={styles.previewButton} buttonColor="#0066CC">{t('cameraUse')}</Button>
                </View>
            </View>
        );
      }
      return (
          <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} ref={cameraRef} facing="back">
                  <View style={styles.overlay}>
                      <View style={styles.overlayHeader}>
                          <TouchableOpacity onPress={() => setIsCameraVisible(false)} style={styles.closeButton}>
                              <MaterialCommunityIcons name="close" size={30} color="white" />
                          </TouchableOpacity>
                          <Text style={styles.overlayText}>{t('cameraInstruction')}</Text>
                      </View>
                      <View style={styles.frameContainer}>
                          <View style={styles.passportFrame}>
                              <View style={styles.divider} />
                              <View style={styles.photoPlaceholder} />
                          </View>
                      </View>
                      <View style={styles.controlsContainer}>
                          <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                              <View style={styles.captureInner} />
                          </TouchableOpacity>
                      </View>
                  </View>
              </CameraView>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={0.2} color="#0066CC" style={styles.progress} />
      
      <Portal>
        <Modal visible={citizenModalVisible} onDismiss={() => setCitizenModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="titleMedium" style={styles.modalTitle}>{t('citizenship')}</Text>
          {CITIZENSHIP_OPTIONS.map((c) => (
            <List.Item
              key={c.value}
              title={`${c.flag}  ${c.label}`}
              onPress={() => {
                setForm({ ...form, citizenship: c.value });
                setCitizenModalVisible(false);
              }}
              style={styles.modalItem}
              right={props => form.citizenship === c.value ? <List.Icon {...props} icon="check" color="#0066CC"/> : null}
            />
          ))}
        </Modal>
      </Portal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineSmall" style={styles.header}>{t('personalInfo')}</Text>
          <Text variant="bodyMedium" style={styles.subHeader}>{t('fillData')}</Text>

          {!passportImage ? (
              <TouchableOpacity style={styles.scanCard} onPress={handleScan}>
                  <MaterialCommunityIcons name="camera-outline" size={32} color="#0066CC" />
                  <View style={styles.scanCardTextContainer}>
                      <Text style={styles.scanCardTitle}>{t('scanPassport')}</Text>
                      <Text variant="bodySmall" style={styles.scanCardSubtitle}>{t('autoFill')}</Text>
                  </View>
              </TouchableOpacity>
          ) : (
              <View style={styles.miniPreviewContainer}>
                  <Image source={{uri: passportImage}} style={styles.miniPreview} />
                  <View style={{marginLeft: 12, justifyContent: 'center'}}>
                        <Text style={{fontWeight: 'bold', color: '#2E7D32'}}>{t('passportLoaded')}</Text>
                        <TouchableOpacity onPress={handleScan}><Text style={{color: '#0066CC'}}>{t('cameraRetake')}</Text></TouchableOpacity>
                  </View>
              </View>
          )}
          
          {/* Citizenship Selector */}
          <Text variant="bodySmall" style={{color: errors.citizenship ? '#B00020' : '#666', marginBottom: 4, marginLeft: 4}}>{t('citizenship')}</Text>
          <TouchableOpacity 
              style={[styles.citizenshipSelector, errors.citizenship ? { borderColor: '#B00020', borderWidth: 2 } : {}]} 
              onPress={() => setCitizenModalVisible(true)}
          >
              <Text style={{fontSize: 16, color: form.citizenship ? 'black' : '#666'}}>
                  {form.citizenship ? `${getCitizenshipFlag()}  ${getCitizenshipLabel()}` : t('selectCountry')}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
          {errors.citizenship && <HelperText type="error" visible={true}>{errors.citizenship}</HelperText>}

          <TextInput label={t('lastName')} mode="outlined" style={styles.input} value={form.lastName} onChangeText={(text) => setForm({...form, lastName: text})} error={!!errors.lastName} />
          {errors.lastName && <HelperText type="error" style={{marginTop: -12}} visible={true}>{errors.lastName}</HelperText>}

          <TextInput label={t('firstName')} mode="outlined" style={styles.input} value={form.firstName} onChangeText={(text) => setForm({...form, firstName: text})} error={!!errors.firstName} />
          {errors.firstName && <HelperText type="error" style={{marginTop: -12}} visible={true}>{errors.firstName}</HelperText>}

          <TextInput label={t('patronymic')} mode="outlined" style={styles.input} value={form.patronymic} onChangeText={(text) => setForm({...form, patronymic: text})} error={!!errors.patronymic} />
          {errors.patronymic && <HelperText type="error" style={{marginTop: -12}} visible={true}>{errors.patronymic}</HelperText>}
          
          <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                  <TextInput label={t('passportSeries')} mode="outlined" style={styles.inputNoMargin} value={form.passportSeries} onChangeText={(text) => setForm({...form, passportSeries: text})} keyboardType={form.citizenship === 'Россия' ? "number-pad" : "default"} error={!!errors.passportSeries} maxLength={form.citizenship === 'Россия' ? 4 : 2} />
                  {errors.passportSeries && <HelperText type="error" visible={true}>{errors.passportSeries}</HelperText>}
              </View>

              <View style={styles.halfInputContainer}>
                  <TextInput label={t('passportNumber')} mode="outlined" style={styles.inputNoMargin} value={form.passportNumber} onChangeText={(text) => setForm({...form, passportNumber: text})} keyboardType="number-pad" error={!!errors.passportNumber} maxLength={form.citizenship === 'Россия' ? 6 : 7} />
                  {errors.passportNumber && <HelperText type="error" visible={true}>{errors.passportNumber}</HelperText>}
              </View>
          </View>

          <Text variant="titleMedium" style={{marginTop: 16, marginBottom: 8}}>{t('selectLanguage')}</Text>
          {AVAILABLE_LANGUAGES.map(langKey => {
              const isSelected = selectedLanguages.some(l => l.name === langKey);
              const currentLevel = selectedLanguages.find(l => l.name === langKey)?.level || 'intermediate';
              return (
                  <View key={langKey} style={styles.langRow}>
                      <View style={styles.langCheck}>
                          <Checkbox status={isSelected ? 'checked' : 'unchecked'} onPress={() => handleLanguageToggle(langKey)} color="#0066CC" />
                          <Text style={{fontSize: 20, marginRight: 8}}>{LANG_FLAGS[langKey]}</Text>
                          <Text style={{fontSize: 16}}>{t(`lang_${langKey}`)}</Text>
                      </View>
                      {isSelected && (
                          <SegmentedButtons value={currentLevel} onValueChange={(val) => handleLevelChange(langKey, val)} buttons={[{ value: 'beginner', label: t('proficiency_beginner'), icon: 'signal-cellular-1' }, { value: 'intermediate', label: t('proficiency_intermediate'), icon: 'signal-cellular-2' }, { value: 'fluent', label: t('proficiency_fluent'), icon: 'signal-cellular-3' }]} style={styles.levelSelector} density="small" />
                      )}
                  </View>
              );
          })}

          <Button mode="contained" onPress={handleNext} style={styles.button} contentStyle={styles.buttonContent} loading={saving} disabled={saving}>
              {t('next')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progress: { height: 6 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  modalItem: { paddingVertical: 0 },
  cameraContainer: { flex: 1, backgroundColor: 'black', position: 'relative' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  overlayHeader: { paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  overlayText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  frameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  passportFrame: { width: '85%', height: '65%', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 15, position: 'relative' },
  divider: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.5)', width: '100%' },
  photoPlaceholder: { position: 'absolute', bottom: 25, left: 25, width: 80, height: 100, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  controlsContainer: { paddingBottom: 50, alignItems: 'center' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  previewHeader: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  previewBottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 40, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 20 },
  previewButton: { width: '45%' },
  scanCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F0F7FF', borderRadius: 12, borderWidth: 1, borderColor: '#0066CC', borderStyle: 'dashed', marginBottom: 24 },
  scanCardTextContainer: { marginLeft: 16 },
  scanCardTitle: { color: '#0066CC', fontWeight: '600', fontSize: 16 },
  scanCardSubtitle: { color: '#0066CC', opacity: 0.8 },
  content: { padding: 24 },
  header: { fontWeight: 'bold', marginBottom: 8 },
  subHeader: { color: '#666', marginBottom: 24 },
  miniPreviewContainer: { flexDirection: 'row', backgroundColor: '#F1F8E9', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#C5E1A5' },
  miniPreview: { width: 60, height: 60, borderRadius: 4, backgroundColor: '#ddd' },
  citizenshipSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#79747E', borderRadius: 4, paddingHorizontal: 16, height: 50, marginBottom: 16, backgroundColor: '#fff' },
  input: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  halfInputContainer: { width: '48%' },
  inputNoMargin: { marginBottom: 0 },
  langRow: { marginBottom: 16 },
  langCheck: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  levelSelector: { marginLeft: 8 },
  button: { marginTop: 24, marginBottom: 48 },
  buttonContent: { paddingVertical: 8 }
});
