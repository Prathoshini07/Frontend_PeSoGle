import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Send, ArrowUp, MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { postService, Comment, Answer } from '@/services/postService';
import type { Post } from '@/mocks/posts';
import PostCard from '@/components/PostCard';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [inputContent, setInputContent] = useState('');

    // Lists for depending on type
    const [comments, setComments] = useState<Comment[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);

    useEffect(() => {
        if (!id) return;
        const fetchPostDetails = async () => {
            setLoading(true);
            try {
                const pRes = await postService.getPostById(id);
                if (pRes.success) {
                    setPost(pRes.data);

                    if (pRes.data.type === 'QUESTION') {
                        const aRes = await postService.getAnswers(id);
                        if (aRes.success) setAnswers(aRes.data);
                    } else {
                        const cRes = await postService.getComments(pRes.data.type, id);
                        if (cRes.success) setComments(cRes.data);
                    }
                }
            } catch (err) {
                console.log('[PostDetail] Failed to fetch:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPostDetails();
    }, [id]);

    const handleSubmit = async () => {
        if (!inputContent.trim() || !post) return;
        try {
            if (post.type === 'QUESTION') {
                const res = await postService.addAnswer(post.id, inputContent.trim());
                if (res.success) {
                    setAnswers(prev => [...prev, res.data]);
                }
            } else {
                const res = await postService.addComment(post.type, post.id, inputContent.trim());
                if (res.success) {
                    setComments(prev => [...prev, res.data]);
                }
            }
            setInputContent('');
        } catch (err) {
            console.log('[PostDetail] Failed to post reply:', err);
        }
    };

    const renderComment = (item: Comment) => (
        <View key={item.comment_id} style={styles.replyCard}>
            <View style={styles.replyHeader}>
                <Image 
                    source={{ uri: item.author_avatar || `https://ui-avatars.com/api/?name=${item.author_name || 'U'}&background=random` }} 
                    style={styles.replyAvatar} 
                />
                <View>
                    <Text style={styles.replyAuthor}>{item.author_name || `User ${item.author_id.substring(0, 8)}`}</Text>
                    <Text style={styles.replyMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
            <Text style={styles.replyContent}>{item.content}</Text>
        </View>
    );

    const renderAnswer = (item: Answer) => (
        <View key={item.answer_id} style={[styles.replyCard, item.is_accepted && styles.acceptedAnswer]}>
            <View style={styles.answerHeaderRow}>
                <View style={styles.replyHeader}>
                    <Image 
                        source={{ uri: item.author_avatar || `https://ui-avatars.com/api/?name=${item.author_name || 'U'}&background=random` }} 
                        style={styles.replyAvatar} 
                    />
                    <View>
                        <Text style={styles.replyAuthor}>{item.author_name || `User ${item.author_id.substring(0, 8)}`}</Text>
                        <Text style={styles.replyMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.upvoteRow}>
                    <ArrowUp size={14} color={Colors.textSecondary} />
                    <Text style={styles.replyMeta}>{item.upvote_count}</Text>
                </View>
            </View>
            <Text style={styles.replyContent}>{item.content}</Text>
            {item.is_accepted && <Text style={styles.acceptedLabel}>✓ Accepted Answer</Text>}
        </View>
    );


    if (loading || !post) {
        return (
            <View style={styles.centerContainer}>
                <Stack.Screen options={{ title: 'Loading...' }} />
                <ActivityIndicator size="large" color={Colors.primaryDark} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: post.title.substring(0, 20) + '...' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <PostCard post={post} isDetailed={true} />

                <View style={styles.discussionHeader}>
                    <MessageSquare size={18} color={Colors.primaryDark} />
                    <Text style={styles.discussionTitle}>
                        {post.type === 'QUESTION' ? 'Answers' : 'Comments'}
                    </Text>
                </View>

                {post.type === 'QUESTION' ? (
                    answers.length > 0 ? answers.map(renderAnswer) : <Text style={styles.emptyText}>No answers yet. Be the first!</Text>
                ) : (
                    comments.length > 0 ? comments.map(renderComment) : <Text style={styles.emptyText}>No comments yet.</Text>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={post.type === 'QUESTION' ? "Write your answer..." : "Add a comment..."}
                    value={inputContent}
                    onChangeText={setInputContent}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit} disabled={!inputContent.trim()}>
                    <Send size={20} color={inputContent.trim() ? Colors.white : Colors.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primaryBg,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.primaryBg,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    discussionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    discussionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: Colors.primaryDark,
    },
    emptyText: {
        color: Colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    replyCard: {
        backgroundColor: Colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    replyAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.borderLight,
    },
    replyAuthor: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: Colors.primaryDark,
    },
    acceptedAnswer: {

        borderColor: Colors.success,
        borderWidth: 2,
    },
    answerHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    upvoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    replyMeta: {
        fontSize: fontSize.xs,
        color: Colors.textMuted,
        marginBottom: spacing.xs,
    },
    replyContent: {
        fontSize: fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    acceptedLabel: {
        color: Colors.success,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        marginTop: spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        backgroundColor: Colors.primaryBg,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        marginRight: spacing.sm,
        color: Colors.textPrimary,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
