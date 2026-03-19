import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Lock, Info, MoreVertical } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing, shadow } from '@/constants/theme';
import { chatService, formatTime, type ChatMessage } from '@/services/chatService';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { profileService } from '@/services/profileService';
import { connectService } from '@/services/connectService';

export default function ChatScreen() {
  const router = useRouter();
  // Merged params from both branches
  const { id: chatId, name, type, ownerId, participants, admins } = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    type?: string; 
    ownerId?: string; 
    participants?: string;
    admins?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string>();
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages: wsMessages, sendMessage: sendWsMessage, isConnected, lastWsError } = useChatWebSocket(userId);

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [profile, history] = await Promise.all([
          profileService.getProfile(),
          chatService.getMessages(chatId)
        ]);
        setUserId(profile.user_id);
        if (history.success) {
          setMessages(history.data);
        }
      } catch (error) {
        console.error('[ChatScreen] Initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [chatId]);

  // WebSocket Sync
  useEffect(() => {
    const newWsMsgs = wsMessages
      .filter(ws => ws.chat_id === chatId)
      .map(ws => ({
        id: ws._id,
        senderId: ws.sender_id,
        senderName: ws.sender_name,
        text: ws.text,
        timestamp: formatTime(ws.timestamp),
        readBy: ws.read ? [ws.sender_id] : []
      }));

    if (newWsMsgs.length > 0) {
      setMessages(prev => {
        // 1. Filter out existing server messages (by ID)
        const serverIds = new Set(prev.filter(m => !m.id.startsWith('local-')).map(m => m.id));
        const filteredNew = newWsMsgs.filter(m => !serverIds.has(m.id));
        
        if (filteredNew.length === 0) return prev;

        // 2. Clear out redundant "local-" messages that match new incoming ones
        // A match is: same senderId and same text content
        let nextMessages = [...prev];
        filteredNew.forEach(serverMsg => {
          const localIndex = nextMessages.findIndex(m => 
            m.id.startsWith('local-') && 
            m.senderId === serverMsg.senderId && 
            m.text === serverMsg.text
          );
          if (localIndex !== -1) {
            nextMessages.splice(localIndex, 1);
          }
        });

        return [...nextMessages, ...filteredNew];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [wsMessages, chatId]);

  // WebSocket Error Handling
  useEffect(() => {
    if (lastWsError && lastWsError.error === 'Blocked') {
      const msg = "Cannot text a blocked user. Unblock them to continue.";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Blocked', msg);
      
      // Rollback the optimistic message
      setMessages(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].id.startsWith('local-')) {
            next.splice(i, 1);
            break;
          }
        }
        return next;
      });
    }
  }, [lastWsError]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    // Optimistic UI: show immediately.
    const localSenderId = userId ?? 'me';
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        senderId: localSenderId,
        senderName: 'You',
        text,
        timestamp: formatTime(new Date().toISOString()),
        readBy: [localSenderId],
      },
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    if (isConnected) {
      sendWsMessage(chatId, text);
    } else {
      console.warn('[ChatScreen] WebSocket not connected; message not sent to server.');
      const msg = 'Not connected. Message not sent.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Connection', msg);
    }

    setInputText('');
  }, [inputText, chatId, isConnected, sendWsMessage, userId]);

  const handleBlock = useCallback(() => {
    const blockUser = async () => {
      try {
        let otherUserId = chatId;
        if (participants && userId) {
          try {
            const parsed = JSON.parse(participants);
            const found = parsed.find((id: string) => id !== userId);
            if (found) otherUserId = found;
          } catch (e) {}
        }

        const res = await connectService.blockUser(otherUserId);
        if (res.success) {
          const msg = 'User has been blocked.';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Success', msg);
          router.back();
        }
      } catch (error) {
        const msg = 'Failed to block user.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to block ${name}?`)) blockUser();
    } else {
      Alert.alert('Block User', `Are you sure you want to block ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: blockUser },
      ]);
    }
  }, [chatId, name, router]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && item.senderName && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>{item.timestamp}</Text>
        </View>
      </View>
    );
  }, [userId]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen
        options={{
          title: name || 'Chat',
          headerStyle: { backgroundColor: Colors.primaryDark },
          headerTintColor: Colors.white,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {type === 'group' ? (
                // Group Info Icon
                <TouchableOpacity 
                  onPress={() => router.push({ 
                    pathname: '/chat/group-info' as any, 
                    params: { id: chatId, name, ownerId, participants, admins } 
                  })}
                  style={{ marginRight: spacing.sm }}
                >
                  <Info size={22} color={Colors.white} />
                </TouchableOpacity>
              ) : (
                // Direct Message Block Menu
                <View>
                  <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ marginRight: spacing.sm }}>
                    <MoreVertical size={24} color={Colors.white} />
                  </TouchableOpacity>
                  {showMenu && (
                    <View style={styles.menuContainer}>
                      <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => { setShowMenu(false); handleBlock(); }}
                      >
                        <Text style={styles.menuItemText}>Block User</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          ),
        }}
      />
      
      {showMenu && <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setShowMenu(false)} />}

      <View style={styles.encryptedBanner}>
        <Lock size={12} color={Colors.textMuted} />
        <Text style={styles.encryptedText}>
          {isConnected ? 'Messages are end-to-end encrypted' : 'Connecting...'}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || !isConnected) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || !isConnected}
        >
          <Send size={20} color={inputText.trim() && isConnected ? Colors.white : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  encryptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.borderLight,
  },
  encryptedText: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  msgRow: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  msgRowMe: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bubbleOther: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: Colors.primaryDark,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: Colors.white,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  timestampMe: {
    color: Colors.white + '80',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.borderLight,
  },
  menuContainer: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    width: 140,
    ...Platform.select({
      ios: shadow.md,
      android: shadow.md,
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      } as any
    }),

    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuItem: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  menuItemText: {
    color: Colors.error || '#FF4B4B',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});