import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';

const DocumentCardItem = memo(({ item, onView, onDelete, isDeleting }) => (
  <View style={styles.documentCard}>
    <View style={styles.documentCardHeader}>
      <Ionicons
        name={item.type === 'photo' ? 'image-outline' : 'document-text-outline'}
        size={32}
        color={theme.primary}
      />
      <View style={styles.documentCardInfo}>
        <Text style={styles.documentCardTitle}>
          {item.title || item.name || 'Документ'}
        </Text>
        {item.description && (
          <Text style={styles.documentCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.uploadedAt && (
          <Text style={styles.documentCardDate}>
            Загружен: {new Date(item.uploadedAt).toLocaleDateString('ru-RU')}
          </Text>
        )}
      </View>
    </View>
    {item.status && (
      <View style={[
        styles.documentStatusBadge,
        { backgroundColor: item.status === 'verified' ? '#66BB6A' : item.status === 'pending' ? '#FFA726' : '#EF5350' }
      ]}>
        <Text style={styles.documentStatusText}>
          {item.status === 'verified' ? 'Проверен' : item.status === 'pending' ? 'На проверке' : 'Отклонён'}
        </Text>
      </View>
    )}
    <View style={styles.documentCardActions}>
      <TouchableOpacity
        style={styles.documentCardButton}
        onPress={() => onView(item.id || item._id)}
      >
        <Ionicons name="eye-outline" size={18} color={theme.primary} />
        <Text style={styles.documentCardButtonText}>Просмотр</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.documentCardButton, styles.documentCardButtonDanger]}
        onPress={() => onDelete(item.id || item._id)}
        disabled={isDeleting}
      >
        <Ionicons name="trash-outline" size={18} color="#EF5350" />
        <Text style={[styles.documentCardButtonText, styles.documentCardButtonTextDanger]}>Удалить</Text>
      </TouchableOpacity>
    </View>
  </View>
));

DocumentCardItem.displayName = 'DocumentCardItem';

export default DocumentCardItem;
