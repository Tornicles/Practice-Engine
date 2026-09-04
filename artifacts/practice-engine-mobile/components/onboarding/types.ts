import { CoachProfile, CoachProfileUpdate } from '@workspace/api-client-react';

export type StepProps = {
  profile: CoachProfile;
  onNext: (updates: Partial<CoachProfileUpdate>) => void;
  onBack: () => void;
  isSaving: boolean;
};
