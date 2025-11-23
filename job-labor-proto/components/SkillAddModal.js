import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../AppStyles';

const skillLevelLabels = {
  1: 'Новичок',
  2: 'Стажёр',
  3: 'Уверенно',
  4: 'Эксперт',
  5: 'Наставник',
};

const skillSuggestions = {
  'маляр': ['Стены', 'Потолки', 'Фасады', 'Металлоконструкции', 'Дерево'],
  'плиточник': ['Пол', 'Стены', 'Керамогранит', 'Мозаика', 'Тротуарная'],
  'электрик': ['Монтаж', 'Щит', 'Слаботочка', 'Ремонт', 'Люстры'],
  'сантехник': ['Трубы', 'Установка', 'Засоры', 'Отопление', 'Счетчики'],
  'разнорабочий': ['Грузчик', 'Уборка', 'Копка', 'Демонтаж', 'Помощь'],
  'сварщик': ['Аргон', 'Полуавтомат', 'Электродуговая', 'Трубы', 'Металлоконструкции'],
  'строитель': ['Бетон', 'Кладка', 'Арматура', 'Опалубка', 'Кровля'],
};

const SkillAddModal = ({ visible, onClose, onAdd, isSaving }) => {
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);

  // Get all available professions that match input
  const availableProfessions = Object.keys(skillSuggestions).filter(key => 
    key.toLowerCase().includes(skillName.toLowerCase())
  );

  // Get suggestions for the EXACT match (current selection)
  const currentTags = skillSuggestions[skillName.toLowerCase()] || [];

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSelectProfession = (prof) => {
    setSkillName(prof.charAt(0).toUpperCase() + prof.slice(1)); // Capitalize
    setSelectedTags([]);
  };

  const handleSave = () => {
    if (skillName.trim()) {
      onAdd({ 
        name: skillName, 
        level: skillLevel,
        tags: selectedTags 
      });
      setSkillName('');
      setSkillLevel(3);
      setSelectedTags([]);
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
            <Text style={styles.title}>Добавить навык</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.label}>Название навыка</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Маляр"
              value={skillName}
              onChangeText={(text) => {
                setSkillName(text);
              }}
              autoFocus
            />

            {/* Professions List (if name is not exact match yet or empty) */}
            {!currentTags.length && availableProfessions.length > 0 && (
               <View style={styles.suggestionsContainer}>
                 <Text style={styles.label}>Популярные профессии:</Text>
                 <View style={styles.tagsRow}>
                   {availableProfessions.slice(0, 6).map(prof => (
                     <TouchableOpacity
                       key={prof}
                       style={styles.suggestionPill}
                       onPress={() => handleSelectProfession(prof)}
                     >
                       <Text style={styles.suggestionText}>
                         {prof.charAt(0).toUpperCase() + prof.slice(1)}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
            )}

            {/* Tags List (if profession matches) */}
            {currentTags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.label}>Специализация ({skillName}):</Text>
                <View style={styles.tagsRow}>
                  {currentTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                      onPress={() => handleToggleTag(tag)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <Text style={styles.label}>Уровень владения: {skillLevelLabels[skillLevel]}</Text>
            <View style={styles.levelButtons}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity 
                  key={level} 
                  style={[styles.levelButton, skillLevel === level && styles.levelButtonActive]}
                  onPress={() => setSkillLevel(level)}
                >
                  <Text style={[styles.levelButtonText, skillLevel === level && styles.levelButtonTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!skillName.trim() || isSaving) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!skillName.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Добавить</Text>
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
  levelButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  levelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  levelButtonTextActive: {
    color: '#fff',
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
  tagsContainer: {
    gap: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#F5F5F5',
  },
  tagActive: {
    borderColor: '#C62828',
    backgroundColor: '#FFEBEE',
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  tagTextActive: {
    color: '#C62828',
    fontWeight: '600',
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FF8F00',
    fontWeight: '500',
  },
});

export default SkillAddModal;
