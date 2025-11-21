import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDocumentsQuery,
  useDocumentQuery,
  useUploadDocument,
  useUploadDocumentPhoto,
  useDeleteDocument,
} from '../../hooks/useDocuments';
import * as documentsApi from '../../services/documentsApi';
import { getErrorMessage } from '../../utils/errorHandler';

jest.mock('../../services/documentsApi');
jest.mock('../../utils/errorHandler');

describe('useDocuments hooks', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    jest.clearAllMocks();
    getErrorMessage.mockImplementation((error) => error?.message || 'Unknown error');
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useDocumentsQuery', () => {
    it('должен получить список документов', async () => {
      const mockDocuments = [
        { id: 1, name: 'Document 1', type: 'passport' },
        { id: 2, name: 'Document 2', type: 'license' },
      ];
      const token = 'test-token';

      documentsApi.fetchDocuments.mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocumentsQuery(token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDocuments);
      expect(documentsApi.fetchDocuments).toHaveBeenCalledWith(token);
    });

    it('должен обработать ошибку загрузки', async () => {
      const token = 'test-token';
      const error = new Error('Failed to fetch documents');

      documentsApi.fetchDocuments.mockRejectedValue(error);

      const { result } = renderHook(() => useDocumentsQuery(token), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('должен быть отключен когда enabled=false', () => {
      const token = 'test-token';

      const { result } = renderHook(
        () => useDocumentsQuery(token, { enabled: false }),
        { wrapper }
      );

      expect(result.current.isFetching).toBe(false);
      expect(documentsApi.fetchDocuments).not.toHaveBeenCalled();
    });

    it('должен быть отключен когда token отсутствует', () => {
      const { result } = renderHook(() => useDocumentsQuery(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(documentsApi.fetchDocuments).not.toHaveBeenCalled();
    });
  });

  describe('useDocumentQuery', () => {
    it('должен получить конкретный документ', async () => {
      const mockDocument = { id: 1, name: 'Document 1', type: 'passport' };
      const documentId = '1';
      const token = 'test-token';

      documentsApi.fetchDocument.mockResolvedValue(mockDocument);

      const { result } = renderHook(() => useDocumentQuery(documentId, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDocument);
      expect(documentsApi.fetchDocument).toHaveBeenCalledWith(documentId, token);
    });

    it('должен обработать ошибку загрузки документа', async () => {
      const documentId = '1';
      const token = 'test-token';
      const error = new Error('Document not found');

      documentsApi.fetchDocument.mockRejectedValue(error);

      const { result } = renderHook(() => useDocumentQuery(documentId, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('должен быть отключен когда documentId отсутствует', () => {
      const token = 'test-token';

      const { result } = renderHook(() => useDocumentQuery(null, token), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(documentsApi.fetchDocument).not.toHaveBeenCalled();
    });
  });

  describe('useUploadDocument', () => {
    it('должен загрузить документ', async () => {
      const token = 'test-token';
      const file = { uri: 'file://test.pdf', type: 'application/pdf', name: 'test.pdf' };
      const documentType = 'passport';
      const metadata = { title: 'My Passport' };
      const uploadedDocument = {
        id: 1,
        name: 'test.pdf',
        type: 'passport',
        url: 'https://example.com/document.pdf',
      };

      documentsApi.uploadDocument.mockResolvedValue(uploadedDocument);

      const { result } = renderHook(() => useUploadDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate({ file, documentType, metadata });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(documentsApi.uploadDocument).toHaveBeenCalledWith(file, documentType, metadata, token);
      expect(result.current.data).toEqual(uploadedDocument);
    });

    it('должен обновить кеш после загрузки', async () => {
      const token = 'test-token';
      const file = { uri: 'file://test.pdf' };
      const documentType = 'passport';
      const uploadedDocument = { id: 1, name: 'test.pdf' };

      documentsApi.uploadDocument.mockResolvedValue(uploadedDocument);

      const { result } = renderHook(() => useUploadDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate({ file, documentType });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Проверяем, что кеш был обновлен
      const cachedDocument = queryClient.getQueryData(['document', uploadedDocument.id, token]);
      expect(cachedDocument).toEqual(uploadedDocument);
    });

    it('должен обработать ошибку загрузки', async () => {
      const token = 'test-token';
      const file = { uri: 'file://test.pdf' };
      const documentType = 'passport';
      const error = new Error('Upload failed');

      documentsApi.uploadDocument.mockRejectedValue(error);

      const { result } = renderHook(() => useUploadDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate({ file, documentType });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUploadDocumentPhoto', () => {
    it('должен загрузить фото документа', async () => {
      const token = 'test-token';
      const photo = { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' };
      const documentType = 'passport';
      const uploadedDocument = {
        id: 1,
        name: 'photo.jpg',
        type: 'passport',
        url: 'https://example.com/photo.jpg',
      };

      documentsApi.uploadDocumentPhoto.mockResolvedValue(uploadedDocument);

      const { result } = renderHook(() => useUploadDocumentPhoto(token), { wrapper });

      await act(async () => {
        result.current.mutate({ photo, documentType });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(documentsApi.uploadDocumentPhoto).toHaveBeenCalledWith(photo, documentType, {}, token);
    });
  });

  describe('useDeleteDocument', () => {
    it('должен удалить документ', async () => {
      const token = 'test-token';
      const documentId = '1';
      const documents = [
        { id: 1, name: 'Document 1' },
        { id: 2, name: 'Document 2' },
      ];

      // Устанавливаем начальные данные
      queryClient.setQueryData(['documents', token], documents);

      documentsApi.deleteDocument.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate(documentId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(documentsApi.deleteDocument).toHaveBeenCalledWith(documentId, token);
    });

    it('должен выполнить оптимистичное обновление', async () => {
      const token = 'test-token';
      const documentId = '1';
      const documents = [
        { id: 1, name: 'Document 1' },
        { id: 2, name: 'Document 2' },
      ];

      queryClient.setQueryData(['documents', token], documents);

      documentsApi.deleteDocument.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate(documentId);
      });

      // Проверяем оптимистичное обновление
      const cachedData = queryClient.getQueryData(['documents', token]);
      expect(cachedData).not.toContainEqual(expect.objectContaining({ id: documentId }));
    });

    it('должен восстановить предыдущее состояние при ошибке', async () => {
      const token = 'test-token';
      const documentId = '1';
      const documents = [
        { id: 1, name: 'Document 1' },
        { id: 2, name: 'Document 2' },
      ];
      const error = new Error('Delete failed');

      queryClient.setQueryData(['documents', token], documents);

      documentsApi.deleteDocument.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteDocument(token), { wrapper });

      await act(async () => {
        result.current.mutate(documentId);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Проверяем, что данные восстановлены
      const cachedData = queryClient.getQueryData(['documents', token]);
      expect(cachedData).toEqual(documents);
    });
  });
});

