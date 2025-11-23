import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import Section from '../components/Section';
import ProfileFormFields from '../components/ProfileFormFields';
import InlineSelect from '../components/InlineSelect';
import SkillEditor from '../components/SkillEditor';
import { getErrorMessage } from '../utils/errorHandler';

const ProfileScreen = ({
  isCompact,
  profileForm,
  profileErrors,
  handleProfileFieldChange,
  openProfileEditor,
  isProfileDirty,
  profileSaveError,
  profileSavedAt,
  formatSavedTime,
  skillMatrix,
  handleSkillLevelChange,
  handleSkillFocusToggle,
  setAddSkillModalVisible,
  handleDeleteSkill,
  uploadDocumentPhotoMutation,
  handleFileSelect,
  isDocumentsLoading,
  documentsError,
  documentsData,
  refetchDocuments,
  handleViewDocument,
  handleDeleteDocument,
  deleteDocumentMutation,
  setDocumentsModalVisible,
  readinessChecklist,
}) => {
  return (
    <>
      <Section title="1. Профиль" compact={isCompact}>
        <View style={styles.profileHeaderRow}>
          <TouchableOpacity
            onPress={openProfileEditor}
            style={styles.editProfileButton}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={styles.editProfileButtonText}>Редактировать профиль</Text>
          </TouchableOpacity>
          {isProfileDirty && (
            <View style={styles.unsavedBadge}>
              <Ionicons name="warning" size={14} color="#FFF8E1" />
              <Text style={styles.unsavedBadgeText}>Черновик не сохранён</Text>
            </View>
          )}
        </View>

        <ProfileFormFields
          form={profileForm}
          errors={profileErrors}
          onFieldChange={handleProfileFieldChange}
          editable={false}
        />

        <InlineSelect
          label="Часовой пояс"
          value={profileForm.timezone}
          options={['GMT+5 (Ташкент)', 'GMT+3 (Москва)', 'GMT+6 (Алматы)'].map((zone) => ({ label: zone, value: zone }))}
          onSelect={(zone) => handleProfileFieldChange('timezone', zone)}
          editable={false}
        />

        <View style={styles.profileStatusRow}>
          {profileSaveError ? (
            <Text style={styles.profileStatusError}>{profileSaveError}</Text>
          ) : profileSavedAt ? (
            <Text style={styles.profileStatusText}>
              Последнее сохранение в {formatSavedTime(profileSavedAt)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.blockTitle}>Навыки и уровни</Text>
        <SkillEditor
          key={`skill-editor-${skillMatrix.reduce((sum, cat) => sum + cat.skills.length, 0)}-${skillMatrix.map(cat => cat.skills.map(s => s.key).join(',')).join('|')}`}
          categories={skillMatrix}
          onLevelChange={handleSkillLevelChange}
          onToggleGrow={handleSkillFocusToggle}
          onAddSkill={() => setAddSkillModalVisible(true)}
          onDeleteSkill={handleDeleteSkill}
        />
      </Section>

      <Section title="2. Документы" compact={isCompact}>
        <View style={styles.documentsActionsGrid}>
          <TouchableOpacity
            style={[styles.documentActionCard, uploadDocumentPhotoMutation.isPending && styles.documentActionCardDisabled]}
            onPress={() => handleFileSelect(null, true)}
            disabled={uploadDocumentPhotoMutation.isPending}
            activeOpacity={0.7}
          >
            <View style={styles.documentActionIconContainer}>
              <Ionicons name="camera-outline" size={28} color={theme.primary} />
            </View>
            <Text style={styles.documentActionCardTitle}>
              {uploadDocumentPhotoMutation.isPending ? 'Загрузка...' : 'Загрузить паспорт'}
            </Text>
            <Text style={styles.documentActionCardSubtitle}>JPG, PNG</Text>
          </TouchableOpacity>
        </View>

        {isDocumentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.loadingText}>Загрузка документов...</Text>
          </View>
        ) : documentsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {getErrorMessage(documentsError) || 'Не удалось загрузить документы'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetchDocuments()}
            >
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : documentsData && documentsData.length > 0 ? (
          <View style={styles.documentsList}>
            {documentsData.slice(0, 3).map((doc) => (
              <View key={doc.id || doc._id} style={styles.documentCard}>
                <View style={styles.documentCardHeader}>
                  <View style={styles.documentCardIconContainer}>
                    <Ionicons
                      name={doc.type === 'photo' ? 'image-outline' : 'document-text-outline'}
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.documentCardInfo}>
                    <Text style={styles.documentCardTitle} numberOfLines={1}>
                      {doc.title || doc.name || 'Документ'}
                    </Text>
                    {doc.description && (
                      <Text style={styles.documentCardDescription} numberOfLines={1}>
                        {doc.description}
                      </Text>
                    )}
                    {doc.uploadedAt && (
                      <Text style={styles.documentCardDate}>
                        {new Date(doc.uploadedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    )}
                  </View>
                  {doc.status && (
                    <View style={[
                      styles.documentStatusBadge,
                      { backgroundColor: doc.status === 'verified' ? '#66BB6A' : doc.status === 'pending' ? '#FFA726' : '#EF5350' }
                    ]}>
                      <Text style={styles.documentStatusText}>
                        {doc.status === 'verified' ? 'Проверен' : doc.status === 'pending' ? 'На проверке' : 'Отклонён'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.documentCardActions}>
                  <TouchableOpacity
                    style={styles.documentCardButton}
                    onPress={() => handleViewDocument(doc.id || doc._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={18} color={theme.primary} />
                    <Text style={styles.documentCardButtonText}>Просмотр</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.documentCardButton, styles.documentCardButtonDanger]}
                    onPress={(e) => {
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                      const docId = doc.id || doc._id;
                      if (docId) {
                        handleDeleteDocument(docId);
                      } else {
                        Alert.alert('Ошибка', 'Не удалось определить ID документа');
                      }
                    }}
                    disabled={deleteDocumentMutation.isPending}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Удалить документ"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF5350" />
                    <Text style={[styles.documentCardButtonText, styles.documentCardButtonTextDanger]}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {documentsData.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setDocumentsModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward-outline" size={18} color={theme.primary} />
                <Text style={styles.viewAllButtonText}>
                  Показать все документы ({documentsData.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={theme.muted} />
            <Text style={styles.emptyText}>Документы не загружены</Text>
            <Text style={styles.emptySubtext}>
              Загрузите документы для подтверждения вашей квалификации
            </Text>
          </View>
        )}
      </Section>

      <Section title="Новая идея: проверка готовности" compact={isCompact}>
        <Text style={styles.sectionSubtitle}>
          Перед каждым выходом на работу приложение напоминает, что взять
          и что нужно подтвердить.
        </Text>
        {readinessChecklist.map((item) => (
          <View key={item} style={styles.checkItem}>
            <View style={styles.checkBullet} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Запланировать проверку</Text>
        </TouchableOpacity>
      </Section>
    </>
  );
};

export default ProfileScreen;
