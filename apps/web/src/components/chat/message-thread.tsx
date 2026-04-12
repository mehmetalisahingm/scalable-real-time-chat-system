'use client';

import { Loader2, MessageSquareText } from 'lucide-react';

import type { ConversationSummary } from '@chat/shared';

import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import type { PendingMessage } from '@/types/chat';

interface MessageThreadProps {
  activeConversation: ConversationSummary | null;
  currentUserId: string | undefined;
  messages: PendingMessage[];
  draft: string;
  typingNames: string[];
  isLoadingMessages: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRouting: boolean;
  composerError: string | null;
  onLoadOlder: () => void;
  onDraftChange: (value: string) => void;
  onSendMessage: () => void;
}

export function MessageThread({
  activeConversation,
  currentUserId,
  messages,
  draft,
  typingNames,
  isLoadingMessages,
  hasNextPage,
  isFetchingNextPage,
  isRouting,
  composerError,
  onLoadOlder,
  onDraftChange,
  onSendMessage,
}: MessageThreadProps) {
  if (!activeConversation) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-xl rounded-[32px] border border-dashed border-white/12 bg-white/4 px-8 py-10">
          <p className="text-xs uppercase tracking-[0.3em] text-emberSoft/70">Scalable messaging</p>
          <h2 className="mt-3 font-display text-4xl text-white">Select a conversation to open the workspace.</h2>
          <p className="mt-4 text-sm leading-7 text-white/55">
            The UI is wired for optimistic updates, unread counts, typing signals, and Redis-backed presence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={activeConversation.avatarUrl}
              alt={activeConversation.name}
              size="lg"
              online={
                activeConversation.type === 'DIRECT'
                  ? activeConversation.participants.some(
                      (participant) => participant.userId !== currentUserId && participant.isOnline,
                    )
                  : undefined
              }
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emberSoft/70">
                {activeConversation.type === 'GROUP' ? 'Room' : 'Direct'}
              </p>
              <h2 className="font-display text-3xl text-white">{activeConversation.name}</h2>
              <p className="mt-1 text-sm text-white/45">
                {activeConversation.type === 'GROUP'
                  ? `${activeConversation.participants.length} participants`
                  : activeConversation.participants
                      .filter((participant) => participant.userId !== currentUserId)
                      .map((participant) =>
                        participant.isOnline ? 'Online now' : `Last seen ${formatRelativeTime(participant.lastSeenAt)}`,
                      )
                      .join('')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
            {isRouting ? 'Switching thread...' : 'Redis-backed presence + Socket.IO realtime'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
          {hasNextPage ? (
            <div className="mb-4 flex justify-center">
              <Button variant="secondary" onClick={onLoadOlder} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
              </Button>
            </div>
          ) : null}

          <div className="flex-1 space-y-4">
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading message history...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/4 px-6 py-10 text-center">
                <MessageSquareText className="h-8 w-8 text-emberSoft/80" />
                <h3 className="mt-4 font-display text-2xl text-white">Thread ready for the first message.</h3>
                <p className="mt-2 max-w-md text-sm text-white/50">
                  Message history is paginated from PostgreSQL and live updates are fanned out through Socket.IO.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const mine = message.senderId === currentUserId;

                return (
                  <div key={`${message.id}-${message.clientId}`} className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine ? (
                      <Avatar
                        src={message.sender.avatarUrl}
                        alt={message.sender.username}
                        size="sm"
                        online={message.sender.isOnline}
                      />
                    ) : null}
                    <div
                      className={`max-w-[75%] rounded-[24px] px-4 py-3 ${
                        mine ? 'bg-ember text-white' : 'border border-white/10 bg-white/6 text-white'
                      } ${message.pending ? 'opacity-70' : ''}`}
                    >
                      {!mine ? (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emberSoft/80">
                          {message.sender.username}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      <div className={`mt-2 flex items-center gap-2 text-[11px] ${mine ? 'text-white/70' : 'text-white/40'}`}>
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.pending ? <span>Sending...</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <TypingIndicator names={typingNames} />
          <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-end">
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Type a message. Enter sends, Shift+Enter creates a new line."
              className="min-h-[68px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />
            <Button className="sm:min-w-[120px]" disabled={!draft.trim()} onClick={onSendMessage}>
              Send
            </Button>
          </div>
          {composerError ? <p className="text-sm text-rose-300">{composerError}</p> : null}
        </div>
      </div>
    </>
  );
}
