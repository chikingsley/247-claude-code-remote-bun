import { logger } from './logger.js';

const FLYIO_GRAPHQL_URL = 'https://api.fly.io/graphql';

export interface FlyOrganization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  organizations: FlyOrganization[];
  error?: string;
}

/**
 * Validates a Fly.io token and retrieves the user's organizations
 */
export async function validateTokenAndGetOrgs(token: string): Promise<ValidateTokenResult> {
  const query = `
    query {
      viewer {
        organizations {
          nodes {
            id
            name
            slug
            type
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(FLYIO_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Fly.io API returned non-OK status');
      return {
        valid: false,
        organizations: [],
        error: response.status === 401 ? 'Invalid token' : `API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      data?: {
        viewer?: {
          organizations?: {
            nodes?: FlyOrganization[];
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (data.errors && data.errors.length > 0) {
      logger.warn({ errors: data.errors }, 'Fly.io GraphQL returned errors');
      return {
        valid: false,
        organizations: [],
        error: data.errors[0].message,
      };
    }

    const organizations = data.data?.viewer?.organizations?.nodes || [];

    return {
      valid: true,
      organizations,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to validate Fly.io token');
    return {
      valid: false,
      organizations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches the list of organizations for a validated token
 */
export async function getOrganizations(token: string): Promise<FlyOrganization[]> {
  const result = await validateTokenAndGetOrgs(token);
  return result.organizations;
}
