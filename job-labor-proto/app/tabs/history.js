import React, { useContext } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, theme } from '../../AppStyles';

import HistoryScreen from '../../screens/HistoryScreen';
import AuthContext from '../../context/AuthContext';
import { useShiftsQuery } from '../../hooks/useShifts';

export default function History() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const { token, authRole } = useContext(AuthContext);

    // Data Fetching
    const { 
        data: shiftsData, 
        isLoading: isShiftsLoading,
        error: shiftsError,
        refetch: refetchShifts
    } = useShiftsQuery(token);

    const shifts = shiftsData?.shifts || [];

    // Process shifts into 'Closed' and 'Upcoming' (Timeline)
    // 'closed' -> status 'completed' or 'cancelled' or past date
    // 'timeline' -> status 'accepted' or 'available' (future)
    
    const now = new Date();

    const closedShifts = shifts.filter(s => 
        s.status === 'completed' || 
        s.status === 'cancelled' || 
        new Date(s.date) < now
    ).map(s => ({
        id: s.id,
        title: s.title || s.job?.title || 'Смена',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        pay: s.payment ? `${s.payment} сум` : null,
        rating: 5, // Placeholder rating
        feedback: s.feedback || 'Отзыв не оставлен' // Placeholder
    }));

    const timelineMilestones = shifts.filter(s => 
        (s.status === 'accepted' || s.status === 'available') && 
        new Date(s.date) >= now
    ).map(s => ({
        id: s.id,
        status: s.status === 'accepted' ? 'upcoming' : 'alert', // accepted -> green, available -> orange
        title: s.title || s.job?.title || 'Смена',
        meta: `${new Date(s.date).toLocaleDateString('ru-RU')} • ${s.startTime}`,
        action: s.status === 'available' ? 'Принять' : 'Детали'
    }));

    if (isShiftsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Загрузка смен...</Text>
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
                        <Text style={styles.heroLabel}>История</Text>
                        <Text style={styles.heroTitle}>Мои смены</Text>
                        <Text style={styles.heroSubtitle}>Предстоящие и завершенные работы</Text>
                    </View>
                </View>
            </LinearGradient>
            <HistoryScreen
                closedShifts={closedShifts}
                timelineMilestones={timelineMilestones}
                isCompact={isCompact}
            />
        </ScrollView>
    );
}
