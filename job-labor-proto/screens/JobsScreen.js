import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, TextInput, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import Section from '../components/Section';
import Chip from '../components/Chip';
import JobCardItem from '../components/JobCardItem';
import Tag from '../components/Tag';
import { getErrorMessage } from '../utils/errorHandler';

const JobsScreen = ({
    isCompact,
    applicationsView,
    setApplicationsView,
    isApplicationsLoading,
    applicationsError,
    refetchJobs,
    applications,
    getApplicationStatusColor,
    getApplicationStatusLabel,
    jobSearchQuery,
    setJobSearchQuery,
    jobFilterTags,
    jobFilters,
    handleJobFilterChange,
    isJobsLoading,
    jobsError,
    jobs,
    handleJobSelect,
    jobApplicationModalVisible,
    handleCloseJobModal,
    isJobDetailsLoading,
    jobDetails,
    applicationMessage,
    setApplicationMessage,
    applyToJobMutation,
    handleJobApply,
}) => (
    <>
        <View style={styles.viewToggleContainer}>
            <TouchableOpacity
                style={[
                    styles.viewToggleButton,
                    !applicationsView && styles.viewToggleButtonActive,
                ]}
                onPress={() => setApplicationsView(false)}
            >
                <Text
                    style={[
                        styles.viewToggleText,
                        !applicationsView && styles.viewToggleTextActive,
                    ]}
                >
                    Вакансии
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.viewToggleButton,
                    applicationsView && styles.viewToggleButtonActive,
                ]}
                onPress={() => setApplicationsView(true)}
            >
                <Text
                    style={[
                        styles.viewToggleText,
                        applicationsView && styles.viewToggleTextActive,
                    ]}
                >
                    Мои отклики
                </Text>
            </TouchableOpacity>
        </View>

        {applicationsView ? (
            <Section title="Мои отклики" compact={isCompact}>
                {isApplicationsLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={styles.loadingText}>Загрузка откликов...</Text>
                    </View>
                ) : applicationsError ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {getErrorMessage(applicationsError) || 'Не удалось загрузить отклики'}
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => refetchJobs()}
                        >
                            <Text style={styles.retryButtonText}>Повторить</Text>
                        </TouchableOpacity>
                    </View>
                ) : applications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color={theme.muted} />
                        <Text style={styles.emptyText}>У вас пока нет откликов</Text>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setApplicationsView(false)}
                        >
                            <Text style={styles.secondaryButtonText}>Найти вакансии</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    applications.map((application) => (
                        <View
                            key={application.id || application._id}
                            style={[styles.applicationCard, isCompact && styles.applicationCardCompact]}
                        >
                            <View style={styles.applicationHeader}>
                                <Text style={styles.applicationJobTitle}>
                                    {application.job?.title || 'Вакансия'}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getApplicationStatusColor(application.status) },
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {getApplicationStatusLabel(application.status)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.applicationCompany}>
                                {application.job?.company || 'Компания'}
                            </Text>
                            {application.createdAt && (
                                <Text style={styles.applicationDate}>
                                    Отправлено: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                                </Text>
                            )}
                            {application.message && (
                                <Text style={styles.applicationMessage}>{application.message}</Text>
                            )}
                        </View>
                    ))
                )}
            </Section>
        ) : (
            <>
                <Section title="Поиск вакансий" compact={isCompact}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={theme.muted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Поиск по названию, компании, навыкам..."
                            placeholderTextColor={theme.muted}
                            value={jobSearchQuery}
                            onChangeText={setJobSearchQuery}
                        />
                        {jobSearchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setJobSearchQuery('')}
                                style={styles.searchClearButton}
                            >
                                <Ionicons name="close-circle" size={20} color={theme.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </Section>

                <Section title="Фильтры" compact={isCompact}>
                    <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
                        {jobFilterTags.map((filter) => (
                            <Chip key={filter} label={filter} />
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <View style={styles.filterInputContainer}>
                            <Ionicons name="location-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Город"
                                placeholderTextColor={theme.muted}
                                value={jobFilters.location}
                                onChangeText={(value) => handleJobFilterChange('location', value)}
                            />
                        </View>
                        <View style={styles.filterInputContainer}>
                            <Ionicons name="construct-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Навык"
                                placeholderTextColor={theme.muted}
                                value={jobFilters.skill}
                                onChangeText={(value) => handleJobFilterChange('skill', value)}
                            />
                        </View>
                    </View>
                    <View style={styles.filterRow}>
                        <View style={styles.filterInputContainer}>
                            <Ionicons name="cash-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Мин. зарплата"
                                placeholderTextColor={theme.muted}
                                value={jobFilters.minSalary}
                                onChangeText={(value) => handleJobFilterChange('minSalary', value)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.filterInputContainer}>
                            <Ionicons name="cash-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                            <TextInput
                                style={styles.filterInput}
                                placeholder="Макс. зарплата"
                                placeholderTextColor={theme.muted}
                                value={jobFilters.maxSalary}
                                onChangeText={(value) => handleJobFilterChange('maxSalary', value)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </Section>

                <Section title="Свободные вакансии" compact={isCompact}>
                    {isJobsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>Загрузка вакансий...</Text>
                        </View>
                    ) : jobsError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                                {getErrorMessage(jobsError) || 'Не удалось загрузить вакансии'}
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => refetchJobs()}
                            >
                                <Text style={styles.retryButtonText}>Повторить</Text>
                            </TouchableOpacity>
                        </View>
                    ) : jobs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={48} color={theme.muted} />
                            <Text style={styles.emptyText}>Вакансии не найдены</Text>
                            <Text style={styles.emptySubtext}>
                                Попробуйте изменить параметры поиска или фильтры
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={jobs}
                            keyExtractor={(item) => String(item.id || item._id)}
                            renderItem={({ item }) => (
                                <JobCardItem
                                    item={item}
                                    isCompact={isCompact}
                                    onPress={handleJobSelect}
                                />
                            )}
                            scrollEnabled={false}
                            removeClippedSubviews={true}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            getItemLayout={(data, index) => ({
                                length: 200, 
                                offset: 200 * index,
                                index,
                            })}
                        />
                    )}
                </Section>
            </>
        )}

        <Modal
            visible={jobApplicationModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCloseJobModal}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Детали вакансии</Text>
                    <TouchableOpacity onPress={handleCloseJobModal} style={styles.modalCloseButton}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalContent}>
                    {isJobDetailsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>Загрузка деталей...</Text>
                        </View>
                    ) : jobDetails ? (
                        <>
                            <Text style={styles.jobDetailTitle}>{jobDetails.title}</Text>
                            <Text style={styles.jobDetailCompany}>
                                {jobDetails.company || jobDetails.employer?.name || 'Компания'}
                            </Text>
                            {jobDetails.salary && (
                                <Text style={styles.jobDetailSalary}>
                                    {typeof jobDetails.salary === 'object'
                                        ? (jobDetails.salary.min || jobDetails.salary.max
                                            ? `${jobDetails.salary.min || ''} - ${jobDetails.salary.max || ''} ${jobDetails.salary.currency || 'сум'}`
                                            : `${jobDetails.salary.currency || 'сум'}`)
                                        : jobDetails.salary}
                                </Text>
                            )}
                            {jobDetails.location && (
                                <View style={styles.jobDetailLocation}>
                                    <Ionicons name="location-outline" size={18} color={theme.muted} />
                                    <Text style={styles.jobDetailLocationText}>{jobDetails.location}</Text>
                                </View>
                            )}
                            {jobDetails.description && (
                                <View style={styles.jobDetailSection}>
                                    <Text style={styles.jobDetailSectionTitle}>Описание</Text>
                                    <Text style={styles.jobDetailDescription}>{jobDetails.description}</Text>
                                </View>
                            )}
                            {jobDetails.requirements && jobDetails.requirements.length > 0 && (
                                <View style={styles.jobDetailSection}>
                                    <Text style={styles.jobDetailSectionTitle}>Требования</Text>
                                    {jobDetails.requirements.map((req, index) => (
                                        <View key={index} style={styles.checkItem}>
                                            <View style={styles.checkBullet} />
                                            <Text style={styles.checkText}>{req}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {jobDetails.skills && jobDetails.skills.length > 0 && (
                                <View style={styles.jobDetailSection}>
                                    <Text style={styles.jobDetailSectionTitle}>Навыки</Text>
                                    <View style={styles.tagsRow}>
                                        {Array.isArray(jobDetails.skills) && jobDetails.skills.map((skill, index) => (
                                            <Tag
                                                key={index}
                                                label={typeof skill === 'string' ? (skill && skill !== '.' ? skill : '') : (skill.name && skill.name !== '.' ? skill.name : '')}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}
                            <View style={styles.jobDetailSection}>
                                <Text style={styles.jobDetailSectionTitle}>Сообщение работодателю (необязательно)</Text>
                                <TextInput
                                    style={styles.messageInput}
                                    placeholder="Расскажите о себе, почему вы подходите на эту вакансию..."
                                    placeholderTextColor={theme.muted}
                                    value={applicationMessage}
                                    onChangeText={setApplicationMessage}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    applyToJobMutation.isPending && styles.primaryButtonDisabled,
                                ]}
                                onPress={handleJobApply}
                                disabled={applyToJobMutation.isPending}
                            >
                                {applyToJobMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Откликнуться</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Не удалось загрузить детали вакансии</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    </>
);

export default JobsScreen;
