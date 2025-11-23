import React, { useContext, useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../AppStyles';

import ChatsScreen from '../../screens/ChatsScreen';
import AuthContext from '../../context/AuthContext';
import { useChatsQuery, useMessagesSimpleQuery, useSendMessage } from '../../hooks/useChats';
import { useProfileQuery } from '../../hooks/useProfile';

export default function Chats() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const { token } = useContext(AuthContext);

    const [selectedChatId, setSelectedChatId] = useState(null);
    const [chatModalVisible, setChatModalVisible] = useState(false);
    const [newMessageText, setNewMessageText] = useState('');
    const chatScrollViewRef = useRef(null);

    // Data Fetching
    const {
        data: chatsData,
        isLoading: isChatsLoading,
        error: chatsError,
        refetch: refetchChats
    } = useChatsQuery({}, token);

    const {
        data: messagesData,
        isLoading: isMessagesLoading,
        error: messagesError,
        refetch: refetchMessages
    } = useMessagesSimpleQuery(selectedChatId, token);

    const { data: profileData } = useProfileQuery(token);

    const sendMessageMutation = useSendMessage(token);

    // Correctly extract chats array
    const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
    
    // Ensure messages are an array
    const messages = Array.isArray(messagesData) ? messagesData : (messagesData?.messages || []);
    
    // Sort messages: oldest first for chat view? Usually list is bottom-up or top-down
    // ChatMessageItem usually expects chronological order if not inverted list
    // Let's assume chronological (oldest -> newest) for FlatList without inverted prop,
    // or newest -> oldest with inverted.
    // backend returns 'desc' (newest first).
    // FlatList in ChatsScreen is `inverted={false}`? Let's check ChatsScreen.
    // ChatsScreen uses `inverted={false}` so we need oldest first?
    // Or better, let's reverse them if they are desc.
    const sortedMessages = [...messages].reverse(); 

    const readinessChecklist = [
        'Уточните адрес и время',
        'Спросите про форму одежды',
        'Узнайте контактное лицо'
    ];

    // Handlers
    const handleOpenChat = (chatId) => {
        setSelectedChatId(chatId);
        setChatModalVisible(true);
    };

    const handleCloseChat = () => {
        setChatModalVisible(false);
        setSelectedChatId(null);
    };

    const handleSendMessage = async () => {
        if (!newMessageText.trim() || !selectedChatId) return;
        
        try {
            const senderId = profileData?.profile?.id || profileData?.id;
            await sendMessageMutation.mutateAsync({
                chatId: selectedChatId,
                text: newMessageText.trim(),
                senderId: senderId
            });
            setNewMessageText('');
            refetchMessages(); // Refresh to see new message (optimistic update handles it too usually)
        } catch (error) {
            console.error('Send message failed', error);
        }
    };

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
                        <Text style={styles.heroLabel}>Сообщения</Text>
                        <Text style={styles.heroTitle}>Диалоги</Text>
                        <Text style={styles.heroSubtitle}>Связь с работодателями и поддержкой</Text>
                    </View>
                </View>
            </LinearGradient>
            <ChatsScreen
                isCompact={isCompact}
                isChatsLoading={isChatsLoading}
                chatsError={chatsError}
                refetchChats={refetchChats}
                chats={chats}
                handleOpenChat={handleOpenChat}
                readinessChecklist={readinessChecklist}
                chatModalVisible={chatModalVisible}
                handleCloseChat={handleCloseChat}
                width={width}
                selectedChatId={selectedChatId}
                chatScrollViewRef={chatScrollViewRef}
                isMessagesLoading={isMessagesLoading}
                messagesError={messagesError}
                refetchMessages={refetchMessages}
                sortedMessages={sortedMessages}
                profileData={profileData?.profile || profileData}
                newMessageText={newMessageText}
                setNewMessageText={setNewMessageText}
                sendMessageMutation={sendMessageMutation}
                handleSendMessage={handleSendMessage}
            />
        </ScrollView>
    );
}
