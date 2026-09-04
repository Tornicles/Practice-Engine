import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExperienceDecisionUpdate } from '../components/onboarding/state.ts';

test('rejecting analysis preserves the saved experience needed for completion', () => {
  const update = buildExperienceDecisionUpdate(
    {
      firstExperience: {
        whatHappened: 'A client resisted the plan.',
        whoWasInvolved: 'Coach and client',
        whatDidYouDo: 'Asked what ownership meant to them.',
        whatWereYouThinking: 'Slow down.',
        whatWorked: 'The client named the real concern.',
        whatDidNotWork: 'The opening challenge was too direct.',
        whatDidYouLearn: 'Diagnose ownership first.',
        whatWillYouDoDifferently: 'Ask before challenging.',
      },
    },
    {
      title: 'Ownership under resistance',
      lesson: 'Diagnose ownership first.',
      principle: 'Ownership precedes accountability.',
      insight: 'Resistance can reveal missing ownership.',
      frameworkCandidate: 'Notice, diagnose, align, commit',
      evidenceGap: 'Validate across more sessions.',
    },
    123,
    'rejected',
  );

  assert.equal(update.firstExperience?.experienceId, 123);
  assert.equal(update.firstExperience?.captureState, 'saved');
  assert.equal(update.experienceAnalysis?.reviewState, 'rejected');
  assert.equal(
    update.experienceAnalysis?.principle,
    'Ownership precedes accountability.',
  );
});