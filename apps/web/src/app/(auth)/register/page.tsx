'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await register(form);
      router.replace('/chat');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Unable to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="glass-panel w-full max-w-lg rounded-[32px] border border-white/10 p-8 shadow-panel"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-emberSoft/75">Create account</p>
          <h2 className="mt-4 font-display text-4xl text-white">Spin up a new workspace identity.</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Registration creates the user profile, avatar placeholder, JWT session, and refresh cookie.
          </p>

          <div className="mt-8 space-y-4">
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </div>

          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" disabled={submitting} className="mt-8 w-full py-3">
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="mt-5 text-sm text-white/55">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-emberSoft">
              Back to login
            </Link>
          </p>
        </form>
      </section>

      <section className="hidden border-l border-white/10 bg-mesh-warm lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emberSoft/75">Interview talking points</p>
          <h1 className="mt-6 max-w-3xl font-display text-6xl leading-tight text-white">
            Designed for system design storytelling.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Use this project to discuss scaling websockets, Redis presence, pagination strategies, and why a modular monolith is the right first architecture.
          </p>
        </div>
        <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/6 p-6 text-sm text-white/65">
          <p>Included docs</p>
          <p>Overview, requirements, architecture, security, scaling, tradeoffs, and 25 interview questions with concise answers.</p>
        </div>
      </section>
    </div>
  );
}
