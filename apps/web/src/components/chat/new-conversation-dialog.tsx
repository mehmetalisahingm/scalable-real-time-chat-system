'use client';

import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, UserRoundPlus, UsersRound } from 'lucide-react';

import type { ConversationSummary } from '@chat/shared';

import { useAuth, withTokenRefresh } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: ConversationSummary) => void;
}

export function NewConversationDialog({
  open,
  onClose,
  onConversationCreated,
}: NewConversationDialogProps) {
  const { authedApi, refreshSession } = useAuth();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [roomName, setRoomName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['user-search', deferredQuery],
    enabled: open && !!authedApi,
    queryFn: async () => {
      if (!authedApi) {
        return [];
      }

      return withTokenRefresh(() => authedApi.searchUsers(deferredQuery), refreshSession);
    },
  });

  if (!open) {
    return null;
  }

  const results = searchQuery.data ?? [];

  const handleCreateDirect = async (participantId: string) => {
    if (!authedApi) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const conversation = await withTokenRefresh(
        () => authedApi.createDirectConversation(participantId),
        refreshSession,
      );
      onConversationCreated(conversation);
      onClose();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create direct conversation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!authedApi) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const conversation = await withTokenRefresh(
        () =>
          authedApi.createGroupConversation({
            name: roomName,
            participantIds: selectedUserIds,
          }),
        refreshSession,
      );
      onConversationCreated(conversation);
      onClose();
      setRoomName('');
      setSelectedUserIds([]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create group conversation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09101b]/80 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-[28px] border border-white/10 p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emberSoft/70">New conversation</p>
            <h2 className="mt-2 font-display text-3xl text-white">Start a direct thread or room.</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'direct' ? 'bg-white/12 text-white' : 'text-white/55'
            }`}
            onClick={() => setMode('direct')}
          >
            <UserRoundPlus className="mr-2 inline-block h-4 w-4" />
            Direct message
          </button>
          <button
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'group' ? 'bg-white/12 text-white' : 'text-white/55'
            }`}
            onClick={() => setMode('group')}
          >
            <UsersRound className="mr-2 inline-block h-4 w-4" />
            Group room
          </button>
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <Input
            placeholder="Search teammates by username or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-11"
          />
        </div>

        {mode === 'group' ? (
          <Input
            placeholder="Room name"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            className="mt-4"
          />
        ) : null}

        <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
          {searchQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching users...
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/4 px-4 py-8 text-center text-sm text-white/45">
              No users matched the current search.
            </div>
          ) : (
            results.map((person) => {
              const selected = selectedUserIds.includes(person.id);

              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={person.avatarUrl} alt={person.username} online={person.isOnline} />
                    <div>
                      <p className="font-medium text-white">{person.username}</p>
                      <p className="text-sm text-white/45">{person.email}</p>
                    </div>
                  </div>

                  {mode === 'direct' ? (
                    <Button disabled={submitting} onClick={() => void handleCreateDirect(person.id)}>
                      Chat
                    </Button>
                  ) : (
                    <Button
                      variant={selected ? 'primary' : 'secondary'}
                      disabled={submitting}
                      onClick={() =>
                        setSelectedUserIds((current) =>
                          current.includes(person.id)
                            ? current.filter((id) => id !== person.id)
                            : [...current, person.id],
                        )
                      }
                    >
                      {selected ? 'Selected' : 'Add'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {mode === 'group' ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-white/50">{selectedUserIds.length} participant(s) selected</p>
            <Button
              disabled={submitting || roomName.trim().length < 2 || selectedUserIds.length === 0}
              onClick={() => void handleCreateGroup()}
            >
              {submitting ? 'Creating...' : 'Create room'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
