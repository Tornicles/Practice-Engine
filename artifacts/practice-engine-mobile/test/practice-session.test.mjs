import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { usePracticeSession } from '../lib/use-practice-session.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('one mounted Practice session can save, complete a new turn, and save again', async () => {
  const simulationRequests = [];
  const saveRequests = [];
  let latest;
  let simulationPending = false;
  let savePending = false;

  const simulate = {
    get isPending() { return simulationPending; },
    mutate(input, options) {
      simulationRequests.push({ input, options });
    },
  };
  const save = {
    get isPending() { return savePending; },
    mutate(input, options) {
      saveRequests.push({ input, options });
    },
  };

  function MountedPracticeState() {
    latest = usePracticeSession(simulate, save);
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(MountedPracticeState));
  });

  await act(async () => {
    latest.setText('What feels hardest about deciding?');
    latest.send();
  });
  assert.equal(simulationRequests.length, 0, 'the stale empty draft cannot send');

  await act(async () => {
    latest.send();
  });
  assert.equal(simulationRequests.length, 1);

  simulationPending = true;
  await act(async () => {
    latest.setText('duplicate while pending');
    latest.send();
  });
  assert.equal(simulationRequests.length, 1, 'a pending simulation blocks duplicate sends');

  simulationPending = false;
  await act(async () => {
    simulationRequests[0].options.onSuccess({
      clientReply: 'I am worried I will choose wrong.',
      observation: 'Good exploratory question',
      skill: 'Discovery',
      score: 72,
      sessionComplete: true,
    });
  });

  await act(async () => {
    latest.complete();
  });
  assert.deepEqual(saveRequests[0].input.data, {
    scenario: 'A client is avoiding a difficult decision',
    category: 'Decision-making',
    score: 72,
    feedback: 'Good exploratory question',
  });

  savePending = true;
  await act(async () => {
    latest.complete();
  });
  assert.equal(saveRequests.length, 1, 'a pending save blocks duplicate saves');

  savePending = false;
  await act(async () => {
    saveRequests[0].options.onSuccess();
    latest.setText('What would make one option safer to try?');
  });
  await act(async () => {
    latest.send();
  });
  assert.equal(simulationRequests.length, 2);

  await act(async () => {
    simulationRequests[1].options.onSuccess({
      clientReply: 'A reversible first step would help.',
      observation: 'Strong move toward action',
      skill: 'Action planning',
      score: 89,
      sessionComplete: true,
    });
  });
  assert.equal(latest.saved, false, 'a newly completed turn re-enables saving');

  await act(async () => {
    latest.complete();
  });
  assert.deepEqual(saveRequests[1].input.data, {
    scenario: 'A client is avoiding a difficult decision',
    category: 'Decision-making',
    score: 89,
    feedback: 'Strong move toward action',
  });

  await act(async () => {
    renderer.unmount();
  });
});