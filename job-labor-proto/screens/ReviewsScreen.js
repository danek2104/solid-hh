import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import Section from '../components/Section';
import ReviewCard from '../components/ReviewCard';
import { getErrorMessage } from '../utils/errorHandler';

const ReviewsScreen = ({
  isCompact,
  setReviewModalVisible,
  isReviewsLoading,
  reviewsError,
  refetchReviews,
  formattedReviews,
  readinessChecklist,
}) => (
  <>
    <Section title="Отзывы заказчиков" compact={isCompact}>
      <View style={styles.sectionActionHeader}>
        <TouchableOpacity
          onPress={() => setReviewModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={styles.addButtonText}>Создать отзыв</Text>
        </TouchableOpacity>
      </View>
      {isReviewsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Загрузка отзывов...</Text>
        </View>
      ) : reviewsError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {getErrorMessage(reviewsError) || 'Не удалось загрузить отзывы'}
          </Text>
          <TouchableOpacity
            onPress={() => refetchReviews()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : formattedReviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={48} color={theme.muted} />
          <Text style={styles.emptyText}>Отзывов пока нет</Text>
          <Text style={styles.emptySubtext}>
            Создайте отзыв, чтобы поделиться своим опытом
          </Text>
        </View>
      ) : (
        <FlatList
          data={formattedReviews}
          keyExtractor={(item, index) => String(item.id || `${item.employer}-${item.date}` || index)}
          renderItem={({ item: review }) => (
            <ReviewCard {...review} />
          )}
          scrollEnabled={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </Section>
    <Section title="Как улучшить рейтинг" compact={isCompact}>
      <Text style={styles.sectionSubtitle}>
        Поддерживайте связь после смены, отправляйте фото отчёты и напоминайте
        заказчику оставить отзыв — так рейтинг 4.9 станет 5.0.
      </Text>
      {readinessChecklist.map((item) => (
        <View key={`review-${item}`} style={styles.checkItem}>
          <View style={styles.checkBullet} />
          <Text style={styles.checkText}>{item}</Text>
        </View>
      ))}
    </Section>
  </>
);

export default ReviewsScreen;
