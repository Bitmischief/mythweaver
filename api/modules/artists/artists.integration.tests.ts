import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  TestUser,
  createTestClient,
  loginTestUser,
} from '../../test/test-utils';
import { fail } from 'assert';

describe('API Endpoints', () => {
  let testUser: TestUser;
  let client: any;

  beforeEach(async () => {
    testUser = await loginTestUser();
    console.log('testUser', testUser);
    client = createTestClient(testUser.token);
  });

  afterEach(async () => {
    if (testUser?._cleanup) {
      await testUser._cleanup();
    }
  });

  describe('GET /version', () => {
    it('should return version data with correct content type', async () => {
      const response = await client.get('/version');
      expect(response.data).toBeDefined();
    });
  });

  describe('Protected Endpoints', () => {
    it('should access protected endpoint with auth', async () => {
      try {
        const response = await client.get('/artists/1', {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
          },
        });
        expect(response.status).toBe(200);
      } catch (error: any) {
        console.error('Request failed:', {
          error,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    });

    it('should fail without auth', async () => {
      const unauthenticatedClient = createTestClient();

      try {
        await unauthenticatedClient.get('/artists/1');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});
