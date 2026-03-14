import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Lock, MoreVertical } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing, shadow } from '@/constants/theme';
import { mockMessages, type ChatMessage } from '@/services/chatService';
import { connectService } from '@/services/connectService';


export default function ChatScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);


  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: 'm' + Date.now(),
      senderId: 'current',
      text: inputText.trim(),
      timestamp: 'Just now',
      read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === 'current';
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>{item.timestamp}</Text>
        </View>
      </View>
    );
  }, []);

  const handleBlock = useCallback(() => {
    const blockUser = async () => {
      try {
        const res = await connectService.blockUser(id);
        if (res.success) {
          if (Platform.OS === 'web') alert('User has been blocked.');
          else Alert.alert('Success', 'User has been blocked.');
          router.back();
        }
      } catch (error) {
        if (Platform.OS === 'web') alert('Failed to block user.');
        else Alert.alert('Error', 'Failed to block user.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to block ${name}?`)) {
        blockUser();
      }
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: blockUser },
        ]
      );
    }
  }, [id, name, router]);


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen
        options={{
          title: name || 'Chat',
          headerStyle: { backgroundColor: Colors.primaryDark },
          headerTintColor: Colors.white,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ marginRight: spacing.sm }}>
                <MoreVertical size={24} color={Colors.white} />
              </TouchableOpacity>
              
              {showMenu && (
                <View style={styles.menuContainer}>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setShowMenu(false);
                      handleBlock();
                    }}
                  >
                    <Text style={styles.menuItemText}>Block User</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ),
        }}
      />
      {showMenu && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={StyleSheet.absoluteFill} 
          onPress={() => setShowMenu(false)}
        />
      )}


      <View style={styles.encryptedBanner}>
        <Lock size={12} color={Colors.textMuted} />
        <Text style={styles.encryptedText}>Messages are end-to-end encrypted</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />
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
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? Colors.white : Colors.textMuted} />
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

