import React from 'react';
import { Platform, View, StyleSheet, Text, Pressable } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { State } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useGetPracticeProfile, useUpdatePracticeProfile, CoachProfileUpdate } from '@workspace/api-client-react';

import {
  Step1Welcome, Step2Goals, Step3Profile, Step4Experience,
  Step5Skills, Step6Development, Step7Brand, Step8Methodology,
  Step9Build, Step10ExperienceCapture, Step11Analysis,
  Step12FirstChallenge, Step13Plan, Step14Passport
} from '@/components/onboarding/OnboardingSteps';

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const profileQuery = useGetPracticeProfile();
  const updateProfile = useUpdatePracticeProfile();

  if (profileQuery.isLoading) return <View style={{ flex: 1, backgroundColor: c.background }}><State loading /></View>;
  if (profileQuery.error || !profileQuery.data) return <View style={{ flex: 1, backgroundColor: c.background }}><State error={profileQuery.error} retry={profileQuery.refetch} /></View>;
  if (profileQuery.data.onboardingCompleted) return <Redirect href="/(tabs)" />;

  const profile = profileQuery.data;
  const currentStep = Math.max(1, Math.min(15, profile.onboardingStep || 1));

  const handleNext = (updates: Partial<CoachProfileUpdate>) => {
    updateProfile.mutate({
      data: updates
    }, {
      onSuccess: () => {
        void profileQuery.refetch();
      }
    });
  };

  const handleBack = () => {
    handleNext({ onboardingStep: Math.max(1, currentStep - 1) });
  };

  const renderStep = () => {
    const props = { profile, onNext: handleNext, onBack: handleBack, isSaving: updateProfile.isPending };
    switch (currentStep) {
      case 1: return <Step1Welcome {...props} />;
      case 2: return <Step2Goals {...props} />;
      case 3: return <Step3Profile {...props} />;
      case 4: return <Step4Experience {...props} />;
      case 5: return <Step5Skills {...props} />;
      case 6: return <Step6Development {...props} />;
      case 7: return <Step7Brand {...props} />;
      case 8: return <Step8Methodology {...props} />;
      case 9: return <Step9Build {...props} />;
      case 10: return <Step10ExperienceCapture {...props} />;
      case 11: return <Step11Analysis {...props} />;
      case 12: return <Step12FirstChallenge {...props} />;
      case 13: return <Step13Plan {...props} />;
      case 14: return <Step14Passport {...props} />;
      default: return null;
    }
  };

  return (
    <KeyboardAwareScrollViewCompat 
      style={{ flex: 1, backgroundColor: c.background }} 
      contentContainerStyle={[styles.wrap, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 24 }]} 
      bottomOffset={40}
    >
      <View style={styles.inner}>
        {currentStep > 1 && currentStep < 15 && (
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable 
                onPress={handleBack} 
                disabled={updateProfile.isPending}
                style={{ opacity: updateProfile.isPending ? 0.5 : 1, paddingVertical: 4, paddingRight: 16 }}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={20} color={c.primary} />
              </Pressable>
              <Text style={[styles.progress, { color: c.primary }]}>STEP {currentStep} / 14</Text>
            </View>
            <View style={[styles.rule, { backgroundColor: c.border }]}>
              <View style={[styles.fill, { backgroundColor: c.primary, width: `${(currentStep / 14) * 100}%` }]} />
            </View>
          </View>
        )}
        {renderStep()}
        {updateProfile.error ? <State error={updateProfile.error} /> : null}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 },
  header: { gap: 12, marginBottom: 12 },
  progress: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4 },
  rule: { height: 4, width: '100%', borderRadius: 2 },
  fill: { height: 4, borderRadius: 2 },
});
