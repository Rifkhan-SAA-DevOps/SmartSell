import { useEffect, useState } from "react";

export default function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), Math.max(0, Number(delay) || 0));
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
