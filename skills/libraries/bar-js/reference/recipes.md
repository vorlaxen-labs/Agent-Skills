# Recipes & Patterns

Production-ready patterns for common API scenarios using BaR. These examples mirror real-world usage in Vorlaxen backends.

---

## Health Check

```typescript
app.get('/health', (req, res) => {
  return res.builder.as.ok().message('Pong').build();
});

app.get('/health/deep', async (req, res) => {
  const builder = res.builder;

  await builder.wrap(healthService.checkAll());

  return builder
    .setMeta({ uptime: process.uptime() })
    .build();
});
```

---

## CRUD: Users

### List (Paginated)

```typescript
app.get('/api/users', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const { users, total } = await userService.findAll({ page, limit });

  return res.builder
    .as.ok(users, 'Users retrieved')
    .paginate(total, page, limit)
    .build();
});
```

### Get by ID

```typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);

  if (!user) {
    return res.builder.as.notFound(`User ${req.params.id} not found.`).build();
  }

  return res.builder.as.ok(user).build();
});
```

### Create

```typescript
app.post('/api/users', async (req, res) => {
  const existing = await userService.findByEmail(req.body.email);

  if (existing) {
    return res.builder.as.conflict('Email already registered.').build();
  }

  const user = await userService.create(req.body);

  return res.builder.as.created(
    { id: user.id, email: user.email },
    'User created successfully'
  ).build();
});
```

### Delete

```typescript
app.delete('/api/users/:id', async (req, res) => {
  const deleted = await userService.delete(req.params.id);

  if (!deleted) {
    return res.builder.as.notFound('User not found.').build();
  }

  return res.builder.as.noContent().build();
});
```

---

## Authentication Flow

### Sign In (with refresh cookie)

```typescript
app.post('/api/auth/sign-in', async (req, res) => {
  const result = await authService.signIn({
    email: req.body.email,
    password: req.body.password,
    ip: req.clientIp,
  });

  if ('tokens' in result) {
    res.cookie('refreshToken', result.tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.builder.as.ok(result).build();
});
```

### Sign In Verify (2FA)

```typescript
app.post('/api/auth/sign-in/verify', async (req, res) => {
  const result = await authService.verify({
    token: req.body.token,
    code: req.body.code,
  });

  if ('tokens' in result) {
    res.cookie('refreshToken', result.tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.builder.as.created(result, 'Sign in successful').build();
});
```

### Sign Out

```typescript
app.post('/api/auth/sign-out', async (req, res) => {
  await authService.revokeSession(req.cookies.refreshToken);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.builder.as.ok({ message: 'Session terminated' }).build();
});
```

---

## Admin Dashboard

### Stats Endpoint

```typescript
app.get('/api/admin/stats', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.builder.as.forbidden('Admin access required.').build();
  }

  const stats = await adminService.getStats();

  return res.builder.as.ok(stats).build();
});
```

### Paginated User List

```typescript
import { paginatedOk, parsePagination } from '@/shared/utils/pagination.util';

app.get('/api/admin/users', async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await adminUserService.list({ page, limit });

  paginatedOk(res.builder, result.users, result).build();
});
```

---

## Lookup / Reference Data

Simple read-only endpoints returning static or cached data:

```typescript
app.get('/api/lookup/provinces', async (req, res) => {
  const provinces = await lookupService.getProvinces();
  return res.builder.as.ok(provinces).build();
});

app.get('/api/lookup/districts', async (req, res) => {
  const districts = await lookupService.getDistricts(req.query.provinceId as string);
  return res.builder.as.ok(districts).build();
});
```

---

## Async with wrap()

When the service layer throws on failure:

```typescript
app.get('/api/reports/:id', async (req, res) => {
  const builder = res.builder;
  await builder.wrap(reportService.generate(req.params.id));

  return builder
    .setHeaders('Content-Type', 'application/json')
    .build();
});
```

---

## Conditional Response Building

```typescript
app.get('/api/profile', (req, res) => {
  return res.builder
    .as.ok(req.user)
    .when(req.user.role === 'admin', b => b.setHeaders('X-Admin', 'true'))
    .when(req.query.includeStats === 'true', b => {
      b.setMeta({ stats: computeUserStats(req.user) });
    })
    .build();
});
```

---

## Data Sanitization with transform()

Remove sensitive fields before sending:

```typescript
app.get('/api/users/:id', async (req, res) => {
  const builder = res.builder;
  await builder.wrap(userService.findById(req.params.id));

  return builder
    .transform(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
    }))
    .build();
});
```

---

## Middleware Factory Pattern

Centralize BaR setup in a factory:

```typescript
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

export class MiddlewareFactory {
  static applyCore(app: Application): void {
    const bar = new BarExpressAdapter({
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      logger: appLogger,
    });

    app.use(bar.handler());
    app.use(express.json({ limit: '10mb' }));
  }

  static applyErrorHandlers(app: Application): void {
    app.use(notFoundMiddleware);
    app.use(globalExceptionFilter);
  }
}
```

Register order:

```typescript
MiddlewareFactory.applyCore(app);
app.use('/api', apiRouter);
MiddlewareFactory.applyErrorHandlers(app);
```

---

## Controller Class Pattern

Keep routes thin with static controller methods:

```typescript
export class MeController {
  static getProfile = async (req: CustomRequest, res: CustomResponse) => {
    return res.builder.as.ok({ user: req.user }).build();
  };

  static updateProfile = async (req: CustomRequest, res: CustomResponse) => {
    const user = await meService.update(req.user!.id, req.body);
    return res.builder.as.ok({ user }, 'Profile updated').build();
  };
}
```

```typescript
router.get('/me', authGuard, MeController.getProfile);
router.patch('/me', authGuard, MeController.updateProfile);
```

---

## Background Job Accepted

```typescript
app.post('/api/exports', async (req, res) => {
  const jobId = await exportQueue.add(req.body);

  return res.builder
    .as.accepted('Export job queued')
    .data({ jobId, statusUrl: `/api/exports/${jobId}/status` })
    .setHeaders('Location', `/api/exports/${jobId}`)
    .build();
});
```

---

## Service Unavailable (Dependency Check)

```typescript
app.get('/api/orders', async (req, res) => {
  if (!await redis.ping()) {
    return res.builder.as.serviceUnavailable('Cache service unavailable.').build();
  }

  const orders = await orderService.findByUser(req.user.id);
  return res.builder.as.ok(orders).build();
});
```

---

## Choosing a Pattern

| Scenario | Pattern |
|---|---|
| Simple GET | `.as.ok(data).build()` |
| POST create | `.as.created(data, message).build()` |
| DELETE | `.as.noContent().build()` |
| List with pages | `.as.ok(items).paginate(...).build()` |
| Service throws | `await builder.wrap(promise); builder.build()` |
| Expected failure | `.as.notFound()` / `.as.conflict()` etc. |
| Unexpected throw | Global exception filter with builder |
| Auth cookie | `res.cookie()` + `.as.ok().build()` |
| Admin-only | Guard check → `.as.forbidden()` |

> **TIP:**
