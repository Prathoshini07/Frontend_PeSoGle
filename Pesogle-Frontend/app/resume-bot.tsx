import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Upload, FileText, AlertTriangle, CheckCircle, Lightbulb, ChevronRight } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import apiClient from '@/services/api';

export default function ResumeBotScreen() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setLoading(true);
      const file = result.assets[0];

      // Create form data for upload
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // On Web, we need to convert the URI to a Blob
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      } else {
        // On Mobile, use the object format compatible with axios/FormData
        // @ts-ignore
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }

      const stored = await AsyncStorage.getItem('pesogle_auth');
      let token = 'dev_override_token';
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          token = parsed.token;
        }
      }

      const response = await fetch(`${apiClient.defaults.baseURL}/resume-bot/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorData: any = await response.text();
        try { errorData = JSON.parse(errorData); } catch (e) {}
        throw new Error(errorData?.detail || errorData?.message || `HTTP error ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Analysis response:', responseData);
      setAnalysis(responseData);
    } catch (error: any) {
      console.error('Upload error details:', error.message);
      Alert.alert('Upload Failed', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setAnalysis(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Resume Bot',
          headerStyle: { backgroundColor: Colors.primaryBg },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!analysis ? (
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}>
              {loading ? (
                 <ActivityIndicator size="large" color={Colors.primaryDark} />
              ) : (
                <Upload size={40} color={Colors.primaryDark} />
              )}
            </View>
            <Text style={styles.uploadTitle}>{loading ? 'Analyzing...' : 'Upload Your Resume'}</Text>
            <Text style={styles.uploadSubtitle}>
              {loading 
                ? 'Please wait while our AI scans your resume for skills and opportunities.' 
                : 'Our AI will analyze your resume and provide personalized improvement suggestions'}
            </Text>
            
            {!loading && (
              <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
                <FileText size={20} color={Colors.white} />
                <Text style={styles.uploadBtnText}>Choose File</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.uploadHint}>Supports PDF, DOCX (Max 5MB)</Text>
          </View>
        ) : (
          <>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Resume Score</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{analysis.score}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <Text style={styles.scoreMessage}>{analysis.score_message}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={18} color={Colors.success} />
                <Text style={styles.sectionTitle}>Detected Skills</Text>
              </View>
              <View style={styles.skillsWrap}>
                {analysis.detected_skills?.map((skill: string) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
                {(!analysis.detected_skills || analysis.detected_skills.length === 0) && (
                  <Text style={styles.emptyText}>No skills detected</Text>
                )}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={18} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Missing Skills</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Recommended for your profile</Text>
              <View style={styles.skillsWrap}>
                {analysis.missing_skills?.map((skill: string) => (
                  <View key={skill} style={styles.missingTag}>
                    <Text style={styles.missingTagText}>{skill}</Text>
                  </View>
                ))}
                {(!analysis.missing_skills || analysis.missing_skills.length === 0) && (
                  <Text style={styles.emptyText}>Looking good! No critical missing skills found.</Text>
                )}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={18} color={Colors.primaryDark} />
                <Text style={styles.sectionTitle}>Improvement Tips</Text>
              </View>
              {analysis.improvement_tips?.map((suggestion: string, index: number) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionNumber}>
                    <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
              {(!analysis.improvement_tips || analysis.improvement_tips.length === 0) && (
                <Text style={styles.emptyText}>No specific tips at this time.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.reuploadBtn} onPress={reset}>
              <Upload size={16} color={Colors.accent} />
              <Text style={styles.reuploadText}>Upload Different Resume</Text>
            </TouchableOpacity>
          </>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  uploadArea: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: spacing.xxxl,
    marginTop: spacing.xxl,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  uploadTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.sm,
  },
  uploadSubtitle: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  uploadBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.white,
  },
  uploadHint: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: spacing.md,
  },
  scoreCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreLabel: {
    fontSize: fontSize.sm,
    color: Colors.white + 'AA',
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: fontWeight.heavy,
    color: Colors.white,
  },
  scoreMax: {
    fontSize: fontSize.xl,
    color: Colors.white + '80',
    fontWeight: fontWeight.medium,
  },
  scoreMessage: {
    fontSize: fontSize.sm,
    color: Colors.white + 'CC',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginBottom: spacing.md,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  skillTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.success,
  },
  missingTag: {
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  missingTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.accent,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  suggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  suggestionText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  reuploadText: {
    fontSize: fontSize.md,
    color: Colors.accent,
    fontWeight: fontWeight.semibold,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
