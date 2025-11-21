import {
  fetchDocuments,
  fetchDocument,
  uploadDocument,
  uploadDocumentPhoto,
  deleteDocument,
  getDocumentUrl,
  setTokenExpiredHandler,
} from '../../services/documentsApi';
import * as authService from '../../services/authService';
import { handleApiError, TimeoutError } from '../../utils/errorHandler';
import { Platform } from 'react-native';

jest.mock('../../services/authService');
jest.mock('../../utils/errorHandler');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    documents: 'https://api.workmatch.dev/documents',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('documentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    authService.getValidToken.mockResolvedValue('test-token');
    authService.getRefreshToken.mockResolvedValue('refresh-token');
    authService.refreshAuthToken.mockResolvedValue('new-token');
  });

  describe('setTokenExpiredHandler', () => {
    it('должен установить callback для обработки истечения токена', () => {
      const callback = jest.fn();
      setTokenExpiredHandler(callback);
      expect(callback).toBeDefined();
    });
  });

  describe('fetchDocuments', () => {
    it('должен получить список документов', async () => {
      const mockDocuments = [
        { id: 1, name: 'Document 1', type: 'passport' },
        { id: 2, name: 'Document 2', type: 'license' },
      ];
      const token = 'test-token';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ documents: mockDocuments }),
      });

      const result = await fetchDocuments(token);

      expect(result).toEqual(mockDocuments);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен вернуть пустой массив если документов нет', async () => {
      const token = 'test-token';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ documents: [] }),
      });

      const result = await fetchDocuments(token);

      expect(result).toEqual([]);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const mockDocuments = [{ id: 1, name: 'Document 1' }];

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ documents: mockDocuments }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await fetchDocuments(oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockDocuments);
    });
  });

  describe('fetchDocument', () => {
    it('должен получить конкретный документ', async () => {
      const mockDocument = { id: 1, name: 'Document 1', type: 'passport' };
      const documentId = '1';
      const token = 'test-token';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ document: mockDocument }),
      });

      const result = await fetchDocument(documentId, token);

      expect(result).toEqual(mockDocument);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('uploadDocument', () => {
    it('должен загрузить документ для iOS', async () => {
      Platform.OS = 'ios';
      const file = { uri: 'file://test.pdf', type: 'application/pdf', name: 'test.pdf' };
      const documentType = 'passport';
      const metadata = { title: 'My Passport' };
      const token = 'test-token';
      const uploadedDocument = {
        id: 1,
        name: 'test.pdf',
        type: 'passport',
        url: 'https://example.com/document.pdf',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ document: uploadedDocument }),
      });

      const result = await uploadDocument(file, documentType, metadata, token);

      expect(result).toEqual(uploadedDocument);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен загрузить документ для веб', async () => {
      Platform.OS = 'web';
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const documentType = 'passport';
      const token = 'test-token';
      const uploadedDocument = { id: 1, name: 'test.pdf' };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ document: uploadedDocument }),
      });

      const result = await uploadDocument(file, documentType, {}, token);

      expect(result).toEqual(uploadedDocument);
    });

    it('должен обработать ошибку загрузки', async () => {
      const file = { uri: 'file://test.pdf' };
      const documentType = 'passport';
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(uploadDocument(file, documentType, {}, token)).rejects.toEqual(error);
    });
  });

  describe('uploadDocumentPhoto', () => {
    it('должен загрузить фото документа', async () => {
      const photo = { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' };
      const documentType = 'passport';
      const token = 'test-token';
      const uploadedDocument = {
        id: 1,
        name: 'photo.jpg',
        type: 'passport',
        url: 'https://example.com/photo.jpg',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ document: uploadedDocument }),
      });

      const result = await uploadDocumentPhoto(photo, documentType, {}, token);

      expect(result).toEqual(uploadedDocument);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('должен удалить документ', async () => {
      const documentId = '1';
      const token = 'test-token';

      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: {
          get: () => '0',
        },
      });

      const result = await deleteDocument(documentId, token);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ответ с телом', async () => {
      const documentId = '1';
      const token = 'test-token';
      const response = { success: true };

      const mockHeaders = {
        get: jest.fn().mockReturnValue('100'),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => response,
      });

      const result = await deleteDocument(documentId, token);

      expect(result).toEqual(response);
    });

    it('должен обработать ошибку удаления', async () => {
      const documentId = '1';
      const token = 'test-token';
      const error = { status: 404, message: 'Not found' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      handleApiError.mockReturnValue(error);

      await expect(deleteDocument(documentId, token)).rejects.toEqual(error);
    });
  });

  describe('getDocumentUrl', () => {
    it('должен вернуть URL для просмотра документа', () => {
      const documentId = '1';
      const token = 'test-token';

      const url = getDocumentUrl(documentId, token);

      expect(url).toContain(documentId);
      expect(url).toContain('view');
    });

    it('должен вернуть URL без токена если токен не передан', () => {
      const documentId = '1';

      const url = getDocumentUrl(documentId);

      expect(url).toContain(documentId);
      expect(url).toContain('token=');
    });
  });
});

