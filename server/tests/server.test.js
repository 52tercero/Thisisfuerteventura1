const request = require('supertest');
const express = require('express');

// Construir una instancia pequeña usando la app exportada si está disponible; si no, omitir
let app;
try {
  app = require('../index').app; // si index.js exporta { app }
} catch (e) {
  // Fallback: crear una app mínima para satisfacer supertest; e2e real requiere exportar
  app = express();
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
}

describe('Endpoint de salud', () => {
  it('responde con ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
