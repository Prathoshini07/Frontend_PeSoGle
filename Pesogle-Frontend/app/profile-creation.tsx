import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { User, Layers, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import TagChip from '@/components/TagChip';
import { useAuth } from '@/context/AuthContext';
import { domains, skillsList } from '@/mocks/users';

const STEPS = [
  { icon: User, label: 'Basic Info' },
  { icon: Layers, label: 'Expertise' },
  { icon: Target, label: 'Goals' },
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD', 'Faculty'];
const departments = [
  'Computer Science', 'Data Science', 'Software Engineering',
  'Electrical Engineering', 'Mechanical Engineering', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Business Administration',
];

export default function ProfileCreationScreen() {
  const router = useRouter();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projectInput, setProjectInput] = useState('');
  const [projects, setProjects] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  const toggleDomain = useCallback((domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  }, []);

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }, []);

  const addProject = useCallback(() => {
    if (projectInput.trim()) {
      setProjects(prev => [...prev, projectInput.trim()]);
      setProjectInput('');
    }
  }, [projectInput]);

  const addGoal = useCallback(() => {
    if (goalInput.trim()) {
      setGoals(prev => [...prev, goalInput.trim()]);
      setGoalInput('');
    }
  }, [goalInput]);

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeProfile();
      router.replace('/(tabs)/home' as any);
    }
  }, [step, completeProfile, router]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const canProceed = step === 0
    ? name.trim() && department && year
    : step === 1
    ? selectedDomains.length > 0 && selectedSkills.length > 0
    : true;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.progressArea}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
          </View>
          <View style={styles.stepsRow}>
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <View key={i} style={styles.stepItem}>
                  <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
                    <StepIcon size={16} color={i <= step ? Colors.white : Colors.textMuted} />
                  </View>
                  <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>
              <InputField label="Full Name" placeholder="Enter your full name" value={name} onChangeText={setName} testID="name-input" />
              <Text style={styles.sectionLabel}>Department</Text>
              <View style={styles.chipsWrap}>
                {departments.map(dept => (
                  <TagChip key={dept} label={dept} selected={department === dept} onPress={() => setDepartment(dept)} />
                ))}
              </View>
              <Text style={styles.sectionLabel}>Year</Text>
              <View style={styles.chipsWrap}>
                {years.map(y => (
                  <TagChip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTitle}>Your Expertise</Text>
              <Text style={styles.stepSubtitle}>Select your domains and skills for better matching</Text>
              <Text style={styles.sectionLabel}>Domains of Interest</Text>
              <View style={styles.chipsWrap}>
                {domains.map(domain => (
                  <TagChip key={domain} label={domain} selected={selectedDomains.includes(domain)} onPress={() => toggleDomain(domain)} />
                ))}
              </View>
              <Text style={styles.sectionLabel}>Technical Skills</Text>
              <View style={styles.chipsWrap}>
                {skillsList.slice(0, 20).map(skill => (
                  <TagChip key={skill} label={skill} selected={selectedSkills.includes(skill)} onPress={() => toggleSkill(skill)} />
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTitle}>Projects & Goals</Text>
              <Text style={styles.stepSubtitle}>Share what you're working on and aiming for</Text>
              <InputField
                label="Add Project"
                placeholder="e.g. AI Study Planner"
                value={projectInput}
                onChangeText={setProjectInput}
                onSubmitEditing={addProject}
                returnKeyType="done"
              />
              {projects.length > 0 && (
                <View style={styles.chipsWrap}>
                  {projects.map(p => (
                    <TagChip key={p} label={p} selected onPress={() => setProjects(prev => prev.filter(x => x !== p))} />
                  ))}
                </View>
              )}
              <InputField
                label="Add Goal"
                placeholder="e.g. Publish research paper"
                value={goalInput}
                onChangeText={setGoalInput}
                onSubmitEditing={addGoal}
                returnKeyType="done"
              />
              {goals.length > 0 && (
                <View style={styles.chipsWrap}>
                  {goals.map(g => (
                    <TagChip key={g} label={g} selected onPress={() => setGoals(prev => prev.filter(x => x !== g))} />
                  ))}
                </View>
              )}
              <InputField
                label="Short Academic Bio"
                placeholder="Tell us about your academic journey..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          {step > 0 && (
            <SecondaryButton title="Back" onPress={handleBack} style={styles.backBtn} />
          )}
          <PrimaryButton
            title={step === 2 ? 'Complete Profile' : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    paddingTop: spacing.xxxxl + spacing.lg,
  },
  progressArea: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primaryDark,
  },
  stepLabel: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  stepLabelActive: {
    color: Colors.primaryDark,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  stepCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadow.sm,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    backgroundColor: Colors.primaryBg,
  },
  backBtn: {
    flex: 0.4,
  },
  nextBtn: {
    flex: 1,
  },
});
