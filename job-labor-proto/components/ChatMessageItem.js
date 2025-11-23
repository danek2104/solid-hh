import React, { memo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles, theme } from '../AppStyles';

const ChatMessageItem = memo(({ message, profileData }) => {
  const isMyMessage =
    message.senderId === profileData?.id ||
    message.sender?.id === profileData?.id ||
    message.senderId === 1 ||
    message.sender?.id === 1 ||
    message.id?.toString().startsWith('temp-');

  return (
    <View
      style={[
        styles.chatMessage,
        isMyMessage ? styles.chatMessageMy : styles.chatMessageOther,
      ]}
    >
      <View
        style={[
          styles.chatMessageBubble,
          isMyMessage ? styles.chatMessageBubbleMy : styles.chatMessageBubbleOther,
        ]}
      >
        <Text
          style={[
            styles.chatMessageText,
            isMyMessage ? styles.chatMessageTextMy : styles.chatMessageTextOther,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.chatMessageTime,
            isMyMessage ? styles.chatMessageTimeMy : styles.chatMessageTimeOther,
          ]}
        >
          {message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : null}
        </Text>
      </View>
      {message.status === 'sending' && (
        <ActivityIndicator size="small" color={theme.muted} style={{ marginLeft: 8 }} />
      )}
    </View>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
