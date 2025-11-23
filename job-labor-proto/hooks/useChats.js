import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  fetchChats, 
  fetchChat, 
  fetchMessages, 
  sendMessage, 
  markMessagesAsRead 
} from '../services/chatsApi';
import { 
  cacheChatMessages, 
  getCachedChatMessages,
  clearChatMessagesCache 
} from '../services/cacheService';

/**
 * Хук для получения списка чатов
 */
export const useChatsQuery = (params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chats', params, token],
    queryFn: async () => {
      const chats = await fetchChats(params, token);
      return chats;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 минута по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
    refetchInterval: options?.refetchInterval ?? 30 * 1000, // Обновление каждые 30 секунд
  });
};

/**
 * Хук для получения информации о чате
 */
export const useChatQuery = (chatId, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chat', chatId, token],
    queryFn: async () => {
      const chat = await fetchChat(chatId, token);
      return chat;
    },
    enabled: options?.enabled !== false && !!chatId,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 минуты по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для получения истории сообщений (бесконечный скролл)
 */
export const useMessagesQuery = (chatId, params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: ['messages', chatId, params, token],
    queryFn: async ({ pageParam = null }) => {
      const queryParams = {
        ...params,
        before: pageParam,
      };
      const messages = await fetchMessages(chatId, queryParams, token);
      return messages;
    },
    enabled: options?.enabled !== false && !!chatId,
    getNextPageParam: (lastPage) => {
      // Если есть предыдущие сообщения, возвращаем ID последнего сообщения
      if (Array.isArray(lastPage) && lastPage.length > 0) {
        return lastPage[lastPage.length - 1].id;
      }
      if (lastPage?.messages && Array.isArray(lastPage.messages) && lastPage.messages.length > 0) {
        return lastPage.messages[lastPage.messages.length - 1].id;
      }
      return undefined;
    },
    initialPageParam: null,
    staleTime: options?.staleTime ?? 30 * 1000, // 30 секунд по умолчанию
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для получения истории сообщений (обычный запрос)
 */
export const useMessagesSimpleQuery = (chatId, params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['messages', chatId, params, token],
    queryFn: async () => {
      // Сначала пытаемся получить из кеша
      const cachedMessages = await getCachedChatMessages(chatId, 24 * 60 * 60 * 1000); // 24 часа
      
      try {
        // Загружаем свежие данные с сервера
        const messages = await fetchMessages(chatId, params, token);
        
        // Сохраняем в кеш
        await cacheChatMessages(chatId, messages);
        
        return messages;
      } catch (error) {
        // Если не удалось загрузить с сервера, используем кеш
        if (cachedMessages) {
          console.log('[useChats] Используем кешированные сообщения из-за ошибки загрузки');
          return cachedMessages;
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!chatId,
    staleTime: options?.staleTime ?? 30 * 1000, // 30 секунд по умолчанию
    gcTime: options?.cacheTime ?? 24 * 60 * 60 * 1000, // 24 часа для сохранения истории
    retry: 2,
    retryDelay: 1000,
    refetchInterval: options?.refetchInterval ?? 10 * 1000, // Обновление каждые 10 секунд
    // Начальные данные из кеша
    placeholderData: async () => {
      try {
        const cached = await getCachedChatMessages(chatId, 24 * 60 * 60 * 1000);
        return cached;
      } catch {
        return undefined;
      }
    },
  });
};

/**
 * Хук для отправки сообщения
 */
export const useSendMessage = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, text, senderId }) => {
      const message = await sendMessage(chatId, { text, senderId }, token);
      return { message, chatId }; // Return chatId to use in onSuccess
    },
    onSuccess: (data, variables, context) => {
      const { chatId } = variables;
      const serverMessage = data?.message || data;
      
      // Ключи запросов
      const messagesQueryKey = ['messages', chatId];
      const specificQueryKey = ['messages', chatId, {}, token]; // Try to match useMessagesSimpleQuery key structure if possible, or invalidate all

      // Helper to update cache
      const updateCacheWithServerMessage = (old) => {
        if (!old) return old; // If not loaded, don't update
        
        if (Array.isArray(old)) {
          const updated = old.map(msg => {
            if (msg.status === 'sending' && msg.text === variables.text) {
              return {
                ...serverMessage,
                sender: serverMessage.sender || { id: variables.senderId || 0, name: 'Вы' },
              };
            }
            if (msg.id === serverMessage.id) return serverMessage;
            return msg;
          });
          
          const hasTemp = old.some(msg => msg.status === 'sending' && msg.text === variables.text);
          const hasServer = old.some(msg => msg.id === serverMessage.id);
          
          if (!hasTemp && !hasServer && serverMessage) {
            return [...old, { ...serverMessage, sender: serverMessage.sender || { id: variables.senderId || 0, name: 'Вы' } }];
          }
          return updated;
        }
        
        // Handle object structure { messages: [] }
        if (old?.messages && Array.isArray(old.messages)) {
             // Similar logic for object structure... omitted for brevity as simple query usually returns array
             return old; 
        }
        return old;
      };

      // Update cache strictly
      queryClient.setQueriesData({ queryKey: messagesQueryKey }, updateCacheWithServerMessage);
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      // Force refetch messages to be safe
      queryClient.invalidateQueries({ queryKey: messagesQueryKey });
    },
    onMutate: async (variables) => {
      const { chatId, text, senderId } = variables;
      const messagesQueryKey = ['messages', chatId];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });

      // Snapshot previous value
      // We might have multiple queries for this chatId (with diff params), so we get one?
      // exact: false matches all variables
      const previousMessages = queryClient.getQueriesData({ queryKey: messagesQueryKey });

      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: text,
        senderId: senderId || 0,
        sender: { id: senderId || 0, name: 'Вы' },
        chatId: parseInt(chatId),
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      // Optimistically update all matching queries
      queryClient.setQueriesData({ queryKey: messagesQueryKey }, (old) => {
        if (!old) return [tempMessage];
        if (Array.isArray(old)) return [...old, tempMessage];
        return old;
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousMessages) {
         context.previousMessages.forEach(([queryKey, data]) => {
             queryClient.setQueryData(queryKey, data);
         });
      }
    },
  });
};

/**
 * Хук для пометки сообщений как прочитанных
 */
export const useMarkMessagesAsRead = (chatId, token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds) => {
      const result = await markMessagesAsRead(chatId, messageIds, token);
      return result;
    },
    onSuccess: () => {
      // Инвалидировать список сообщений
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      // Инвалидировать список чатов (чтобы обновился счетчик непрочитанных)
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      // Инвалидировать информацию о чате
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });
};

