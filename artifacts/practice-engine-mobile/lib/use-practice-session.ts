import { useCallback, useState } from 'react';
import type { ConversationMessage } from '@workspace/api-client-react';

export type PracticeFeedback = {
  observation: string;
  skill: string;
  score: number;
  sessionComplete: boolean;
};

type SimulationInput = {
  data: {
    scenario: string;
    category: string;
    difficulty: string;
    coachMessage: string;
    history: ConversationMessage[];
  };
};

type SaveInput = {
  data: {
    scenario: string;
    category: string;
    score: number;
    feedback: string;
  };
};

type Mutation<Result, Input> = {
  isPending: boolean;
  mutate: (input: Input, options: { onSuccess: (result: Result) => void }) => void;
};

export function usePracticeSession(
  simulate: Mutation<PracticeFeedback & { clientReply: string }, SimulationInput>,
  save: Mutation<unknown, SaveInput>,
) {
  const [scenario, setScenario] = useState('A client is avoiding a difficult decision');
  const [category, setCategory] = useState('Decision-making');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [saved, setSaved] = useState(false);

  const send = useCallback(() => {
    const coachMessage = text.trim();
    if (!coachMessage || simulate.isPending) return;
    const history = messages;
    setSaved(false);
    setMessages((current) => [...current, { role: 'coach', content: coachMessage }]);
    setText('');
    setFeedback(null);
    simulate.mutate(
      { data: { scenario, category, difficulty, coachMessage, history } },
      {
        onSuccess: (result) => {
          setMessages((current) => [...current, { role: 'client', content: result.clientReply }]);
          setFeedback(result);
        },
      },
    );
  }, [category, difficulty, messages, scenario, simulate, text]);

  const complete = useCallback(() => {
    if (!feedback || save.isPending || saved) return;
    save.mutate(
      { data: { scenario, category, score: feedback.score, feedback: feedback.observation } },
      { onSuccess: () => setSaved(true) },
    );
  }, [category, feedback, save, saved, scenario]);

  return {
    category,
    complete,
    difficulty,
    feedback,
    messages,
    saved,
    scenario,
    send,
    setCategory,
    setDifficulty,
    setScenario,
    setText,
    text,
  };
}