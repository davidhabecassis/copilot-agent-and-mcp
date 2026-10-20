const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, '../data/test-users.json'),
  booksFile: path.join(__dirname, '../data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(), // No auth for books
  SECRET_KEY: 'test_secret',
}));

describe('Books API', () => {
  it('GET /api/books should return a list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/books should sort by title ascending by default', async () => {
    const res = await request(app).get('/api/books?sort=title&order=asc');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].title).toBe('1984');
    expect(res.body[1].title).toBe('To Kill a Mockingbird');
  });

  it('GET /api/books should sort by author descending', async () => {
    const res = await request(app).get('/api/books?sort=author&order=desc');
    expect(res.statusCode).toBe(200);
    const authors = res.body.map(book => book.author);
    expect(authors[0]).toBe('William Faulkner');
    expect(authors[authors.length - 1]).toBe('Aldous Huxley');
  });

  it('POST /api/books should not be allowed', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Test Book', author: 'Test Author' });
    expect([404, 405]).toContain(res.statusCode);
  });
});
