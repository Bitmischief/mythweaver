import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  TestUser,
  createTestClient,
  loginTestUser,
} from '../../test/test-utils';
import { fail } from 'assert';
import { Campaign } from '@prisma/client';

describe('Campaign API Endpoints', () => {
  let testUser: TestUser;
  let client: any;
  let testCampaign: Campaign;

  beforeEach(async () => {
    testUser = await loginTestUser();
    client = createTestClient(testUser.token);

    try {
      const testCampaignResponse = await client.post('/campaigns', {
        name: 'Test Campaign',
        description: 'Test Campaign Description',
        rpgSystemCode: 'dnd5e',
      });

      expect(testCampaignResponse.status).toBe(201);
      testCampaign = testCampaignResponse.data;
    } catch (error) {
      console.error('Failed to create test campaign', error);
      fail('Failed to create test campaign');
    }
  });

  afterEach(async () => {
    if (testUser?._cleanup) {
      await testUser._cleanup();
    }
    if (testCampaign?.id) {
      await client.delete(`/campaigns/${testCampaign.id}`);
    }
  });

  describe('GET /campaigns', () => {
    it('should list user campaigns with auth', async () => {
      const response = await client.get('/campaigns');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should fail to list campaigns without auth', async () => {
      const unauthenticatedClient = createTestClient();
      try {
        await unauthenticatedClient.get('/campaigns');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('POST /campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'New Test Campaign',
        description: 'Campaign Description',
        rpgSystemCode: 'dnd5e',
      };

      const response = await client.post('/campaigns', campaignData);
      expect(response.status).toBe(201);
      expect(response.data.name).toBe(campaignData.name);
      expect(response.data.description).toBe(campaignData.description);
      expect(response.data.rpgSystemCode).toBe(campaignData.rpgSystemCode);
      expect(response.data.userId).toBe(testUser.id);
    });

    it('should fail to create campaign with invalid data', async () => {
      try {
        await client.post('/campaigns', {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /campaigns/:id', () => {
    it('should get campaign by id', async () => {
      const response = await client.get(`/campaigns/${testCampaign.id}`);
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testCampaign.id);
      expect(response.data.name).toBe(testCampaign.name);
    });

    it('should fail to get non-existent campaign', async () => {
      try {
        await client.get('/campaigns/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('PATCH /campaigns/:id', () => {
    it('should update campaign', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated Description',
      };

      const response = await client.patch(
        `/campaigns/${testCampaign.id}`,
        updateData,
      );
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.description).toBe(updateData.description);
    });

    it('should fail to update campaign without ownership', async () => {
      const otherUser = await loginTestUser();
      const otherClient = createTestClient(otherUser.token);

      try {
        await otherClient.patch(`/campaigns/${testCampaign.id}`, {
          name: 'Unauthorized Update',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('DELETE /campaigns/:id', () => {
    it('should delete campaign', async () => {
      const response = await client.delete(`/campaigns/${testCampaign.id}`);
      expect(response.status).toBe(200);

      try {
        await client.get(`/campaigns/${testCampaign.id}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    it('should fail to delete campaign without ownership', async () => {
      const otherUser = await loginTestUser();
      const otherClient = createTestClient(otherUser.token);

      try {
        await otherClient.delete(`/campaigns/${testCampaign.id}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });
});
