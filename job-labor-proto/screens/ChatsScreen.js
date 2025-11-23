import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, TextInput, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import Section from '../components/Section';
import ChatCard from '../components/ChatCard';
import ChatMessageItem from '../components/ChatMessageItem';
import { getErrorMessage } from '../utils/errorHandler';

const ChatsScreen = ({
    isCompact,
    isChatsLoading,
    chatsError,
    refetchChats,
    chats,
    handleOpenChat,
    readinessChecklist,
    chatModalVisible,
    handleCloseChat,
    width,
    selectedChatId,
    chatScrollViewRef,
    isMessagesLoading,
    messagesError,
    refetchMessages,
    sortedMessages,
    profileData,
    newMessageText,
    setNewMessageText,
    sendMessageMutation,
    handleSendMessage,
}) => (
    <>
        <Section title="Диалоги" compact={isCompact}>
            {isChatsLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Загрузка чатов...</Text>
                </View>
            ) : chatsError ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        {getErrorMessage(chatsError) || 'Не удалось загрузить чаты'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetchChats()}
                    >
                        <Text style={styles.retryButtonText}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            ) : chats.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.muted} />
                    <Text style={styles.emptyText}>У вас пока нет чатов</Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => String(item.id || item._id)}
                    renderItem={({ item: chat }) => (
                        <TouchableOpacity
                            onPress={() => handleOpenChat(chat.id || chat._id)}
                            activeOpacity={0.7}
                        >
                            <ChatCard
                                compact={isCompact}
                                name={chat.participant?.name || chat.name || 'Пользователь'}
                                snippet={chat.lastMessage?.text || chat.snippet || 'Нет сообщений'}
                                time={chat.lastMessage?.createdAt
                                    ? new Date(chat.lastMessage.createdAt).toLocaleTimeString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : (chat.time && chat.time.trim() ? chat.time : null)}
                                unread={chat.unreadCount || chat.unread || 0}
                                status={chat.status && chat.status.trim() && chat.status.trim() !== '.' ? chat.status : null}
                            />
                        </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </Section>

        <Section title="Напоминания" compact={isCompact}>
            {readinessChecklist.map((item) => (
                <View key={item} style={styles.checkItem}>
                    <View style={styles.checkBullet} />
                    <Text style={styles.checkText}>{item}</Text>
                </View>
            ))}
            <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Создать шаблон сообщения</Text>
            </TouchableOpacity>
        </Section>

        <Modal
            visible={chatModalVisible}
            animationType="slide"
            onRequestClose={handleCloseChat}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.chatModal, { maxWidth: Math.min(width, 400) }]}>
                    <View style={styles.chatModalHeader}>
                        <TouchableOpacity
                            style={styles.chatModalBackButton}
                            onPress={handleCloseChat}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={styles.chatModalHeaderInfo}>
                            <Text style={styles.chatModalTitle}>
                                {chats.find(c => (c.id || c._id) === selectedChatId)?.participant?.name ||
                                    chats.find(c => (c.id || c._id) === selectedChatId)?.name ||
                                    'Чат'}
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        ref={chatScrollViewRef}
                        style={styles.chatMessages}
                        contentContainerStyle={styles.chatMessagesContent}
                        onContentSizeChange={() => {
                            if (chatScrollViewRef.current) {
                                chatScrollViewRef.current.scrollToEnd({ animated: true });
                            }
                        }}
                    >
                        {isMessagesLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={styles.loadingText}>Загрузка сообщений...</Text>
                            </View>
                        ) : messagesError ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>
                                    {getErrorMessage(messagesError) || 'Не удалось загрузить сообщения'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => refetchMessages()}
                                >
                                    <Text style={styles.retryButtonText}>Повторить</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (() => {
                            if (sortedMessages.length === 0) {
                                return (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="chatbubble-outline" size={48} color={theme.muted} />
                                        <Text style={styles.emptyText}>Начните разговор</Text>
                                    </View>
                                );
                            }

                            return (
                                <FlatList
                                    data={sortedMessages}
                                    keyExtractor={(item) => String(item.id || item._id || `msg-${item.createdAt}-${Date.now()}`)}
                                    renderItem={({ item: message }) => (
                                        <ChatMessageItem message={message} profileData={profileData} />
                                    )}
                                    inverted={false}
                                    removeClippedSubviews={true}
                                    initialNumToRender={15}
                                    maxToRenderPerBatch={10}
                                    windowSize={10}
                                    onContentSizeChange={() => {
                                        if (chatScrollViewRef.current) {
                                            chatScrollViewRef.current.scrollToEnd({ animated: true });
                                        }
                                    }}
                                />
                            );
                        })()}
                    </ScrollView>

                    <View style={styles.chatInputContainer}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Введите сообщение..."
                            placeholderTextColor={theme.muted}
                            value={newMessageText}
                            onChangeText={setNewMessageText}
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity
                            style={[
                                styles.chatSendButton,
                                (!newMessageText.trim() || sendMessageMutation.isPending) &&
                                styles.chatSendButtonDisabled,
                            ]}
                            onPress={handleSendMessage}
                            disabled={!newMessageText.trim() || sendMessageMutation.isPending}
                        >
                            {sendMessageMutation.isPending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    </>
);

export default ChatsScreen;
