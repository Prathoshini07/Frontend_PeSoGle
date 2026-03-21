import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
// @ts-expect-error - expo-router exports useRouter at runtime; types may be out of sync
import { useRouter, Stack } from 'expo-router';
import { User, Layers, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import TagChip from '@/components/TagChip';
import { useAuth } from '@/context/AuthContext';
import { domains, skillsList } from '@/mocks/users';
import { profileService, type ProfileCreateRequest, type ProfileResponse, type Degree, type Project, type Experience } from '@/services/profileService';

const STEPS = [
  { icon: User, label: 'Basic Info' },
  { icon: Layers, label: 'Expertise' },
  { icon: Target, label: 'Goals' },
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD', 'Faculty'];
const departments = [
  'Computer Science', 'AI and ML', 'IT', 'ECE',
  'EEE', 'CSE', 'MCA',
  'Physics', 'Chemistry', 'Biology', 'Business Administration', 'AMCS',
  'Civil Engineering', 'Chemical Engineering', 'Electronics and Communication Engineering',
  'Mechanical Engineering', 'Production Engineering',
];

const degrees: Degree[] = ['B.Tech', 'M.Sc', 'M.Tech', 'PhD'];

export default function ProfileCreationScreen() {
  const router = useRouter();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState<Degree | ''>('');
  const [department, setDepartment] = useState('');
  const [academicBatch, setAcademicBatch] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projectInput, setProjectInput] = useState('');
  const [projectRole, setProjectRole] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [experienceCompany, setExperienceCompany] = useState('');
  const [experienceRole, setExperienceRole] = useState('');
  const [experienceDuration, setExperienceDuration] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
    if (projectInput.trim() && projectRole.trim()) {
      const newProject: Project = {
        title: projectInput.trim(),
        description: projectDescription.trim() || null,
        tech_stack: projectTechStack
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        role: projectRole.trim(),
      };
      setProjects(prev => [...prev, newProject]);
      setProjectInput('');
      setProjectRole('');
      setProjectDescription('');
      setProjectTechStack('');
    }
  }, [projectInput, projectRole, projectDescription, projectTechStack]);

  const addExperience = useCallback(() => {
    if (experienceCompany.trim() && experienceRole.trim() && experienceDuration.trim()) {
      const newExperience: Experience = {
        company: experienceCompany.trim(),
        role: experienceRole.trim(),
        duration: experienceDuration.trim(),
      };
      setExperiences(prev => [...prev, newExperience]);
      setExperienceCompany('');
      setExperienceRole('');
      setExperienceDuration('');
    }
  }, [experienceCompany, experienceRole, experienceDuration]);

  const addGoal = useCallback(() => {
    if (goalInput.trim()) {
      setGoals(prev => [...prev, goalInput.trim()]);
      setGoalInput('');
    }
  }, [goalInput]);

  useEffect(() => {
    let isMounted = true;
    const loadExistingProfile = async () => {
      try {
        const existing = await profileService.getProfile();
        if (!isMounted) return;

        setIsEditMode(true);
        setName(existing.personal_info.full_name);
        setInstitution(existing.personal_info.institution);
        setDegree(existing.personal_info.degree);
        setDepartment(existing.personal_info.branch_or_domain[0] ?? '');
        setAcademicBatch(String(existing.personal_info.academic_batch));
        setSelectedSkills(existing.skills_and_interests.skills);
        setSelectedDomains(existing.skills_and_interests.interests);
        setProjects(existing.projects);
        setExperiences(existing.experience);
        setGoals(existing.goals || []);
        setBio(existing.bio || '');
      } catch (e) {
        console.log('[ProfileCreation] No existing profile or failed to load, creating new.', e);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadExistingProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = async () => {
    if (step < 2) {
      setStep(prev => prev + 1);
      return;
    }

    if (!canProceed || isSubmitting) {
      return;
    }

    const parsedBatch = parseInt(academicBatch, 10);
    if (Number.isNaN(parsedBatch)) {
      Alert.alert('Invalid batch year', 'Please enter a valid numeric academic batch year (e.g. 2024).');
      return;
    }

    const payload: ProfileCreateRequest = {
      personal_info: {
        full_name: name.trim(),
        institution: institution.trim(),
        degree: degree as Degree,
        branch_or_domain: department ? [department] : [],
        academic_batch: parsedBatch,
      },
      skills_and_interests: {
        skills: selectedSkills,
        interests: selectedDomains,
      },
      projects,
      experience: experiences,
      goals,
      bio: bio.trim() || null,
    };

    try {
      setIsSubmitting(true);
      console.log('[ProfileCreation] Submitting payload:', JSON.stringify(payload, null, 2));

      const performUpdate = async () => {
        try {
          await profileService.updateProfile(payload);
          completeProfile();
          router.replace('/(tabs)/profile' as any);
        } catch (error: any) {
          console.error('[ProfileCreation] Update failed', error);
          const detail = error?.response?.data?.detail;
          const errorMessage = detail ? JSON.stringify(detail) : error.message;
          Alert.alert('Update Failed', `Could not save changes: ${errorMessage}`);
        }
      };

      if (isEditMode) {
        await performUpdate();
        return;
      }

      try {
        await profileService.createProfile(payload);
        completeProfile();
        router.replace('/(tabs)/profile' as any);
      } catch (error: any) {
        if (error?.response?.status === 409) {
          console.log('[ProfileCreation] Conflict 409 - profile already exists. Updating instead.');
          await performUpdate();
        } else {
          console.error('[ProfileCreation] Creation failed', error);
          const detail = error?.response?.data?.detail;
          const errorMessage = detail ? JSON.stringify(detail) : error.message;
          Alert.alert('Creation Failed', `Could not create profile: ${errorMessage}`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const canProceed = step === 0
    ? name.trim() && institution.trim() && degree && academicBatch.trim()
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
              <InputField
                label="Institution"
                placeholder="Enter your institution name"
                value={institution}
                onChangeText={setInstitution}
              />
              <Text style={styles.sectionLabel}>Degree</Text>
              <View style={styles.chipsWrap}>
                {degrees.map(d => (
                  <TagChip key={d} label={d} selected={degree === d} onPress={() => setDegree(d)} />
                ))}
              </View>
              <Text style={styles.sectionLabel}>Department</Text>
              <View style={styles.chipsWrap}>
                {departments.map(dept => (
                  <TagChip key={dept} label={dept} selected={department === dept} onPress={() => setDepartment(dept)} />
                ))}
              </View>
              <InputField
                label="Academic Batch (Year)"
                placeholder="e.g. 2024"
                value={academicBatch}
                onChangeText={setAcademicBatch}
                keyboardType="numeric"
              />
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
              <InputField
                label="Your Role in this Project"
                placeholder="e.g. Backend Developer"
                value={projectRole}
                onChangeText={setProjectRole}
                onSubmitEditing={addProject}
                returnKeyType="done"
              />
              <InputField
                label="Project Description (optional)"
                placeholder="Briefly describe this project"
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                numberOfLines={3}
              />
              <InputField
                label="Tech Stack (comma separated)"
                placeholder="e.g. React, Node.js, PostgreSQL"
                value={projectTechStack}
                onChangeText={setProjectTechStack}
                onSubmitEditing={addProject}
                returnKeyType="done"
              />
              <SecondaryButton title="Add Project" onPress={addProject} style={{ marginBottom: spacing.md }} />
              {projects.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  {projects.map(p => (
                    <View key={p.title} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: Colors.card, borderRadius: borderRadius.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: Colors.primaryDark }}>{p.title}</Text>
                        <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{p.role}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                        <TouchableOpacity onPress={() => {
                            setProjectInput(p.title);
                            setProjectRole(p.role);
                            setProjectDescription(p.description || '');
                            setProjectTechStack(p.tech_stack.join(', '));
                            setProjects(prev => prev.filter(x => x.title !== p.title));
                        }}>
                          <Text style={{ color: Colors.primaryDark, fontWeight: 'bold' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setProjects(prev => prev.filter(x => x.title !== p.title))}>
                          <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.sectionLabel}>Experience</Text>
              <InputField
                label="Company"
                placeholder="e.g. Acme Corp"
                value={experienceCompany}
                onChangeText={setExperienceCompany}
              />
              <InputField
                label="Role"
                placeholder="e.g. Software Engineer Intern"
                value={experienceRole}
                onChangeText={setExperienceRole}
              />
              <InputField
                label="Duration"
                placeholder="e.g. Jun 2023 - Aug 2023"
                value={experienceDuration}
                onChangeText={setExperienceDuration}
                onSubmitEditing={addExperience}
                returnKeyType="done"
              />
              <SecondaryButton title="Add Experience" onPress={addExperience} style={{ marginBottom: spacing.md }} />
              {experiences.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  {experiences.map(exp => (
                    <View key={`${exp.company}-${exp.role}-${exp.duration}`} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: Colors.card, borderRadius: borderRadius.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: Colors.primaryDark }}>{exp.role}</Text>
                        <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{exp.company} ({exp.duration})</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                        <TouchableOpacity onPress={() => {
                            setExperienceCompany(exp.company);
                            setExperienceRole(exp.role);
                            setExperienceDuration(exp.duration);
                            setExperiences(prev => prev.filter(x => !(x.company === exp.company && x.role === exp.role && x.duration === exp.duration)));
                        }}>
                          <Text style={{ color: Colors.primaryDark, fontWeight: 'bold' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setExperiences(prev => prev.filter(x => !(x.company === exp.company && x.role === exp.role && x.duration === exp.duration)))}>
                          <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
              <SecondaryButton title="Add Goal" onPress={addGoal} style={{ marginBottom: spacing.md }} />
              {goals.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  {goals.map(g => (
                    <View key={g} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: Colors.card, borderRadius: borderRadius.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: Colors.primaryDark }}>{g}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                        <TouchableOpacity onPress={() => {
                            setGoalInput(g);
                            setGoals(prev => prev.filter(x => x !== g));
                        }}>
                          <Text style={{ color: Colors.primaryDark, fontWeight: 'bold' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setGoals(prev => prev.filter(x => x !== g))}>
                          <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
            disabled={!canProceed || isSubmitting}
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
