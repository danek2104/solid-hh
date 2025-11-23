import React from 'react';
import { ScrollView } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../AppStyles';

import ChatsScreen from '../../screens/ChatsScreen';

export default function Chats() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;

    const chats = [];
    const readinessChecklist = [];
    const sendMessageMutation = { isPending: false };

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
            <ChatsScreen
                isCompact={isCompact}
                isChatsLoading={false}
                chatsError={null}
                refetchChats={() => { }}
                chats={chats}
                handleOpenChat={() => { }}
                readinessChecklist={readinessChecklist}
                chatModalVisible={false}
                handleCloseChat={() => { }}
                width={width}
                selectedChatId={null}
                chatScrollViewRef={null}
                isMessagesLoading={false}
                messagesError={null}
                refetchMessages={() => { }}
                sortedMessages={[]}
                profileData={{}}
                newMessageText={""}
                setNewMessageText={() => { }}
                sendMessageMutation={sendMessageMutation}
                handleSendMessage={() => { }}
            />
        </ScrollView>
    );
}
