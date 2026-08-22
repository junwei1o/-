import React, { type ReactNode } from "react";

type QuestionTransitionProps = {
  itemKey: string | number;
  children: ReactNode;
  className?: string;
};

/**
 * Gives each newly selected question a small, interruptible entrance cue.
 * The key is intentionally scoped to the active question so answer feedback
 * can update in place without replaying the transition.
 */
export function QuestionTransition({ itemKey, children, className = "" }: QuestionTransitionProps) {
  return (
    <div key={itemKey} className={`question-transition ${className}`.trim()} data-question-transition="true">
      {children}
    </div>
  );
}
