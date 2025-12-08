import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Text, Checkbox, SegmentedButtons, Portal, Modal, List, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, LanguageSkill } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useColorScheme } from '@/components/useColorScheme';

const AVAILABLE_LANGUAGES = ['russian', 'uzbek', 'tajik'];

const LANG_FLAGS: Record<string, string> = {
  russian: '🇷🇺',
  uzbek: '🇺🇿',
  tajik: '🇹🇯',
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateProfile, completeOnboarding } = useUserStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const isEmployer = user?.role === 'employer';

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
    companyName: user?.companyName || '',
  });

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
    
    if (isEmployer) {
         if (!form.companyName.trim()) newErrors.companyName = t('requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validate()) {
        setSaving(true);
        try {
            if (user?.id) {
                const updatePayload: any = {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    patronymic: form.patronymic,
                    citizenship: form.citizenship,
                    passport_series: form.passportSeries,
                    passport_number: form.passportNumber,
                    languages: selectedLanguages
                };

                if (isEmployer) {
                    updatePayload.company_name = form.companyName;
                }

                await api.put(`/users/${user.id}`, updatePayload);
            }
            
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

  const getCitizenshipFlag = () => {
      const found = CITIZENSHIP_OPTIONS.find(c => c.value === form.citizenship);
      return found ? found.flag : '🌍';
  };

  const getCitizenshipLabel = () => {
      const found = CITIZENSHIP_OPTIONS.find(c => c.value === form.citizenship);
      return found ? found.label : form.citizenship;
  }

  if (isCameraVisible) {
       if (tempImage) {
        return (
            <View style={styles.cameraContainer}>
                <Image source={{ uri: tempImage }} style={[styles.camera, StyleSheet.absoluteFill]} />
                <View style={styles.previewHeader}><Text style={styles.overlayText}>{t('cameraCheck')}</Text></View>
                <View style={styles.previewBottomControls}>
                      <TouchableOpacity onPress={() => setTempImage(null)} style={[styles.iconButton, { backgroundColor: 'white' }]}>
                          <MaterialCommunityIcons name="refresh" size={32} color="black" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmImage} style={[styles.iconButton, { backgroundColor: theme.primary }]}>
                          <MaterialCommunityIcons name="check" size={32} color="white" />
                      </TouchableOpacity>
                </View>
            </View>
        );
      }
      return (
          <View style={styles.cameraContainer}>
              <CameraView style={[styles.camera, StyleSheet.absoluteFill]} ref={cameraRef} facing="back" />
              <View style={styles.overlay}>
                  <View style={styles.overlayHeader}>
                      <TouchableOpacity onPress={() => setIsCameraVisible(false)} style={styles.closeButton}>
                          <MaterialCommunityIcons name="close" size={30} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.overlayText}>{t('cameraInstruction')}</Text>
                  </View>
                  <View style={styles.frameContainer}>
                      <View style={[styles.passportFrame, { borderColor: 'white' }]}>
                          <View style={styles.divider} />
                          <View style={styles.photoPlaceholder} />
                      </View>
                  </View>
                  <View style={styles.controlsContainer}>
                      <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                          <View style={[styles.captureInner, { backgroundColor: theme.primary }]} />
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressBar progress={isEmployer ? 0.9 : 0.2} color={theme.primary} style={styles.progress} />
      
      <Portal>
        <Modal visible={citizenModalVisible} onDismiss={() => setCitizenModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.text }]}>{t('citizenship')}</Text>
          {CITIZENSHIP_OPTIONS.map((c) => (
            <List.Item
              key={c.value}
              title={`${c.flag}  ${c.label}`}
              titleStyle={{ color: theme.text }}
              onPress={() => {
                setForm({ ...form, citizenship: c.value });
                setCitizenModalVisible(false);
              }}
              style={styles.modalItem}
              right={props => form.citizenship === c.value ? <List.Icon {...props} icon="check" color={theme.primary}/> : null}
            />
          ))}
        </Modal>
      </Portal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text variant="headlineSmall" style={[styles.header, { color: theme.text }]}>
                {isEmployer ? t('companyInfo') : t('personalInfo')}
            </Text>
            <Text variant="bodyMedium" style={[styles.subHeader, { color: theme.textSecondary }]}>
                {isEmployer ? t('fillCompanyData') : t('fillData')}
            </Text>
            
            {/* Passport Scan - Enabled for everyone */}
            {!passportImage ? (
                <TouchableOpacity style={[styles.scanCard, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={handleScan}>
                    <MaterialCommunityIcons name="camera-outline" size={32} color={theme.primary} />
                    <View style={styles.scanCardTextContainer}>
                        <Text style={[styles.scanCardTitle, { color: theme.primary }]}>{t('scanPassport')}</Text>
                        <Text variant="bodySmall" style={[styles.scanCardSubtitle, { color: theme.primary }]}>{t('autoFill')}</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={[styles.miniPreviewContainer, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                    <Image source={{uri: passportImage}} style={styles.miniPreview} />
                    <View style={{marginLeft: 12, justifyContent: 'center'}}>
                            <Text style={{fontWeight: 'bold', color: '#2E7D32'}}>{t('passportLoaded')}</Text>
                            <TouchableOpacity onPress={handleScan}><Text style={{color: theme.primary, fontWeight: 'bold'}}>{t('cameraRetake')}</Text></TouchableOpacity>
                    </View>
                </View>
            )}
            
            {/* Employer Only: Company Name */}
            {isEmployer && (
                <CustomInput label={t('companyName')} value={form.companyName} onChangeText={(text) => setForm({...form, companyName: text})} error={errors.companyName} />
            )}

            {/* Citizenship Selector - Enabled for everyone */}
            <Text variant="bodySmall" style={{color: errors.citizenship ? theme.error : theme.textSecondary, marginBottom: 4, marginLeft: 4, fontWeight: '600'}}>{t('citizenship')}</Text>
            <TouchableOpacity 
                style={[
                  styles.citizenshipSelector, 
                  { backgroundColor: theme.surface, borderColor: errors.citizenship ? theme.error : theme.border },
                  errors.citizenship ? { borderWidth: 2 } : {}
                ]} 
                onPress={() => setCitizenModalVisible(true)}
            >
                <Text style={{fontSize: 16, color: form.citizenship ? theme.text : theme.textSecondary}}>
                    {form.citizenship ? `${getCitizenshipFlag()}  ${getCitizenshipLabel()}` : t('selectCountry')}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            {errors.citizenship && <Text style={{ color: theme.error, fontSize: 12, marginLeft: 4, marginTop: -12, marginBottom: 8 }}>{errors.citizenship}</Text>}

            <CustomInput label={t('lastName')} value={form.lastName} onChangeText={(text) => setForm({...form, lastName: text})} error={errors.lastName} />

            <CustomInput label={t('firstName')} value={form.firstName} onChangeText={(text) => setForm({...form, firstName: text})} error={errors.firstName} />
            
            {/* Patronymic & Passport Fields - Enabled for everyone */}
            <CustomInput label={t('patronymic')} value={form.patronymic} onChangeText={(text) => setForm({...form, patronymic: text})} error={errors.patronymic} />
            
            <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                    <CustomInput label={t('passportSeries')} value={form.passportSeries} onChangeText={(text) => setForm({...form, passportSeries: text})} keyboardType={form.citizenship === 'Россия' ? "number-pad" : "default"} error={errors.passportSeries} maxLength={form.citizenship === 'Россия' ? 4 : 2} />
                </View>

                <View style={styles.halfInputContainer}>
                    <CustomInput label={t('passportNumber')} value={form.passportNumber} onChangeText={(text) => setForm({...form, passportNumber: text})} keyboardType="number-pad" error={errors.passportNumber} maxLength={form.citizenship === 'Россия' ? 6 : 7} />
                </View>
            </View>
            
            {/* Languages - Enabled for everyone */}
            <Text variant="titleMedium" style={{marginTop: 16, marginBottom: 12, fontWeight: 'bold', color: theme.text}}>{t('selectLanguage')}</Text>
            {AVAILABLE_LANGUAGES.map(langKey => {
                const isSelected = selectedLanguages.some(l => l.name === langKey);
                const currentLevel = selectedLanguages.find(l => l.name === langKey)?.level || 'intermediate';
                return (
                    <View key={langKey} style={styles.langRow}>
                        <TouchableOpacity style={styles.langCheck} onPress={() => handleLanguageToggle(langKey)}>
                            <Checkbox status={isSelected ? 'checked' : 'unchecked'} onPress={() => handleLanguageToggle(langKey)} color={theme.primary} />
                            <Text style={{fontSize: 20, marginRight: 8}}>{LANG_FLAGS[langKey]}</Text>
                            <Text style={{fontSize: 16, color: theme.text}}>{t(`lang_${langKey}`)}</Text>
                        </TouchableOpacity>
                        {isSelected && (
                            <SegmentedButtons 
                              value={currentLevel} 
                              onValueChange={(val) => handleLevelChange(langKey, val)} 
                              buttons={[
                                { value: 'beginner', label: t('proficiency_beginner'), icon: 'signal-cellular-1' }, 
                                { value: 'intermediate', label: t('proficiency_intermediate'), icon: 'signal-cellular-2' }, 
                                { value: 'fluent', label: t('proficiency_fluent'), icon: 'signal-cellular-3' }
                              ]} 
                              style={styles.levelSelector} 
                              density="small" 
                              theme={{ colors: { secondaryContainer: theme.secondary, onSecondaryContainer: theme.primary } }}
                            />
                        )}
                    </View>
                );
            })}

            <PrimaryButton 
              title={t('next')} 
              onPress={handleNext} 
              loading={saving} 
              disabled={saving}
              style={styles.button}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: { height: 4 },
  modalContent: { padding: 24, margin: 24, borderRadius: 24 },
  modalTitle: { marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  modalItem: { paddingVertical: 8, borderRadius: 12 },
  cameraContainer: { flex: 1, backgroundColor: 'black', position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  overlayHeader: { paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  overlayText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  frameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  passportFrame: { width: '85%', height: '65%', borderWidth: 3, borderRadius: 20, position: 'relative' },
  divider: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.5)', width: '100%' },
  photoPlaceholder: { position: 'absolute', bottom: 25, left: 25, width: 80, height: 100, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  controlsContainer: { paddingBottom: 50, alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32 },
  previewHeader: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  previewBottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 50, paddingHorizontal: 40, backgroundColor: 'rgba(0,0,0,0.7)', paddingTop: 30 },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 24 },
  scanCardTextContainer: { marginLeft: 16 },
  scanCardTitle: { fontWeight: '700', fontSize: 16 },
  scanCardSubtitle: { opacity: 0.8 },
  content: { padding: 24 },
  header: { fontWeight: '800', marginBottom: 8 },
  subHeader: { marginBottom: 24 },
  miniPreviewContainer: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 24, borderWidth: 1 },
  miniPreview: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#ddd' },
  citizenshipSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  halfInputContainer: { flex: 1 },
  langRow: { marginBottom: 16 },
  langCheck: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  levelSelector: { marginLeft: 8 },
  button: { marginTop: 24, marginBottom: 48 },
});