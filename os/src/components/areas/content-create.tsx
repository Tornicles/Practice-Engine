import { useState } from "react";
import { toast } from "sonner";
import { DashLink } from "@/components/dash-link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Panel, Select, StatusBadge } from "@/components/engine";
import { useEngine } from "@/lib/store";
import type { ContentItem, ContentKind } from "@/lib/types";

const kinds: ContentKind[] = ["authority", "educational", "relationship", "demand", "conversion", "proof"];
const formats: ContentItem["format"][] = ["post", "article", "video", "newsletter", "carousel", "case-study"];

export function ContentCreate() {
  const state = useEngine();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sourceId, setSourceId] = useState(state.experiences[0]?.id ?? "");
  const [kind, setKind] = useState<ContentKind>("authority");
  const [format, setFormat] = useState<ContentItem["format"]>("post");
  const [question, setQuestion] = useState("");

  function draftFromExperience() {
    const exp = state.experiences.find((e) => e.id === sourceId);
    if (!exp) return;
    setTitle(exp.lesson.slice(0, 72));
    setMessage(`${exp.lesson}\n\nSource: ${exp.title} (${exp.sourceType}).`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <Panel title="Create from lineage">
        <div className="space-y-3">
          <Field label="Source experience">
            <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {state.experiences.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            variant="outline"
            onClick={() => {
              const session = state.sessions[0];
              if (!session) {
                toast.error("No session to capture.");
                return;
              }
              const id = state.captureLessonFromSession(session.id);
              toast.success(id ? "This session is now a content draft." : "Could not capture.");
            }}
          >
            This session is the lesson
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kind">
              <Select value={kind} onChange={(e) => setKind(e.target.value as ContentKind)}>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Format">
              <Select value={format} onChange={(e) => setFormat(e.target.value as ContentItem["format"])}>
                {formats.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button variant="outline" onClick={draftFromExperience}>
            Pull lesson into draft
          </Button>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Message">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <Button
            onClick={() => {
              if (!title || !message) return;
              const exp = state.experiences.find((e) => e.id === sourceId);
              state.addContent({
                title,
                format,
                kind,
                status: "draft",
                sourceExperienceId: sourceId,
                principleId: exp?.principleId,
                message,
                platform: "LinkedIn",
                questions: [],
              });
              toast.success("Draft stored with source lineage.");
              setTitle("");
              setMessage("");
            }}
          >
            Save draft
          </Button>
          <p className="text-xs text-muted-foreground">
            Authority and education can exist without a sales CTA.
          </p>
        </div>
      </Panel>
      <Panel title="Library">
        <div className="space-y-3">
          {state.content.map((c) => {
            const exp = state.experiences.find((e) => e.id === c.sourceExperienceId);
            const prin = state.principles.find((p) => p.id === c.principleId);
            return (
              <div key={c.id} className="border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.kind} />
                  <span className="engine-kicker">{c.format}</span>
                </div>
                <h3 className="text-sm font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.message}</p>
                <p className="mt-2 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                  Lineage: {prin?.statement ?? "unlinked"} → {exp?.title ?? "no experience"}
                </p>
                {c.status !== "published" ? (
                  <Button size="sm" className="mt-3" variant="outline" onClick={() => state.publishContent(c.id)}>
                    Publish
                  </Button>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="engine-kicker">Audience questions</div>
                    {c.questions.length ? (
                      <ul className="list-disc pl-4 text-sm">
                        {c.questions.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No questions yet.</p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Log a recurring question"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!question.trim()) return;
                          state.addAudienceQuestion(c.id, question.trim());
                          setQuestion("");
                          toast.success("Logged as audience intelligence.");
                        }}
                      >
                        Log
                      </Button>
                    </div>
                    <DashLink to="/content" tab="intelligence" className="text-xs text-primary">
                      Open content intelligence
                    </DashLink>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
