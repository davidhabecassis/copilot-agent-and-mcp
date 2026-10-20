const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const books = readJSON(booksFile);
    const sortBy = ['title', 'author'].includes(req.query.sort) ? req.query.sort : 'title';
    const order = req.query.order === 'desc' ? 'desc' : 'asc';

    const sortedBooks = [...books].sort((a, b) => {
      const valueA = String(a[sortBy] || '').toLowerCase();
      const valueB = String(b[sortBy] || '').toLowerCase();
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    res.json(sortedBooks);
  });

  return router;
}

module.exports = createBooksRouter;
