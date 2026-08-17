import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { APP_VERSION } from './../src/version';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) serves the API status page', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('Lumac Transportes');
    expect(response.text).toContain('API do Sistema de Gestão de Transporte');
    expect(response.text).toContain('Operacional');
    expect(response.text).toContain(APP_VERSION);
  });

  afterEach(async () => {
    await app.close();
  });
});
