import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getReminderNavigationTarget,
  refreshRecommendationFromReminder,
  requestReminderPermissionAfterEnable,
  syncReminderSchedule,
} from '../lib/practice-reminders.ts';

const activeSettings = {
  enabled: true,
  paused: false,
  weekdays: [2, 4, 6],
  hour: 17,
  minute: 45,
};

function notificationRecorder() {
  const scheduled = [];
  let cancellations = 0;
  return {
    scheduled,
    get cancellations() { return cancellations; },
    api: {
      async cancelAllScheduledNotificationsAsync() { cancellations += 1; },
      async scheduleNotificationAsync(request) { scheduled.push(request); return String(scheduled.length); },
    },
  };
}

test('permission is requested only after the explicit enable flow', async () => {
  let requests = 0;
  const getPermissions = async () => ({ granted: false, status: 'undetermined', canAskAgain: true });
  const requestPermissions = async () => {
    requests += 1;
    return { granted: true, status: 'granted', canAskAgain: true };
  };

  assert.equal(requests, 0);
  const permission = await requestReminderPermissionAfterEnable(getPermissions, requestPermissions);
  assert.equal(requests, 1);
  assert.equal(permission.granted, true);
});

test('already-granted and permanently-denied permissions do not prompt again', async () => {
  let requests = 0;
  const request = async () => {
    requests += 1;
    return { granted: true, status: 'granted', canAskAgain: true };
  };

  const granted = await requestReminderPermissionAfterEnable(
    async () => ({ granted: true, status: 'granted', canAskAgain: true }),
    request,
  );
  const denied = await requestReminderPermissionAfterEnable(
    async () => ({ granted: false, status: 'denied', canAskAgain: false }),
    request,
  );

  assert.equal(requests, 0);
  assert.equal(granted.granted, true);
  assert.equal(denied.granted, false);
});

test('selected weekdays and local time create matching weekly schedules', async () => {
  const recorder = notificationRecorder();
  await syncReminderSchedule(activeSettings, recorder.api, 'weekly');

  assert.equal(recorder.cancellations, 1);
  assert.deepEqual(
    recorder.scheduled.map(({ trigger }) => trigger),
    activeSettings.weekdays.map((weekday) => ({
      type: 'weekly',
      weekday,
      hour: 17,
      minute: 45,
    })),
  );
  assert.ok(recorder.scheduled.every(({ content }) =>
    content.data.destination === 'today' && content.data.refreshRecommendation === true));
});

test('pause and disable cancel schedules without creating replacements', async () => {
  for (const settings of [
    { ...activeSettings, paused: true },
    { ...activeSettings, enabled: false, paused: false },
  ]) {
    const recorder = notificationRecorder();
    await syncReminderSchedule(settings, recorder.api, 'weekly');
    assert.equal(recorder.cancellations, 1);
    assert.equal(recorder.scheduled.length, 0);
  }
});

test('resume recreates the selected weekly schedules', async () => {
  const recorder = notificationRecorder();
  await syncReminderSchedule({ ...activeSettings, paused: false }, recorder.api, 'weekly');
  assert.equal(recorder.scheduled.length, activeSettings.weekdays.length);
});

test('notification taps route to Today and refresh its recommendation', async () => {
  const target = getReminderNavigationTarget({ destination: 'today', refreshRecommendation: true });
  assert.equal(target?.pathname, '/(tabs)');
  assert.ok(target?.params.reminder);
  assert.equal(getReminderNavigationTarget({ destination: 'library' }), null);

  const overview = { profile: { goal: 'Coach with clearer questions' } };
  let recommended;
  await refreshRecommendationFromReminder(
    async () => ({ data: overview }),
    (data) => { recommended = data; },
  );
  assert.equal(recommended, overview);
});