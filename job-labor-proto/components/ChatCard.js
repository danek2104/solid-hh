import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { styles } from '../AppStyles';

const ChatCard = memo(({ name, snippet, time, unread, status, compact }) => (
  <View style={[styles.chatCard, compact && styles.chatCardCompact]}>
    <View style={styles.chatAvatar}>
      <Text style={styles.chatAvatarText}>{name[0]}</Text>
    </View>
    <View style={styles.chatBody}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>{name}</Text>
        {time ? <Text style={styles.chatTime}>{time}</Text> : null}
      </View>
      {snippet ? <Text style={styles.chatSnippet}>{snippet}</Text> : null}
      {status && status.trim() && status.trim() !== '.' ? <Text style={styles.chatStatus}>{status}</Text> : null}
    </View>
    {unread > 0 && (
      <View style={styles.chatUnread}>
        <Text style={styles.chatUnreadText}>{unread}</Text>
      </View>
    )}
  </View>
));

ChatCard.displayName = 'ChatCard';

export default ChatCard;
