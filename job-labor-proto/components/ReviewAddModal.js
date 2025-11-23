import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../AppStyles';

const ReviewAddModal = ({ visible, onClose, onAdd, isSaving }) => {
  const [targetId, setTargetId] = useState(''); // For prototype, manual ID entry or selection
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSave = () => {
    if (comment.trim()) {
      // In a real app, targetId would be passed from context (e.g. selected worker)
      // For this prototype, we'll assume we are reviewing "someone" or we need to select them.
      // But since we are on "My Reviews" tab, creating a review here is unusual. 
      // Usually you review a specific completed shift/job.
      
      // However, to make the button functional for the prototype:
      // We'll pass a mock targetId if one isn't provided, just to test the API.
      // Or we can ask user to input ID (dev mode).
      
      onAdd({ targetId: targetId || '2', rating, comment }); // Default target ID 2 for testing
      setComment('');
      setRating(5);
      setTargetId('');
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Оставить отзыв</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.body}>
            {/* Dev Mode: Target ID Input */}
            {/* <Text style={styles.label}>ID пользователя (Dev)</Text>
            <TextInput
              style={styles.input}
              placeholder="ID"
              value={targetId}
              onChangeText={setTargetId}
              keyboardType="numeric"
            /> */}

            <Text style={styles.label}>Оценка</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity key={r} onPress={() => setRating(r)}>
                  <Ionicons 
                    name={r <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color="#FFB300" 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Комментарий</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Напишите ваш отзыв..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!comment.trim() || isSaving) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!comment.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Отправить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingBottom: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 6,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C62828',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#C62828',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#C62828',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ReviewAddModal;
