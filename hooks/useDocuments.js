import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDocuments, 
  fetchDocument, 
  uploadDocument, 
  uploadDocumentPhoto, 
  deleteDocument 
} from '../services/documentsApi';
import { getErrorMessage, NetworkError, TimeoutError } from '../utils/errorHandler';

/**
 * Хук для получения списка документов пользователя
 */
export const useDocumentsQuery = (token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['documents', token],
    queryFn: async () => {
      try {
        const documents = await fetchDocuments(token);
        return documents;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        const enhancedError = error?.message 
          ? error 
          : new Error(errorMessage || 'Не удалось загрузить документы. Попробуйте ещё раз.');
        
        if (error && typeof error === 'object') {
          Object.assign(enhancedError, error);
        }
        
        throw enhancedError;
      }
    },
    enabled: options?.enabled !== false && !!token,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 минуты по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для получения конкретного документа
 */
export const useDocumentQuery = (documentId, token, options = {}) => {
  return useQuery({
    queryKey: ['document', documentId, token],
    queryFn: async () => {
      try {
        const document = await fetchDocument(documentId, token);
        return document;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        const enhancedError = error?.message 
          ? error 
          : new Error(errorMessage || 'Не удалось загрузить документ. Попробуйте ещё раз.');
        
        if (error && typeof error === 'object') {
          Object.assign(enhancedError, error);
        }
        
        throw enhancedError;
      }
    },
    enabled: options?.enabled !== false && !!token && !!documentId,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для загрузки документа
 */
export const useUploadDocument = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentType, metadata = {} }) => {
      return await uploadDocument(file, documentType, metadata, token);
    },
    onSuccess: (data) => {
      // Обновить список документов
      queryClient.invalidateQueries({ queryKey: ['documents', token] });
      // Добавить новый документ в кеш
      if (data.id) {
        queryClient.setQueryData(['document', data.id, token], data);
      }
    },
    onError: (error) => {
      console.error('Ошибка при загрузке документа:', error);
    },
  });
};

/**
 * Хук для загрузки фото документа
 */
export const useUploadDocumentPhoto = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photo, documentType, metadata = {} }) => {
      return await uploadDocumentPhoto(photo, documentType, metadata, token);
    },
    onSuccess: (data) => {
      // Обновить список документов
      queryClient.invalidateQueries({ queryKey: ['documents', token] });
      // Добавить новый документ в кеш
      if (data.id) {
        queryClient.setQueryData(['document', data.id, token], data);
      }
    },
    onError: (error) => {
      console.error('Ошибка при загрузке фото документа:', error);
    },
  });
};

/**
 * Хук для удаления документа
 */
export const useDeleteDocument = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId) => {
      return await deleteDocument(documentId, token);
    },
    onMutate: async (documentId) => {
      // Отменить исходящие запросы
      await queryClient.cancelQueries({ queryKey: ['documents', token] });

      // Сохранить предыдущее значение
      const previousDocuments = queryClient.getQueryData(['documents', token]);

      // Оптимистично обновить кеш
      queryClient.setQueryData(['documents', token], (old) => 
        old ? old.filter(doc => {
          const docId = doc.id || doc._id;
          return String(docId) !== String(documentId);
        }) : []
      );

      return { previousDocuments };
    },
    onError: (err, documentId, context) => {
      // В случае ошибки вернуть предыдущее значение
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents', token], context.previousDocuments);
      }
    },
    onSuccess: (data, documentId) => {
      // Удалить документ из кеша
      queryClient.removeQueries({ queryKey: ['document', documentId, token] });
      // Обновить список документов
      queryClient.invalidateQueries({ queryKey: ['documents', token] });
    },
    onSettled: () => {
      // Обновить запрос после завершения мутации
      queryClient.invalidateQueries({ queryKey: ['documents', token] });
    },
  });
};



