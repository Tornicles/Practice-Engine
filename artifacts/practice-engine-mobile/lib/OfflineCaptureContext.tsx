import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { createExperience, getListExperiencesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export type CaptureDraft = {
  title: string;
  situation: string;
  reflection: string;
  lesson: string;
  principle: string;
};

type QueuedCapture = {
  id: string;
  data: {
    clientRequestId: string;
    title: string;
    situation: string;
    learning: string;
    principle: string;
  };
  attempts: number;
  status: 'staging' | 'pending' | 'failed';
};

type SyncState = 'idle' | 'pending' | 'syncing' | 'failed' | 'synced';

type OfflineCaptureValue = {
  draft: CaptureDraft;
  loaded: boolean;
  syncState: SyncState;
  queuedCount: number;
  isEnqueueing: boolean;
  storageError: boolean;
  updateDraft: (patch: Partial<CaptureDraft>) => void;
  queueDraft: () => Promise<void>;
  retry: () => Promise<void>;
  clearAccountData: () => Promise<void>;
};

const EMPTY_DRAFT: CaptureDraft = {
  title: '',
  situation: '',
  reflection: '',
  lesson: '',
  principle: '',
};
const STORAGE_PREFIX = 'practice-engine.capture.';
const OfflineCaptureContext = createContext<OfflineCaptureValue | null>(null);

const storageKey = (userId: string) => `${STORAGE_PREFIX}${userId.replace(/[^\w.-]/g, '_')}`;

export function OfflineCaptureProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const accountId = isSignedIn ? userId : null;
  return <OfflineCaptureAccountProvider key={accountId ?? 'signed-out'} userId={accountId}>{children}</OfflineCaptureAccountProvider>;
}

function OfflineCaptureAccountProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CaptureDraft>(EMPTY_DRAFT);
  const [queue, setQueue] = useState<QueuedCapture[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const draftRef = useRef<CaptureDraft>(EMPTY_DRAFT);
  const queueRef = useRef<QueuedCapture[]>([]);
  const syncingRef = useRef(false);
  const enqueueingRef = useRef(false);
  const sessionActiveRef = useRef(true);
  const storageErrorRef = useRef(false);
  const loadErrorRef = useRef(false);
  const draftVersionRef = useRef(0);
  const storageWritesRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => () => {
    sessionActiveRef.current = false;
  }, []);

  const persist = useCallback((nextDraft: CaptureDraft, nextQueue: QueuedCapture[]) => {
    if (!userId || !sessionActiveRef.current) return;
    const operation = storageWritesRef.current
      .catch(() => undefined)
      .then(() => SecureStore.setItemAsync(storageKey(userId), JSON.stringify({ draft: nextDraft, queue: nextQueue })));
    storageWritesRef.current = operation;
    return operation;
  }, [userId]);

  const loadAccountData = useCallback(async () => {
    if (!userId) {
      draftRef.current = EMPTY_DRAFT;
      queueRef.current = [];
      setDraft(EMPTY_DRAFT);
      setQueue([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    try {
      const raw = await SecureStore.getItemAsync(storageKey(userId));
      if (!sessionActiveRef.current) return;
      const stored = raw ? JSON.parse(raw) as { draft?: CaptureDraft; queue?: QueuedCapture[] } : {};
      const nextDraft = stored.draft ?? EMPTY_DRAFT;
      const nextQueue = (stored.queue ?? []).map((item) => ({
        ...item,
        status: item.status === 'staging' ? 'pending' as const : item.status,
      }));
      draftRef.current = nextDraft;
      queueRef.current = nextQueue;
      setDraft(nextDraft);
      setQueue(nextQueue);
      loadErrorRef.current = false;
      storageErrorRef.current = false;
      setStorageError(false);
    } catch {
      if (!sessionActiveRef.current) return;
      loadErrorRef.current = true;
      storageErrorRef.current = true;
      setStorageError(true);
    } finally {
      if (sessionActiveRef.current) setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  useEffect(() => {
    if (!loaded || !userId) return;
    const version = draftVersionRef.current;
    const timeout = setTimeout(() => {
      if (!enqueueingRef.current && version === draftVersionRef.current) {
        void persist(draftRef.current, queueRef.current)
          ?.then(() => {
            if (sessionActiveRef.current && version === draftVersionRef.current) {
              storageErrorRef.current = false;
              setStorageError(false);
            }
          })
          .catch(() => {
            if (sessionActiveRef.current && version === draftVersionRef.current) {
              storageErrorRef.current = true;
              setStorageError(true);
            }
          });
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [draft, loaded, persist, userId]);

  const sync = useCallback(async () => {
    if (!userId || !sessionActiveRef.current || syncingRef.current || !queueRef.current.some((item) => item.status !== 'staging')) return;
    syncingRef.current = true;
    setSyncState('syncing');
    let hadFailure = false;
    const itemsToSync = queueRef.current.filter((item) => item.status !== 'staging');

    try {
      for (const item of itemsToSync) {
        let sent = false;
        try {
          await createExperience(item.data);
          sent = true;
        } catch {
          if (!sessionActiveRef.current) return;
          hadFailure = true;
          const nextQueue: QueuedCapture[] = queueRef.current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, attempts: candidate.attempts + 1, status: candidate.attempts >= 2 ? 'failed' as const : 'pending' as const }
              : candidate,
          );
          queueRef.current = nextQueue;
          setQueue(nextQueue);
          try {
            await persist(draftRef.current, nextQueue);
          } catch {
            storageErrorRef.current = true;
            setStorageError(true);
          }
          break;
        }

        if (!sent || !sessionActiveRef.current) continue;
        const nextQueue = queueRef.current.filter((candidate) => candidate.id !== item.id);
        queueRef.current = nextQueue;
        setQueue(nextQueue);
        try {
          await persist(draftRef.current, nextQueue);
          storageErrorRef.current = false;
          setStorageError(false);
        } catch {
          storageErrorRef.current = true;
          setStorageError(true);
        }
      }
    } finally {
      syncingRef.current = false;
    }

    if (!sessionActiveRef.current) return;
    const remaining = queueRef.current;
    if (remaining.length === 0) {
      setSyncState('synced');
      await queryClient.invalidateQueries({ queryKey: getListExperiencesQueryKey() });
    } else {
      setSyncState(hadFailure && remaining.some((item) => item.status === 'failed') ? 'failed' : 'pending');
      if (!hadFailure && remaining.some((item) => item.status !== 'staging')) void sync();
    }
  }, [persist, queryClient, userId]);

  useEffect(() => {
    if (!loaded || queue.length === 0) return;
    void sync();
    const interval = setInterval(() => void sync(), 15_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loaded, queue.length, sync]);

  const updateDraft = useCallback((patch: Partial<CaptureDraft>) => {
    const nextDraft = { ...draftRef.current, ...patch };
    draftVersionRef.current += 1;
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    setSyncState('idle');
  }, []);

  const queueDraft = useCallback(async () => {
    if (!userId || !sessionActiveRef.current || enqueueingRef.current) return;
    enqueueingRef.current = true;
    setIsEnqueueing(true);
    const submittedDraft = draftRef.current;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const item: QueuedCapture = {
      id,
      data: {
        clientRequestId: id,
        title: submittedDraft.title,
        situation: submittedDraft.situation,
        learning: submittedDraft.lesson,
        principle: submittedDraft.principle,
      },
      attempts: 0,
      status: 'staging',
    };
    const nextQueue = [...queueRef.current, item];
    const stagingVersion = draftVersionRef.current + 1;
    draftVersionRef.current = stagingVersion;
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    setSyncState('pending');
    try {
      await persist(EMPTY_DRAFT, nextQueue);
      if (sessionActiveRef.current) {
        const durableQueue = queueRef.current.map((candidate) =>
          candidate.id === id ? { ...candidate, status: 'pending' as const } : candidate,
        );
        queueRef.current = durableQueue;
        setQueue(durableQueue);
        const nextDraft = draftVersionRef.current === stagingVersion ? EMPTY_DRAFT : draftRef.current;
        if (draftVersionRef.current === stagingVersion) {
          draftRef.current = EMPTY_DRAFT;
          setDraft(EMPTY_DRAFT);
        }
        try {
          await persist(nextDraft, durableQueue);
          storageErrorRef.current = false;
          setStorageError(false);
        } catch {
          storageErrorRef.current = true;
          setStorageError(true);
        }
        void sync();
      }
    } catch {
      if (sessionActiveRef.current) {
        const restoredQueue = queueRef.current.filter((candidate) => candidate.id !== id);
        queueRef.current = restoredQueue;
        setQueue(restoredQueue);
        storageErrorRef.current = true;
        setStorageError(true);
        try {
          await persist(draftRef.current, restoredQueue);
          storageErrorRef.current = false;
          setStorageError(false);
        } catch {
          storageErrorRef.current = true;
          setStorageError(true);
        }
      }
    } finally {
      enqueueingRef.current = false;
      if (sessionActiveRef.current) setIsEnqueueing(false);
    }
  }, [persist, sync, userId]);

  const clearAccountData = useCallback(async () => {
    sessionActiveRef.current = false;
    await storageWritesRef.current.catch(() => undefined);
    if (userId) await SecureStore.deleteItemAsync(storageKey(userId));
    draftRef.current = EMPTY_DRAFT;
    queueRef.current = [];
    setQueue([]);
    setDraft(EMPTY_DRAFT);
    setSyncState('idle');
  }, [userId]);

  const retry = useCallback(async () => {
    if (loadErrorRef.current) {
      await loadAccountData();
      if (loadErrorRef.current) return;
    }
    if (storageErrorRef.current) {
      try {
        await persist(draftRef.current, queueRef.current);
        storageErrorRef.current = false;
        setStorageError(false);
      } catch {
        storageErrorRef.current = true;
        setStorageError(true);
        return;
      }
    }
    await sync();
  }, [loadAccountData, persist, sync]);

  const value = useMemo<OfflineCaptureValue>(() => ({
    draft,
    loaded,
    syncState: storageError || queue.some((item) => item.status === 'failed') ? 'failed' : syncState,
    queuedCount: queue.length,
    isEnqueueing,
    storageError,
    updateDraft,
    queueDraft,
    retry,
    clearAccountData,
  }), [clearAccountData, draft, isEnqueueing, loaded, queue, queueDraft, retry, storageError, syncState, updateDraft]);

  return <OfflineCaptureContext.Provider value={value}>{children}</OfflineCaptureContext.Provider>;
}

export function useOfflineCapture() {
  const value = useContext(OfflineCaptureContext);
  if (!value) throw new Error('useOfflineCapture must be used within OfflineCaptureProvider');
  return value;
}