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
export const useSendMessage = (chatId, token, params = {}) => {
  const queryClient = useQueryClient();

  // Используем тот же ключ, что и в useMessagesSimpleQuery
  const messagesQueryKey = ['messages', chatId, params, token];

  return useMutation({
    mutationFn: async (messageData) => {
      const message = await sendMessage(chatId, messageData, token);
      return message;
    },
    onSuccess: (data, variables, context) => {
      // Получаем реальное сообщение из ответа сервера
      const serverMessage = data?.message || data;
      
      // Обновляем кеш, заменяя временное сообщение на реальное
      const updateCacheWithServerMessage = (old) => {
        if (Array.isArray(old)) {
          // Находим временное сообщение и заменяем его на реальное
          const updated = old.map(msg => {
            // Заменяем временное сообщение с тем же текстом и статусом 'sending'
            if (msg.status === 'sending' && msg.text === variables.text) {
              return {
                ...serverMessage,
                sender: serverMessage.sender || {
                  id: serverMessage.senderId,
                  name: 'Вы',
                },
              };
            }
            // Проверяем, нет ли уже сообщения с таким же ID от сервера
            if (msg.id === serverMessage.id) {
              return serverMessage;
            }
            return msg;
          });
          
          // Если временное сообщение не найдено, добавляем реальное
          const hasTemp = old.some(msg => msg.status === 'sending' && msg.text === variables.text);
          const hasServer = old.some(msg => msg.id === serverMessage.id);
          
          if (!hasTemp && !hasServer && serverMessage) {
            return [...old, {
              ...serverMessage,
              sender: serverMessage.sender || {
                id: serverMessage.senderId,
                name: 'Вы',
              },
            }];
          }
          
          return updated;
        }
        
        if (old?.messages && Array.isArray(old.messages)) {
          const updatedMessages = old.messages.map(msg => {
            if (msg.status === 'sending' && msg.text === variables.text) {
              return {
                ...serverMessage,
                sender: serverMessage.sender || {
                  id: serverMessage.senderId,
                  name: 'Вы',
                },
              };
            }
            if (msg.id === serverMessage.id) {
              return serverMessage;
            }
            return msg;
          });
          
          const hasTemp = old.messages.some(msg => msg.status === 'sending' && msg.text === variables.text);
          const hasServer = old.messages.some(msg => msg.id === serverMessage.id);
          
          if (!hasTemp && !hasServer && serverMessage) {
            return {
              ...old,
              messages: [...old.messages, {
                ...serverMessage,
                sender: serverMessage.sender || {
                  id: serverMessage.senderId,
                  name: 'Вы',
                },
              }],
            };
          }
          
          return { ...old, messages: updatedMessages };
        }
        
        // Если кеш пустой, возвращаем сообщение от сервера
        return serverMessage ? [serverMessage] : old;
      };

      // Обновляем кеш с сообщением от сервера
      queryClient.setQueryData(messagesQueryKey, updateCacheWithServerMessage);
      queryClient.setQueryData(['messages', chatId], updateCacheWithServerMessage);
      
      // Сохраняем обновленную историю в AsyncStorage
      const updatedCache = queryClient.getQueryData(messagesQueryKey);
      if (updatedCache) {
        const messagesToCache = Array.isArray(updatedCache) 
          ? updatedCache 
          : updatedCache?.messages || [];
        cacheChatMessages(chatId, messagesToCache).catch(err => {
          console.warn('Не удалось сохранить сообщения в кеш', err);
        });
      }
      
      // Инвалидируем список чатов (чтобы обновился последний сообщение)
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      // Инвалидируем информацию о чате
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
    // Оптимистичное обновление
    onMutate: async (messageData) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Сохраняем предыдущее значение (проверяем оба варианта ключей)
      let previousMessages = queryClient.getQueryData(messagesQueryKey);
      if (!previousMessages) {
        previousMessages = queryClient.getQueryData(['messages', chatId]);
      }

      // Создаем временное сообщение
      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: messageData.text,
        senderId: messageData.senderId || 'current-user',
        sender: {
          id: messageData.senderId || 'current-user',
          name: 'Вы',
        },
        chatId: parseInt(chatId),
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      // Обновляем оба варианта ключей
      const updateCache = (old) => {
        if (Array.isArray(old)) {
          // Проверяем, нет ли уже такого сообщения
          const exists = old.some(m => m.id === tempMessage.id || (m.text === tempMessage.text && m.status === 'sending'));
          if (exists) return old;
          return [...old, tempMessage];
        }
        if (old?.messages && Array.isArray(old.messages)) {
          const exists = old.messages.some(m => m.id === tempMessage.id || (m.text === tempMessage.text && m.status === 'sending'));
          if (exists) return old;
          return { ...old, messages: [...old.messages, tempMessage] };
        }
        return [tempMessage];
      };

      queryClient.setQueryData(messagesQueryKey, updateCache);
      queryClient.setQueryData(['messages', chatId], updateCache);
      
      // Сохраняем оптимистичное обновление в кеш
      const optimisticCache = queryClient.getQueryData(messagesQueryKey);
      if (optimisticCache) {
        const messagesToCache = Array.isArray(optimisticCache) 
          ? optimisticCache 
          : optimisticCache?.messages || [];
        cacheChatMessages(chatId, messagesToCache).catch(err => {
          console.warn('Не удалось сохранить оптимистичное сообщение в кеш', err);
        });
      }

      return { previousMessages, queryKey: messagesQueryKey };
    },
    onError: (err, variables, context) => {
      // Восстанавливаем предыдущее значение при ошибке
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey || messagesQueryKey, context.previousMessages);
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
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

