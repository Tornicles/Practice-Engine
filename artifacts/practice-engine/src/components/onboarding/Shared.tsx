import React from 'react';
import { CoachProfile } from "@workspace/api-client-react";

export interface StepProps {
  profile: CoachProfile;
  onNext: (data: any) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function MultiSelectCard({
  title,
  selected,
  onClick,
  className = ""
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-md border cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(201,168,78,0.1)]'
          : 'border-border/50 bg-card hover:border-primary/40'
      } ${className}`}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
        }`}>
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className={`text-sm font-medium leading-snug ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
          {title}
        </span>
      </div>
    </div>
  );
}

export function StepHeader({ layer, title, description }: { layer: string; title: string; description: string }) {
  return (
    <div className="p-6 pb-4 border-b border-border/40 bg-card/40">
      <div className="engine-kicker mb-2 text-primary">{layer}</div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

export function FooterActions({
  onBack,
  onNext,
  isSaving,
  nextLabel = "Continue",
  nextDisabled = false,
  hideBack = false
}: {
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideBack?: boolean;
}) {
  return (
    <div className="flex gap-4 p-6 border-t border-border/40 bg-background/40">
      {!hideBack && (
        <button
          onClick={onBack}
          disabled={isSaving}
          className="h-12 px-6 flex items-center justify-center border border-border rounded-md text-sm font-semibold uppercase tracking-[.08em] hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled || isSaving}
        className="flex-1 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-bold uppercase tracking-[.1em] hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(201,168,78,0.15)]"
      >
        {isSaving ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        ) : (
          <>
            {nextLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </>
        )}
      </button>
    </div>
  );
}
