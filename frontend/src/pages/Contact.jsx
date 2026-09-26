import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, Mail } from "lucide-react";
import Seo from "../components/Seo.jsx";
import PublicPageShell from "../components/PublicPageShell.jsx";
import { submitContactForm } from "../services/api.js";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senderType, setSenderType] = useState("individual");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitContactForm({
        name,
        email,
        sender_type: senderType,
        message,
      });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Couldn't send your message right now. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageShell
      icon={Mail}
      eyebrow="Get in Touch"
      title="Contact Us"
      subtitle="Questions, feedback, or a bug to report — send us a message."
    >
      <Seo description="Contact TerraSense AI." />

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2 py-6 text-center"
        >
          <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          <p className="text-base font-semibold text-slate-100">
            Message sent
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Thanks for reaching out — we'll get back to you at the email
            address you provided.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
              I am contacting as
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["individual", "Individual"],
                ["organization", "Organization / Agency"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSenderType(value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    senderType === value
                      ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
                      : "border-base-600 text-slate-400 hover:border-base-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Message
            </label>
            <textarea
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="w-full resize-none rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent-cyan/50"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2.5 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Message
          </button>
        </form>
      )}
    </PublicPageShell>
  );
}
