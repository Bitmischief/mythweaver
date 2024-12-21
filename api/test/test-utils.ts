import axios, { AxiosInstance } from 'axios';
import { ManagementClient } from 'auth0';

export interface TestUser {
  id: string;
  email: string;
  token: string;
  _cleanup: () => Promise<void>;
}

const management = new ManagementClient({
  domain: process.env.AUTH0_TEST_CLIENT_DOMAIN!,
  clientId: process.env.AUTH0_TEST_CLIENT_ID!,
  clientSecret: process.env.AUTH0_TEST_CLIENT_SECRET!,
});

export const createTestClient = (token?: string): AxiosInstance => {
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:8000',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const createEphemeralUser = async () => {
  const email = `test-${Date.now()}@example.com`;
  const password = `Test${Date.now()}!`;

  const user = await management.users.create({
    email,
    password,
    connection: 'Username-Password-Authentication',
    email_verified: true,
  });

  return { email, password, userId: user.data.user_id! };
};

export const loginTestUser = async (): Promise<TestUser> => {
  try {
    const { email, password, userId } = await createEphemeralUser();

    const response = await axios.post(
      `${process.env.ISSUER_BASE_URL}/oauth/token`,
      {
        grant_type: 'password',
        username: email,
        password: password,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email',
        client_id: process.env.AUTH0_TEST_CLIENT_ID,
        client_secret: process.env.AUTH0_TEST_CLIENT_SECRET,
      },
      {
        headers: { 'content-type': 'application/json' },
      },
    );

    return {
      id: userId,
      email,
      token: response.data.access_token,
      _cleanup: async () => {
        await management.users.delete({ id: userId });
      },
    };
  } catch (error) {
    console.error('Failed to create/login test user:', error);
    throw error;
  }
};

export const cleanupTestUser = async () => {
  // Add any cleanup logic here if needed
  // For example, clearing test data from your database
};
