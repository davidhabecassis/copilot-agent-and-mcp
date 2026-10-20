const express = require('express');

// generated-by-copilot: backend review routes add validation, average rating, and request throttling.
const REVIEW_RATE_LIMIT_MS = 60000;

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  function normalizeReviews(book) {
    if (!book) return [];
    if (!Array.isArray(book.reviews)) {
      book.reviews = [];
    }
    return book.reviews;
  }

  function findBookById(bookId) {
    const books = readJSON(booksFile);
    return books.find(book => String(book.id) === String(bookId));
  }

  function buildAverageRating(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return Number((total / reviews.length).toFixed(2));
  }

  function validateReviewPayload(req, res, next) {
    const { rating, review } = req.body || {};
    const parsedRating = Number(rating);

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    if (typeof review !== 'string' || review.trim().length < 5) {
      return res.status(400).json({ message: 'Review text must be at least 5 characters long.' });
    }

    req.reviewData = {
      rating: parsedRating,
      review: review.trim(),
      username: req.user ? req.user.username : 'Anonymous',
      createdAt: new Date().toISOString(),
    };

    next();
  }

  function enforceReviewRateLimit(req, res, next) {
    const clientKey = req.headers['x-forwarded-for'] || req.ip || 'local';
    const now = Date.now();
    const rateLimitStore = router.rateLimitStore || new Map();
    router.rateLimitStore = rateLimitStore;

    const lastSubmission = rateLimitStore.get(clientKey) || 0;
    if (now - lastSubmission < REVIEW_RATE_LIMIT_MS) {
      return res.status(429).json({
        message: 'Too many review submissions. Please wait a minute and try again.',
      });
    }

    rateLimitStore.set(clientKey, now);
    next();
  }

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

  router.get('/:id/reviews', (req, res) => {
    const book = findBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const reviews = normalizeReviews(book).map(review => ({
      id: review.id,
      username: review.username || 'Anonymous',
      rating: Number(review.rating),
      review: review.review,
      createdAt: review.createdAt,
    }));

    return res.json(reviews);
  });

  router.get('/:id/average-rating', (req, res) => {
    const book = findBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const reviews = normalizeReviews(book);
    const averageRating = buildAverageRating(reviews);

    return res.json({
      bookId: book.id,
      averageRating,
      reviewCount: reviews.length,
    });
  });

  router.post('/:id/reviews', authenticateToken, enforceReviewRateLimit, validateReviewPayload, (req, res) => {
    const books = readJSON(booksFile);
    const book = books.find(item => String(item.id) === String(req.params.id));

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    if (!Array.isArray(book.reviews)) {
      book.reviews = [];
    }

    const review = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...req.reviewData,
    };

    book.reviews.push(review);
    writeJSON(booksFile, books);

    return res.status(201).json({
      message: 'Review added successfully.',
      review,
      averageRating: buildAverageRating(book.reviews),
    });
  });

  return router;
}

module.exports = createBooksRouter;
