'use client';

import { ChevronRight, Loader2, LogOut, Plus, Search } from 'lucide-react';

import type { AuthUser, ConversationSummary } from '@chat/shared';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatRelativeTime } from '@/lib/utils';

interface ConversationSidebarProps {
  currentUser: AuthUser | null;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onLogout: () => void;
}

export function ConversationSidebar({
  currentUser,
  conversations,
  activeConversationId,
  isLoading,
  search,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  onLogout,
}: ConversationSidebarProps) {
  return (
    <aside className="w-full max-w-full border-b border-white/10 bg-[#07101a]/65 lg:max-w-[360px] lg:border-b-0 lg:border-r">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={currentUser?.avatarUrl ?? null} alt={currentUser?.username ?? 'Me'} size="lg" online />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emberSoft/70">Workspace</p>
              <h1 className="font-display text-2xl text-white">Real-Time Chat</h1>
            </div>
          </div>
          <Button variant="ghost" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search chats"
              className="pl-11"
            />
          </div>
          <Button className="shrink-0" onClick={onNewConversation}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/4 px-4 py-10 text-center text-sm text-white/45">
            No conversations yet. Create a direct thread or room.
          </div>
        ) : (
          conversations.map((conversation) => {
            const onlineParticipants = conversation.participants.filter(
              (participant) => participant.userId !== currentUser?.id && participant.isOnline,
            );

            return (
              <button
                key={conversation.id}
                className={cn(
                  'mb-2 flex w-full items-center gap-3 rounded-[26px] border px-4 py-3 text-left transition',
                  activeConversationId === conversation.id
                    ? 'border-ember/35 bg-ember/12'
                    : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/5',
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <Avatar
                  src={conversation.avatarUrl}
                  alt={conversation.name}
                  online={conversation.type === 'DIRECT' ? onlineParticipants.length > 0 : undefined}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium text-white">{conversation.name}</p>
                    <span className="shrink-0 text-xs text-white/35">
                      {conversation.lastMessage
                        ? formatRelativeTime(conversation.lastMessage.createdAt)
                        : 'No messages'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="truncate text-sm text-white/50">
                      {conversation.lastMessage?.content ?? 'Start the conversation'}
                    </p>
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-ember px-2 py-0.5 text-[11px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
