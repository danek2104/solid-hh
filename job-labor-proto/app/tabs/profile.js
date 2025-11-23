import React, { useContext, useMemo, useState } from 'react';
import { ScrollView, Text, ActivityIndicator, View, TouchableOpacity, Alert } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { styles, theme } from '../../AppStyles';

import ProfileScreen from '../../screens/ProfileScreen';
import AuthContext from '../../context/AuthContext';
import { useProfileQuery, useUpdateProfile, useDocumentStatusesQuery } from '../../hooks/useProfile';
import { useProfileStore, formatSavedTime } from '../../hooks/useProfileStore';
import { useDocumentsQuery, useUploadDocument, useDeleteDocument } from '../../hooks/useDocuments';
import ProfileEditModal from '../../components/ProfileEditModal';
import SkillAddModal from '../../components/SkillAddModal';

export default function Profile() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const router = useRouter();
    const { token } = useContext(AuthContext);

    const [addSkillModalVisible, setAddSkillModalVisible] = useState(false);
    const [documentsModalVisible, setDocumentsModalVisible] = useState(false);

    // Data Fetching
    const { 
        data: profileData, 
        isLoading: isProfileLoading, 
        error: profileError,
        refetch: refetchProfile
    } = useProfileQuery(token);

    const { 
        data: documentsData, 
        isLoading: isDocumentsLoading, 
        error: documentsError,
        refetch: refetchDocuments 
    } = useDocumentsQuery(token);

    const { data: docStatuses } = useDocumentStatusesQuery(token);

    // Mutations
    const updateProfileMutation = useUpdateProfile(token);
    const uploadDocumentMutation = useUploadDocument(token);
    const deleteDocumentMutation = useDeleteDocument(token);

    // Profile Store (Draft Management)
    const {
        draft: profileForm,
        errors: profileErrors,
        isDirty: isProfileDirty,
        setField: handleProfileFieldChange,
        saveProfile,
        lastSavedAt: profileSavedAt,
        lastError: profileSaveError,
        openEditor: openProfileEditor,
        closeEditor: closeProfileEditor,
        modalVisible: isProfileModalVisible,
    } = useProfileStore({
        // Handle both structures: direct profile object or wrapped in {profile: ...}
        initialProfile: profileData?.profile || profileData || {}, 
        saveProfileRequest: async (data) => {
            await updateProfileMutation.mutateAsync(data);
        },
    });

    console.log('Profile Render - Data:', profileData?.profile);
    console.log('Profile Render - Form:', profileForm);

    // Handlers
    const handleFileSelect = async (type = 'document', isCamera = false) => {
        try {
            let result;
            
            if (type === 'photo' || isCamera) {
                // Request permission first
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Ошибка', 'Нет доступа к галерее');
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 0.8,
                });
            } else {
                result = await DocumentPicker.getDocumentAsync({
                    type: 'application/pdf',
                    copyToCacheDirectory: true
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                // Upload file
                uploadDocumentMutation.mutate({ 
                    file: file,
                    documentType: type 
                });
            }
        } catch (error) {
            console.error('Error picking file:', error);
            Alert.alert('Ошибка', 'Не удалось выбрать файл');
        }
    };

    const handleViewDocument = (docId) => {
        console.log('View document', docId);
    };

    const handleDeleteDocument = (docId) => {
        deleteDocumentMutation.mutate(docId);
    };

    const handleAddSkill = (newSkill) => {
        // Update profileForm skills array
        // Note: This assumes skills are stored in profile.skills array
        // In a real app, this might be a separate mutation
        const currentSkills = profileForm.skills || [];
        const updatedSkills = [...currentSkills, newSkill];
        handleProfileFieldChange('skills', updatedSkills);
    };

    // Skill Handlers
    const skillMatrix = useMemo(() => {
        return [
            {
                id: 'main',
                title: 'Основные навыки',
                skills: (profileForm.skills || []).map((s, i) => ({ ...s, key: i.toString() })) 
            }
        ]; 
    }, [profileForm.skills]);

    const handleSkillLevelChange = (categoryKey, skillKey, value) => {
        // skillKey is the index in the original array (as string)
        const index = parseInt(skillKey, 10);
        const currentSkills = [...(profileForm.skills || [])];
        if (currentSkills[index]) {
            currentSkills[index] = { ...currentSkills[index], level: value };
            handleProfileFieldChange('skills', currentSkills);
        }
    };
    
    const handleSkillFocusToggle = (categoryKey, skillKey) => {
        const index = parseInt(skillKey, 10);
        const currentSkills = [...(profileForm.skills || [])];
        if (currentSkills[index]) {
            currentSkills[index] = { 
                ...currentSkills[index], 
                wantToGrow: !currentSkills[index].wantToGrow 
            };
            handleProfileFieldChange('skills', currentSkills);
        }
    };

    const handleDeleteSkill = (categoryKey, skillKey) => {
        const index = parseInt(skillKey, 10);
        const currentSkills = [...(profileForm.skills || [])];
        currentSkills.splice(index, 1);
        handleProfileFieldChange('skills', currentSkills);
    };

    const readinessChecklist = [
        'Паспорт и регистрация на руках',
        'Рабочая одежда подготовлена',
        'Телефон заряжен',
        'Маршрут построен'
    ];

    if (isProfileLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Загрузка профиля...</Text>
            </View>
        );
    }

    if (profileError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Не удалось загрузить профиль</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.contentContainer,
                isCompact && styles.contentCompact,
            ]}
        >
            <LinearGradient
                colors={['#C62828', '#8E0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, isCompact && styles.heroCompact]}
            >
                <View style={styles.heroHeader}>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.heroLabel}>Ваш профиль</Text>
                        <Text style={styles.heroTitle}>
                            {profileForm.fullName || profileForm.firstName || 'Пользователь'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {profileForm.role === 'employer' ? 'Работодатель' : 'Специалист'}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/settings')}
                        style={{ padding: 8 }}
                    >
                        <Ionicons name="settings-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ProfileScreen
                isCompact={isCompact}
                profileForm={profileForm}
                profileErrors={profileErrors}
                handleProfileFieldChange={handleProfileFieldChange}
                openProfileEditor={openProfileEditor}
                isProfileDirty={isProfileDirty}
                profileSaveError={profileSaveError}
                profileSavedAt={profileSavedAt}
                formatSavedTime={formatSavedTime}
                skillMatrix={skillMatrix}
                handleSkillLevelChange={handleSkillLevelChange}
                handleSkillFocusToggle={handleSkillFocusToggle}
                setAddSkillModalVisible={setAddSkillModalVisible}
                handleDeleteSkill={handleDeleteSkill}
                uploadDocumentPhotoMutation={uploadDocumentMutation}
                handleFileSelect={handleFileSelect}
                isDocumentsLoading={isDocumentsLoading}
                documentsError={documentsError}
                documentsData={documentsData}
                refetchDocuments={refetchDocuments}
                handleViewDocument={handleViewDocument}
                handleDeleteDocument={handleDeleteDocument}
                deleteDocumentMutation={deleteDocumentMutation}
                setDocumentsModalVisible={setDocumentsModalVisible}
                readinessChecklist={readinessChecklist}
            />

            {/* Edit Modal */}
            <ProfileEditModal
                visible={isProfileModalVisible}
                onClose={closeProfileEditor}
                form={profileForm}
                errors={profileErrors}
                onFieldChange={handleProfileFieldChange}
                onSave={saveProfile}
                isSaving={updateProfileMutation.isPending}
                isDirty={isProfileDirty}
                isValid={Object.keys(profileErrors).length === 0}
            />

            {/* Skill Add Modal */}
            <SkillAddModal
                visible={addSkillModalVisible}
                onClose={() => setAddSkillModalVisible(false)}
                onAdd={handleAddSkill}
                isSaving={false}
            />
        </ScrollView>
    );
}
