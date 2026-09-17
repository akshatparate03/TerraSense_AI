import React, { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Module-level (not component-level) so google.accounts.id.initialize() is
// only ever called once for the whole page lifetime, even across multiple
// mounts (React StrictMode double-invoke in dev, or navigating between
// Login/Register). The callback always calls whatever the latest mounted
// button's onCredential is, via a shared ref.
let initialized = false;
const activeCallbackRef = { current: null };

export default function GoogleSignInButton({ onCredential }) {
  const divRef = useRef(null);

  useEffect(() => {
    activeCallbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function render() {
      if (!window.google?.accounts?.id || !divRef.current) return;
      if (!initialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) =>
            activeCallbackRef.current?.(response.credential),
        });
        initialized = true;
      }
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "filled_black",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          render();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-xl border border-dashed border-base-600 px-4 py-3 text-center text-xs text-slate-500">
        Google Sign-In is not configured (set VITE_GOOGLE_CLIENT_ID) — use email
        &amp; password instead.
      </div>
    );
  }

  return <div ref={divRef} className="flex justify-center" />;
}
