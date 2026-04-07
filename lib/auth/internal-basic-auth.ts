import { NextRequest, NextResponse } from 'next/server';

interface InternalBasicAuthConfig {
  username: string;
  password: string;
  actorId: string;
  realm: string;
}

interface AuthSuccess {
  ok: true;
  username: string;
  actorId: string;
}

interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export type InternalBasicAuthResult = AuthSuccess | AuthFailure;

function decodeBase64(value: string) {
  if (typeof atob === 'function') {
    return atob(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf8');
  }

  throw new Error('Base64 decode nije podržan u ovom runtime-u.');
}

function parseBasicAuthorizationHeader(authorization: string | null) {
  if (!authorization?.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = decodeBase64(authorization.slice(6));
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function unauthorizedResponse(message: string, realm: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${realm}", charset="UTF-8"`,
    },
  });
}

function opsDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: 'OPS Basic Auth nije konfigurisan. Postavi OPS_BASIC_AUTH_USERNAME i OPS_BASIC_AUTH_PASSWORD.',
    },
    { status: 503 }
  );
}

function hasValidCredentials(request: NextRequest, config: InternalBasicAuthConfig) {
  const credentials = parseBasicAuthorizationHeader(request.headers.get('authorization'));

  if (!credentials) {
    return false;
  }

  return credentials.username === config.username && credentials.password === config.password;
}

export function getCrmBasicAuthConfig(): InternalBasicAuthConfig | null {
  const username = process.env.CRM_BASIC_AUTH_USERNAME;
  const password = process.env.CRM_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    actorId: username,
    realm: 'Podovi CRM',
  };
}

export function getOpsBasicAuthConfig(): InternalBasicAuthConfig | null {
  const username = process.env.OPS_BASIC_AUTH_USERNAME || process.env.CRM_BASIC_AUTH_USERNAME;
  const password = process.env.OPS_BASIC_AUTH_PASSWORD || process.env.CRM_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    actorId: process.env.OPS_BASIC_AUTH_ACTOR_ID || username,
    realm: 'Podovi Ops',
  };
}

export function canAccessCrm(request: NextRequest) {
  const config = getCrmBasicAuthConfig();
  if (!config) {
    return true;
  }

  return hasValidCredentials(request, config);
}

export function getCrmUnauthorizedResponse() {
  return unauthorizedResponse('CRM auth required', 'Podovi CRM');
}

export function requireOpsBasicAuth(request: NextRequest): InternalBasicAuthResult {
  const config = getOpsBasicAuthConfig();

  if (!config) {
    return {
      ok: false,
      response: opsDisabledResponse(),
    };
  }

  if (!hasValidCredentials(request, config)) {
    return {
      ok: false,
      response: unauthorizedResponse('OPS auth required', config.realm),
    };
  }

  return {
    ok: true,
    username: config.username,
    actorId: config.actorId,
  };
}

export function resolveAuthenticatedOpsActorId(
  auth: AuthSuccess,
  requestedActorId: string | null | undefined
): InternalBasicAuthResult | { ok: true; actorId: string } {
  const incomingActorId = String(requestedActorId || '').trim();

  if (incomingActorId && incomingActorId !== auth.actorId && incomingActorId !== auth.username) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: `Prosleđeni actorId mora da se poklopi sa autentifikovanim OPS identitetom (${auth.actorId}).`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    actorId: auth.actorId,
  };
}
