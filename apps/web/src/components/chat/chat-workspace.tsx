'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ConversationSummary, MessageCreatedEvent, PresenceEvent, TypingEvent } from '@chat/shared';

import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { MessageThread } from '@/components/chat/message-thread';
import { NewConversationDialog } from '@/components/chat/new-conversation-dialog';
import { useAuth, withTokenRefresh } from '@/components/providers/auth-provider';
import { createChatSocket } from '@/lib/socket';
import type { PendingMessage } from '@/types/chat';

interface MessagePage {
  items: PendingMessage[];
  nextCursor: string | null;
}

function sortConversations(items: ConversationSummary[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.lastMessage?.createdAt ?? '';
    const rightTime = right.lastMessage?.createdAt ?? '';

    return rightTime.localeCompare(leftTime);
  });
}

export function ChatWorkspace() {
  const { accessToken, authedApi, logout, refreshSession, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);
  const joinedConversationRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const authedApiRef = useRef(authedApi);
  const refreshSessionRef = useRef(refreshSession);
  const currentUserRef = useRef(user);
  const [isRouting, startTransition] = useTransition();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, Array<{ userId: string; username: string }>>
  >({});
  const [composerError, setComposerError] = useState<string | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    authedApiRef.current = authedApi;
  }, [authedApi]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    enabled: !!authedApi,
    queryFn: async () => {
      if (!authedApi) {
        return [];
      }

      return withTokenRefresh(() => authedApi.conversations(), refreshSession);
    },
  });

  const conversations = useMemo(
    () => sortConversations(conversationsQuery.data ?? []),
    [conversationsQuery.data],
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [conversations, search],
  );

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', activeConversationId],
    enabled: !!authedApi && !!activeConversationId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!authedApi || !activeConversationId) {
        return { items: [], nextCursor: null } satisfies MessagePage;
      }

      const response = await withTokenRefresh(
        () => authedApi.messages(activeConversationId, pageParam),
        refreshSession,
      );

      return {
        ...response,
        items: response.items as PendingMessage[],
      } satisfies MessagePage;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allMessages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return [...pages].reverse().flatMap((page) => page.items) as PendingMessage[];
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!authedApi || !activeConversationId) {
      return;
    }

    queryClient.setQueryData<ConversationSummary[] | undefined>(['conversations', user?.id], (current) =>
      current?.map((conversation) =>
        conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );

    void withTokenRefresh(() => authedApi.markRead(activeConversationId), refreshSession);
  }, [activeConversationId, authedApi, queryClient, refreshSession, user?.id]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = createChatSocket(accessToken);
    socketRef.current = socket;

    const upsertConversation = (
      conversationId: string,
      lastMessage: ConversationSummary['lastMessage'],
    ) => {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        ['conversations', currentUserRef.current?.id],
        (current) => {
          if (!current) {
            return current;
          }

          return sortConversations(
            current.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    lastMessage,
                    unreadCount:
                      activeConversationIdRef.current === conversationId ||
                      lastMessage?.sender.userId === currentUserRef.current?.id
                        ? 0
                        : conversation.unreadCount + 1,
                  }
                : conversation,
            ),
          );
        },
      );
    };

    const upsertMessage = (conversationId: string, message: PendingMessage) => {
      queryClient.setQueryData<InfiniteData<MessagePage> | undefined>(
        ['messages', conversationId],
        (current) => {
          if (!current) {
            return {
              pageParams: [null],
              pages: [
                {
                  items: [message],
                  nextCursor: null,
                },
              ],
            };
          }

          const nextFirstPage = {
            ...current.pages[0],
            items: [
              ...current.pages[0].items.filter(
                (item) => item.id !== message.id && item.clientId !== message.clientId,
              ),
              message,
            ].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
          };

          return {
            ...current,
            pages: [nextFirstPage, ...current.pages.slice(1)],
          };
        },
      );
    };

    socket.on('message:created', (payload: MessageCreatedEvent) => {
      upsertMessage(payload.conversationId, payload.message);
      upsertConversation(payload.conversationId, payload.message);

      if (
        payload.conversationId === activeConversationIdRef.current &&
        authedApiRef.current
      ) {
        void withTokenRefresh(
          () => authedApiRef.current!.markRead(payload.conversationId),
          refreshSessionRef.current,
        );
      }
    });

    socket.on('presence:updated', (payload: PresenceEvent) => {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        ['conversations', currentUserRef.current?.id],
        (current) =>
          current?.map((conversation) => ({
            ...conversation,
            participants: conversation.participants.map((participant) =>
              participant.userId === payload.userId
                ? {
                    ...participant,
                    isOnline: payload.isOnline,
                    lastSeenAt: payload.lastSeenAt,
                  }
                : participant,
            ),
          })),
      );
    });

    socket.on('typing:started', (payload: TypingEvent) => {
      if (payload.userId === currentUserRef.current?.id) {
        return;
      }

      setTypingUsers((current) => ({
        ...current,
        [payload.conversationId]: Array.from(
          new Map(
            [...(current[payload.conversationId] ?? []), { userId: payload.userId, username: payload.username }].map(
              (item) => [item.userId, item],
            ),
          ).values(),
        ),
      }));
    });

    socket.on('typing:stopped', (payload: { conversationId: string; userId: string }) => {
      setTypingUsers((current) => ({
        ...current,
        [payload.conversationId]: (current[payload.conversationId] ?? []).filter(
          (item) => item.userId !== payload.userId,
        ),
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, queryClient]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket || !activeConversationId) {
      return;
    }

    if (joinedConversationRef.current && joinedConversationRef.current !== activeConversationId) {
      socket.emit('conversation:leave', {
        conversationId: joinedConversationRef.current,
      });
    }

    joinedConversationRef.current = activeConversationId;
    socket.emit('conversation:join', { conversationId: activeConversationId });

    return () => {
      socket.emit('conversation:leave', { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!activeConversationId || !socketRef.current) {
      return;
    }

    socketRef.current.emit('typing:start', {
      conversationId: activeConversationId,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', {
        conversationId: activeConversationId,
      });
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!activeConversationId || !draft.trim() || !user || !socketRef.current) {
      return;
    }

    const clientId = `client-${Date.now()}`;
    const optimisticMessage: PendingMessage = {
      id: clientId,
      clientId,
      conversationId: activeConversationId,
      senderId: user.id,
      content: draft.trim(),
      createdAt: new Date().toISOString(),
      pending: true,
      sender: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
      },
    };

    queryClient.setQueryData<InfiniteData<MessagePage> | undefined>(
      ['messages', activeConversationId],
      (current) => {
        if (!current) {
          return {
            pageParams: [null],
            pages: [{ items: [optimisticMessage], nextCursor: null }],
          };
        }

        return {
          ...current,
          pages: [
            {
              ...current.pages[0],
              items: [...current.pages[0].items, optimisticMessage],
            },
            ...current.pages.slice(1),
          ],
        };
      },
    );
    queryClient.setQueryData<ConversationSummary[] | undefined>(['conversations', user.id], (current) =>
      sortConversations(
        (current ?? []).map((conversation) =>
          conversation.id === activeConversationId
            ? { ...conversation, lastMessage: optimisticMessage, unreadCount: 0 }
            : conversation,
        ),
      ),
    );

    setDraft('');
    setComposerError(null);
    socketRef.current.emit('typing:stop', {
      conversationId: activeConversationId,
    });

    socketRef.current.emit(
      'message:send',
      {
        conversationId: activeConversationId,
        content: optimisticMessage.content,
        clientId,
      },
      (acknowledgement: { ok: boolean; data?: PendingMessage; message?: string }) => {
        if (!acknowledgement.ok || !acknowledgement.data) {
          setComposerError(acknowledgement.message ?? 'Unable to deliver message.');
          queryClient.setQueryData<InfiniteData<MessagePage> | undefined>(
            ['messages', activeConversationId],
            (current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                pages: current.pages.map((page, pageIndex) =>
                  pageIndex === 0
                    ? {
                        ...page,
                        items: page.items.filter((item) => item.clientId !== clientId),
                      }
                    : page,
                ),
              };
            },
          );
          return;
        }

        queryClient.setQueryData<InfiniteData<MessagePage> | undefined>(
          ['messages', activeConversationId],
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              pages: current.pages.map((page, pageIndex) =>
                pageIndex === 0
                  ? {
                      ...page,
                      items: page.items
                        .filter((item) => item.clientId !== clientId && item.id !== acknowledgement.data?.id)
                        .concat({ ...acknowledgement.data!, pending: false })
                        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
                    }
                  : page,
              ),
            };
          },
        );
        queryClient.setQueryData<ConversationSummary[] | undefined>(['conversations', user.id], (current) =>
          sortConversations(
            (current ?? []).map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, lastMessage: acknowledgement.data!, unreadCount: 0 }
                : conversation,
            ),
          ),
        );
      },
    );
  };

  const handleConversationCreated = (conversation: ConversationSummary) => {
    queryClient.setQueryData<ConversationSummary[] | undefined>(['conversations', user?.id], (current) =>
      sortConversations([conversation, ...(current ?? []).filter((item) => item.id !== conversation.id)]),
    );
    setShowNewConversation(false);
    startTransition(() => {
      setActiveConversationId(conversation.id);
    });
  };

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-6 lg:px-6">
        <div className="glass-panel flex min-h-[calc(100vh-3rem)] flex-1 overflow-hidden rounded-[32px] border border-white/10 shadow-panel">
          <ConversationSidebar
            currentUser={user}
            conversations={filteredConversations}
            activeConversationId={activeConversationId}
            isLoading={conversationsQuery.isLoading}
            search={search}
            onSearchChange={setSearch}
            onSelectConversation={(conversationId) =>
              startTransition(() => {
                setActiveConversationId(conversationId);
              })
            }
            onNewConversation={() => setShowNewConversation(true)}
            onLogout={() => void logout()}
          />

          <main className="flex min-h-[70vh] flex-1 flex-col">
            <MessageThread
              activeConversation={activeConversation}
              currentUserId={user?.id}
              messages={allMessages}
              draft={draft}
              typingNames={(typingUsers[activeConversation?.id ?? ''] ?? []).map((item) => item.username)}
              isLoadingMessages={messagesQuery.isLoading}
              hasNextPage={Boolean(messagesQuery.hasNextPage)}
              isFetchingNextPage={messagesQuery.isFetchingNextPage}
              isRouting={isRouting}
              composerError={composerError}
              onLoadOlder={() => void messagesQuery.fetchNextPage()}
              onDraftChange={handleDraftChange}
              onSendMessage={handleSendMessage}
            />
          </main>
        </div>
      </div>

      <NewConversationDialog
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
}
