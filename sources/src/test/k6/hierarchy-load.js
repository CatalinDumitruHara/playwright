// PT-009 — Carga sobre GET /api/admin/hierarchy (NFR-001).
// Precondición: entorno poblado con >= 10.000 usuarios con relaciones jerárquicas.
// Uso: k6 run -e BASE_URL=https://host -e ADMIN_TOKEN=<jwt ADMINISTRADOR> sources/src/test/k6/hierarchy-load.js
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.ADMIN_TOKEN || '';

export const options = {
  scenarios: {
    hierarchy_first_page: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{name:hierarchy_first_page}': ['p(95)<800'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/admin/hierarchy?page=1&size=20`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    tags: { name: 'hierarchy_first_page' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'HierarchyList': (r) => {
      const b = r.json();
      return Array.isArray(b.items) && typeof b.total === 'number' && b.page === 1 && b.size === 20;
    },
  });
}
