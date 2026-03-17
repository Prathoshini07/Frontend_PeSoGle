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

  const { messages: wsMessages, sendMessage: sendWsMessage, isConnected } = useChatWebSocket(userId);

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
        read: ws.read
      }));

    if (newWsMsgs.length > 0) {
      setMessages(prev => {
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

  const handleBlock = useCallback(() => {
    const blockUser = async () => {
      try {
        const res = await connectService.blockUser(chatId);
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
// ... [Styles remain the same as your master branch]