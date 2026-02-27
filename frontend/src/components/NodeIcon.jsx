import { useEffect, useMemo, useState } from "react";

const FALLBACK_ICON_SRC = "/assets/nodes/いか.png";

export default function NodeIcon({ icon, alt = "", onError, ...imgProps }) {
  const candidates = useMemo(() => {
    const base = typeof icon === "string" ? icon.trim() : "";
    if (!base) return [];
    return [...new Set([base, base.normalize("NFC"), base.normalize("NFD")])];
  }, [icon]);

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [icon]);

  const src = candidates[candidateIndex]
    ? `/assets/nodes/${candidates[candidateIndex]}`
    : FALLBACK_ICON_SRC;

  const handleError = (event) => {
    onError?.(event);
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
      return;
    }
    // Final fallback if all normalization variants failed.
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_ICON_SRC;
  };

  return <img {...imgProps} src={src} alt={alt} onError={handleError} />;
}
