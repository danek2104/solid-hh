import React from 'react';
import { ScrollView } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../AppStyles';

import ReviewsScreen from '../../screens/ReviewsScreen';

export default function Reviews() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;

    const formattedReviews = [];
    const readinessChecklist = [];

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
                {/* ... hero content */}
            </LinearGradient>
            <ReviewsScreen
                isCompact={isCompact}
                setReviewModalVisible={() => { }}
                isReviewsLoading={false}
                reviewsError={null}
                refetchReviews={() => { }}
                formattedReviews={formattedReviews}
                readinessChecklist={readinessChecklist}
            />
        </ScrollView>
    );
}
