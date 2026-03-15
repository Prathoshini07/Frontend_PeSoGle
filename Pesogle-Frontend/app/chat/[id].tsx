import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Lock, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { chatService, formatTime, type ChatMessage } from '@/services/chatService';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { profileService } from '@/services/profileService';

export default function ChatScreen() {
  const router = useRouter();
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
  const flatListRef = useRef<FlatList>(null);

  const { messages: wsMessages, sendMessage: sendWsMessage, isConnected } = useChatWebSocket(userId);

  // Fetch user ID and initial messages
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

  // Append incoming WebSocket messages
  useEffect(() => {
    const newWsMsgs = wsMessages
      .filter(ws => ws.chat_id === chatId)
      .map(ws => ({
        id: ws._id,
        senderId: ws.sender_id,
        senderName: ws.sender_name,
        text: ws.text,
        timestamp: formatTime(ws.timestamp),
        read: ws.read
      }));

    if (newWsMsgs.length > 0) {
      setMessages(prev => {
        // Simple de-duplication
        const existingIds = new Set(prev.map(m => m.id));
        const filtered = newWsMsgs.filter(m => !existingIds.has(m.id));
        if (filtered.length === 0) return prev;
        return [...prev, ...filtered];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [wsMessages, chatId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !isConnected) return;
    
    sendWsMessage(chatId, inputText.trim());
    setInputText('');
  }, [inputText, chatId, isConnected, sendWsMessage]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && item.senderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
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
          headerRight: () => type === 'group' ? (
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/chat/group-info' as any, 
                params: { id: chatId, name, ownerId, participants, admins } 
              })}
              style={{ marginRight: spacing.sm }}
            >
              <Info size={22} color={Colors.white} />
            </TouchableOpacity>
          ) : null,
        }}
      />
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
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
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
});
