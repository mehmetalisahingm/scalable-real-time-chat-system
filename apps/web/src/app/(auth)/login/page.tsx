'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: 'alice@example.com',
    password: 'Password123!',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await login(form);
      router.replace('/chat');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to login.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-white/10 bg-mesh-warm lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emberSoft/75">Portfolio system design project</p>
          <h1 className="mt-6 max-w-3xl font-display text-6xl leading-tight text-white">
            Scalable Real-Time Chat System
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            A polished Slack and Discord inspired client backed by Express, PostgreSQL, Redis, JWT rotation, and Socket.IO fan-out.
          </p>
        </div>
        <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/6 p-6 text-sm text-white/65">
          <p>Highlights</p>
          <p>Real optimistic messaging, unread counts, presence, typing indicators, and architecture docs built for interviews.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="glass-panel w-full max-w-lg rounded-[32px] border border-white/10 p-8 shadow-panel"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-emberSoft/75">Welcome back</p>
          <h2 className="mt-4 font-display text-4xl text-white">Log in to the chat workspace.</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Demo credentials are prefilled so the app can be explored immediately after seeding.
          </p>

          <div className="mt-8 space-y-4">
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
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="mt-5 text-sm text-white/55">
            No account yet?{' '}
            <Link href="/register" className="font-semibold text-emberSoft">
              Create one
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
