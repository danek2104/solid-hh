import React, { useContext, useState, useCallback } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, theme } from '../../AppStyles';

import ReviewsScreen from '../../screens/ReviewsScreen';
import ReviewAddModal from '../../components/ReviewAddModal';
import AuthContext from '../../context/AuthContext';
import { useReviewsQuery, useCreateReview } from '../../hooks/useReviews';
import { useProfileQuery } from '../../hooks/useProfile';

export default function Reviews() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const { token, isEmployer } = useContext(AuthContext);
    const [isModalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Data Fetching
    const { data: profileData, refetch: refetchProfile } = useProfileQuery(token);
    const {
        data: reviewsData,
        isLoading: isReviewsLoading,
        error: reviewsError,
        refetch: refetchReviews
    } = useReviewsQuery({}, token);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchReviews(), refetchProfile()]);
        setRefreshing(false);
    }, [refetchReviews, refetchProfile]);

    const createReviewMutation = useCreateReview(token);

    // Correctly extract reviews array
    // fetchReviews returns data.reviews which is the array
    const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.reviews || []);

    const formattedReviews = reviews.map(r => ({
        id: r.id,
        employer: r.author?.name || r.author?.email || 'Пользователь',
        rating: r.rating,
        text: r.comment,
        date: new Date(r.createdAt).toLocaleDateString('ru-RU'),
        shift: 'Смена' 
    }));

    console.log('Reviews Data:', reviews);
    console.log('Formatted Reviews:', formattedReviews);

    const readinessChecklist = [
        'Будьте вежливы и пунктуальны',
        'Выполняйте работу качественно',
        'Попросите оставить отзыв после смены'
    ];

    const handleAddReview = async (data) => {
        try {
            await createReviewMutation.mutateAsync(data);
            refetchReviews();
            refetchProfile(); // Update rating badge
        } catch (error) {
            console.error('Failed to create review', error);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.contentContainer,
                isCompact && styles.contentCompact,
            ]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
        >
            <LinearGradient
                colors={['#C62828', '#8E0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, isCompact && styles.heroCompact]}
            >
                <View style={styles.heroHeader}>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.heroLabel}>Репутация</Text>
                        <Text style={styles.heroTitle}>Отзывы</Text>
                        <Text style={styles.heroSubtitle}>Что говорят о вашей работе</Text>
                    </View>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>
                            {(profileData?.rating || profileData?.profile?.rating || 0).toFixed(1)} ★
                        </Text>
                    </View>
                </View>
            </LinearGradient>
            <ReviewsScreen
                isCompact={isCompact}
                setReviewModalVisible={setModalVisible}
                isReviewsLoading={isReviewsLoading}
                reviewsError={reviewsError}
                refetchReviews={refetchReviews}
                formattedReviews={formattedReviews}
                readinessChecklist={readinessChecklist}
                isEmployer={isEmployer}
            />
            
            <ReviewAddModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onAdd={handleAddReview}
                isSaving={createReviewMutation.isPending}
            />
        </ScrollView>
    );
}
