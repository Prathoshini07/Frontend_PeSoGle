import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ImagePlus, X, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { postService, CreatePostData } from '@/services/postService';
import { categories } from '@/mocks/posts'; // Contains things like 'Academics', 'Career', etc.

export default function ComposePostScreen() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsString, setTagsString] = useState('');
    const [selectedType, setSelectedType] = useState('POST');
    const [selectedCategory, setSelectedCategory] = useState(categories[1] || 'General'); // Default to first proper category

    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const postTypes = [
        { id: 'POST', label: 'Discussion' },
        { id: 'BLOG', label: 'Blog' },
        { id: 'QUESTION', label: 'Question' }
    ];

    // Map frontend display labels to strict backend enum values
    const categoryMap: Record<string, string> = {
        'Academics': 'GENERAL',
        'Career': 'PLACEMENTS',
        'Campus Life': 'GENERAL',
        'Alumni': 'GENERAL',
        'AI_ML': 'AI_ML',
        'DSA': 'DSA',
        'WEB_DEV': 'WEB_DEV',
        'APP_DEV': 'APP_DEV',
        'SYSTEMS': 'SYSTEMS',
        'DATA_SCIENCE': 'DATA_SCIENCE',
        'CYBER_SECURITY': 'CYBER_SECURITY',
        'PLACEMENTS': 'PLACEMENTS',
        'RESEARCH': 'RESEARCH',
        'PROJECTS': 'PROJECTS',
        'GENERAL': 'GENERAL'
    };

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setMediaUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Missing Fields', 'Please provide a title and content for your post.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Resolve category to backend ENUM
            const finalCategory = categoryMap[selectedCategory] || 'GENERAL';

            const data: CreatePostData = {
                type: selectedType,
                title: title.trim(),
                content: content.trim(),
                category: finalCategory,
                tags: tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)
            };

            const response = await postService.createPost(data);

            if (response.success && response.data) {
                // If image was selected, attempt to upload
                if (mediaUri) {
                    const file = {
                        uri: mediaUri,
                        name: mediaUri.split('/').pop() || 'upload.jpg',
                        type: 'image/jpeg'
                    };
                    try {
                        await postService.uploadMedia(response.data.id, [file]);
                    } catch (mErr) {
                        console.warn('[Compose] Failed to upload media:', mErr);
                        // Non blocking error, post still created
                    }
                }

                // Go back and refresh list implicitly
                router.back();
            } else {
                Alert.alert('Error', 'Failed to create post. Try again.');
            }
        } catch (error) {
            console.log('[Compose] Create post error:', error);
            Alert.alert('Error', 'An unexpected error occurred while posting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'New Post',
                    headerRight: () => (
                        <TouchableOpacity
                            style={[styles.submitBtn, (!title.trim() || !content.trim()) && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.submitText}>Post</Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView contentContainerStyle={styles.formContainer}>
                {/* Type Selector */}
                <Text style={styles.label}>Post Type</Text>
                <View style={styles.typeSelector}>
                    {postTypes.map(pt => (
                        <TouchableOpacity
                            key={pt.id}
                            style={[styles.typeOption, selectedType === pt.id && styles.typeOptionActive]}
                            onPress={() => setSelectedType(pt.id)}
                        >
                            <Text style={[styles.typeText, selectedType === pt.id && styles.typeTextActive]}>{pt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Category Selector */}
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
                    {categories.filter(c => c !== 'All').map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.catOption, selectedCategory === cat && styles.catOptionActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.divider} />

                {/* Title & Content */}
                <TextInput
                    style={styles.inputTitle}
                    placeholder="An interesting title"
                    placeholderTextColor={Colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                <TextInput
                    style={styles.inputContent}
                    placeholder={selectedType === 'QUESTION' ? "What's on your mind? Describe your problem here..." : "What do you want to share?"}
                    placeholderTextColor={Colors.textMuted}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />

                <TextInput
                    style={styles.inputTags}
                    placeholder="Tags (comma separated, e.g. React, UI, Help)"
                    placeholderTextColor={Colors.textMuted}
                    value={tagsString}
                    onChangeText={setTagsString}
                />

                {/* Media Preview & Picker */}
                {mediaUri ? (
                    <View style={styles.mediaContainer}>
                        <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
                        <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMediaUri(null)}>
                            <X size={16} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                        <ImagePlus size={24} color={Colors.textSecondary} />
                        <Text style={styles.attachText}>Add Image</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primaryBg,
    },
    formContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    submitBtn: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitText: {
        color: Colors.white,
        fontWeight: fontWeight.bold,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: Colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    typeOption: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: borderRadius.sm,
    },
    typeOptionActive: {
        backgroundColor: Colors.primaryDark,
        borderColor: Colors.primaryDark,
    },
    typeText: {
        fontSize: fontSize.sm,
        color: Colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    typeTextActive: {
        color: Colors.white,
    },
    categoryScroll: {
        maxHeight: 40,
    },
    categoryContent: {
        gap: spacing.sm,
    },
    catOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
    },
    catOptionActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    catText: {
        fontSize: fontSize.sm,
        color: Colors.textSecondary,
    },
    catTextActive: {
        color: Colors.white,
        fontWeight: fontWeight.bold,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.borderLight,
        marginVertical: spacing.lg,
    },
    inputTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: spacing.md,
    },
    inputContent: {
        fontSize: fontSize.md,
        color: Colors.textPrimary,
        minHeight: 150,
        marginBottom: spacing.lg,
    },
    inputTags: {
        fontSize: fontSize.sm,
        color: Colors.textPrimary,
        marginBottom: spacing.lg,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderStyle: 'dashed',
        borderRadius: borderRadius.md,
        justifyContent: 'center',
    },
    attachText: {
        fontSize: fontSize.md,
        color: Colors.textSecondary,
    },
    mediaContainer: {
        position: 'relative',
        marginTop: spacing.md,
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.md,
        backgroundColor: Colors.card,
    },
    removeMediaBtn: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
