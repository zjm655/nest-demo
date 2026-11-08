import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function pickCookie(setCookies: string[] | undefined, name: string) {
  const hit = setCookies?.find((c) => c.startsWith(`${name}=`));
  return hit ? hit.split(';')[0] : '';
}

describe('E2E Auth', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `${Date.now()}@example.com`;
  const password = '123456';

  let loginAccess = '';
  let loginRefresh = '';
  let activeAccess = '';
  let activeRefresh = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser()); // 必须补，main.ts 里的中间件不会自动生效
    await app.init();

    prisma = app.get(PrismaService);
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } }); // 级联删除会话
    await app.close();
  });

  it('注册成功', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        nickname: 'e2e',
        password1: password,
        password2: password,
      })
      .expect(201);

    expect(res.body.data.email).toBe(email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('登录下发两个 Cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    loginAccess = pickCookie(cookies, 'access_token');
    loginRefresh = pickCookie(cookies, 'refresh_token');

    expect(loginAccess).toBeTruthy();
    expect(loginRefresh).toBeTruthy();
  });

  it('不带 Cookie 访问受保护路由返回 401', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(401);
    expect(res.body.code).toBe(401);
  });

  it('带 access Cookie 访问受保护路由返回 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Cookie', loginAccess)
      .expect(200);

    expect(res.body).toMatchObject({ code: 200, message: 'ok' });
    expect(typeof res.body.data).toBe('string');
  });

  it('刷新返回新的两个 Cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', loginRefresh)
      .expect(200);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    activeAccess = pickCookie(cookies, 'access_token');
    activeRefresh = pickCookie(cookies, 'refresh_token');

    expect(activeAccess).toBeTruthy();
    expect(activeRefresh).toBeTruthy();
    expect(activeRefresh).not.toBe(loginRefresh);
  });

  it('宽限期内复用旧 refresh 返回 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', loginRefresh)
      .expect(401);

    expect(res.body.code).toBe(401);
    expect(res.body.message).toContain('已被使用');
  });

  it('普通用户访问 admin 路由返回 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('Cookie', activeAccess)
      .expect(403);

    expect(res.body.code).toBe(403);
  });

  it('登出后 refresh 失效', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', activeRefresh)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', activeRefresh)
      .expect(401);
  });
});
