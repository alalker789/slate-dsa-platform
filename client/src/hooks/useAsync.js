import { useEffect, useState } from "react";

/** Minimal data-fetching hook: { data, error, loading } for a promise-returning fn, re-run when deps change. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => live && setState({ data, error: null, loading: false }))
        .catch((error) => live && setState({ data: null, error, loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
