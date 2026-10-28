process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-suite-super-secret-key-32-chars-long';
process.env.CLIENT_URL = 'https://trainsure.vercel.app';

import http from 'http';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { app } from '../server.ts';
import { maskMongoUri } from '../server/config/database.ts';
import { generateToken } from '../server/middleware/auth.ts';

async function runDeploymentVerification() {
  console.log('\n======================================================');
  console.log('  TrainSure Pre-Deployment Automated Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✓ [PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ✗ [FAIL] ${name}`);
        console.error(`    Error: ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. Unit: MongoDB URI Masking
  await test('Security: maskMongoUri masks credentials properly', () => {
    const raw = 'mongodb+srv://adminUser:SuperSecret123@cluster0.abcde.mongodb.net/trainsure';
    const masked = maskMongoUri(raw);
    assert.strictEqual(masked, 'mongodb+srv://***:***@cluster0.abcde.mongodb.net/trainsure');
    assert(!masked.includes('adminUser'), 'Masked URI must not leak username');
    assert(!masked.includes('SuperSecret123'), 'Masked URI must not leak password');
  });

  // 2. Unit: Password Hashing & Comparison
  await test('Security: bcrypt password hashing and verification', async () => {
    const password = 'ProductionPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    assert.notStrictEqual(password, hash);
    const isMatch = await bcrypt.compare(password, hash);
    assert.strictEqual(isMatch, true);
    const isWrong = await bcrypt.compare('WrongPassword!', hash);
    assert.strictEqual(isWrong, false);
  });

  // 3. Unit: JWT Generation
  await test('Auth: JWT generation with payload and expiration', () => {
    const mockUser: any = {
      _id: '507f191e810c19729de860ea',
      employeeId: 'EMP-1001',
      email: 'admin@trainsure.internal',
      role: 'ADMIN',
      name: 'System Admin',
    };
    const token = generateToken(mockUser);
    assert(typeof token === 'string' && token.length > 20, 'Token must be a valid JWT string');
  });

  // 4. HTTP Integration Tests
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test Health Endpoint
    await test('HTTP: GET /api/health returns 200 with service status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'UP');
      assert(body.data.database, 'Database status must be reported');
      assert.strictEqual(body.data.environment, 'test');
    });

    // Test Root Endpoint
    await test('HTTP: GET / returns 200 with TrainSure service metadata', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.status, 'ONLINE');
      assert.strictEqual(body.healthCheck, '/api/health');
    });

    // Test 404 Handler
    await test('HTTP: GET /api/unmatched-endpoint returns structured 404', async () => {
      const res = await fetch(`${baseUrl}/api/unmatched-endpoint`);
      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'NOT_FOUND');
    });

    // Test CORS Preflight
    await test('CORS: OPTIONS preflight respects configured CLIENT_URL', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://trainsure.vercel.app',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization, Content-Type',
        },
      });
      assert.strictEqual(res.status, 204);
      assert.strictEqual(
        res.headers.get('access-control-allow-origin'),
        'https://trainsure.vercel.app'
      );
      assert(
        res.headers.get('access-control-allow-methods')?.includes('GET'),
        'Must allow GET method'
      );
    });

    // Test Protected Route without Token
    await test('Auth: Protected endpoint rejects request without Bearer token', async () => {
      const res = await fetch(`${baseUrl}/api/users`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'UNAUTHORIZED');
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n------------------------------------------------------');
  console.log(`  Tests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runDeploymentVerification().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
