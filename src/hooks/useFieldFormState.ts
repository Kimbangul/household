import { useRef, useState } from 'react';

export function useFieldFormState<Field extends string>() {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const submittingRef = useRef(false);

  function clearFieldError(field: Field) {
    setSubmitStatus(null);
    setErrors((prev) => {
      if (!(field in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { errors, setErrors, submitStatus, setSubmitStatus, submittingRef, clearFieldError };
}
