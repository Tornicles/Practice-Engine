import type {
  ExperienceExtractionResult,
  OnboardingData,
} from '@workspace/api-client-react';

export function buildExperienceDecisionUpdate(
  onboardingData: OnboardingData | undefined,
  result: ExperienceExtractionResult,
  experienceId: number,
  reviewState: 'accepted' | 'rejected',
): OnboardingData {
  return {
    ...onboardingData,
    firstExperience: {
      ...onboardingData?.firstExperience,
      experienceId,
      captureState: 'saved',
    },
    experienceAnalysis: {
      ...onboardingData?.experienceAnalysis,
      experience: result.title,
      lesson: result.lesson,
      principle: result.principle,
      framework: result.frameworkCandidate,
      reviewState,
    },
  };
}