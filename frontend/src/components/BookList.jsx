import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks, setSort } from '../store/booksSlice';
import { addFavorite, fetchFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/BookList.module.css';

// generated-by-copilot: Added review form, average rating, and review list rendering to the book cards.
const defaultReviewForm = { rating: '5', review: '' };

const BookList = () => {
  const dispatch = useAppDispatch();
  const books = useAppSelector(state => state.books.items);
  const status = useAppSelector(state => state.books.status);
  const sortBy = useAppSelector(state => state.books.sortBy);
  const sortOrder = useAppSelector(state => state.books.sortOrder);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  const favorites = useAppSelector(state => state.favorites.items);
  const [reviewForm, setReviewForm] = useState({});
  const [reviewData, setReviewData] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});

  useEffect(() => {
    const savedSort = localStorage.getItem('bookSort');
    if (savedSort) {
      try {
        const parsed = JSON.parse(savedSort);
        dispatch(setSort({ sortBy: parsed.sortBy || 'title', sortOrder: parsed.sortOrder || 'asc' }));
      } catch (error) {
        localStorage.removeItem('bookSort');
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    localStorage.setItem('bookSort', JSON.stringify({ sortBy, sortOrder }));
    dispatch(fetchBooks({ sortBy, sortOrder }));
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate, sortBy, sortOrder]);

  useEffect(() => {
    if (!books.length) return;
    books.forEach(book => {
      fetchBookReviewSummary(book.id);
    });
  }, [books]);

  const fetchBookReviewSummary = async (bookId) => {
    try {
      const [reviewsRes, averageRes] = await Promise.all([
        fetch(`http://localhost:4000/api/books/${bookId}/reviews`),
        fetch(`http://localhost:4000/api/books/${bookId}/average-rating`),
      ]);

      const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
      const averageData = averageRes.ok ? await averageRes.json() : { averageRating: 0, reviewCount: 0 };

      setReviewData(prev => ({
        ...prev,
        [bookId]: {
          reviews,
          averageRating: Number(averageData.averageRating) || 0,
          reviewCount: Number(averageData.reviewCount) || 0,
        },
      }));
    } catch (error) {
      setReviewData(prev => ({
        ...prev,
        [bookId]: { reviews: [], averageRating: 0, reviewCount: 0 },
      }));
    }
  };

  const handleAddFavorite = async (bookId) => {
    if (!token) {
      navigate('/');
      return;
    }
    await dispatch(addFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  const handleSortChange = event => {
    dispatch(setSort({ sortBy: event.target.value, sortOrder }));
  };

  const handleSortOrderToggle = () => {
    dispatch(setSort({ sortBy, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' }));
  };

  const handleReviewFieldChange = (bookId, field, value) => {
    setReviewForm(prev => ({
      ...prev,
      [bookId]: {
        ...(prev[bookId] || defaultReviewForm),
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (bookId) => {
    if (!token) {
      navigate('/login');
      return;
    }

    const form = reviewForm[bookId] || defaultReviewForm;
    if (!form.review || form.review.trim().length < 5) {
      setReviewStatus(prev => ({
        ...prev,
        [bookId]: { loading: false, error: 'Review text must be at least 5 characters long.' },
      }));
      return;
    }

    setReviewStatus(prev => ({
      ...prev,
      [bookId]: { loading: true, error: '' },
    }));

    try {
      const response = await fetch(`http://localhost:4000/api/books/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: Number(form.rating),
          review: form.review,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review.');
      }

      setReviewForm(prev => ({
        ...prev,
        [bookId]: { ...defaultReviewForm },
      }));
      await fetchBookReviewSummary(bookId);
      setReviewStatus(prev => ({
        ...prev,
        [bookId]: { loading: false, error: '' },
      }));
    } catch (error) {
      setReviewStatus(prev => ({
        ...prev,
        [bookId]: { loading: false, error: error.message },
      }));
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load books.</div>;

  return (
    <div>
      <h2>Books</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label htmlFor="book-sort">Sort by</label>
        <select id="book-sort" value={sortBy} onChange={handleSortChange}>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
        <button type="button" onClick={handleSortOrderToggle}>
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        <span aria-live="polite">
          Current: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} ({sortOrder === 'asc' ? 'A→Z' : 'Z→A'})
        </span>
      </div>
      {books.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No books available.</p>
          <p>Check back later or add a new book if you have permission.</p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {books.map(book => {
            const isFavorite = favorites.some(fav => fav.id === book.id);
            const bookReviews = reviewData[book.id] || { reviews: [], averageRating: 0, reviewCount: 0 };
            const currentForm = reviewForm[book.id] || defaultReviewForm;
            const reviewFeedback = reviewStatus[book.id] || { loading: false, error: '' };

            return (
              <div className={styles.bookCard + ' ' + styles.bookCardWithHeart} key={book.id}>
                {isFavorite && (
                  <span className={styles.favoriteHeart} title="In Favorites">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e25555" stroke="#e25555" strokeWidth="1.5">
                      <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z"/>
                    </svg>
                  </span>
                )}
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookAuthor}>by {book.author}</div>

                <div className={styles.reviewSection}>
                  <div className={styles.reviewHeader}>
                    <strong>Reviews</strong>
                    <span className={styles.averageBadge}>
                      {bookReviews.reviewCount > 0 ? `${bookReviews.averageRating.toFixed(1)} / 5` : 'No ratings'}
                    </span>
                  </div>

                  <div className={styles.reviewList}>
                    {bookReviews.reviews.length > 0 ? (
                      bookReviews.reviews.map(review => (
                        <div key={review.id} className={styles.reviewItem}>
                          <div className={styles.reviewMetaRow}>
                            <span className={styles.reviewAuthor}>{review.username}</span>
                            <span className={styles.reviewStars}>
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </div>
                          <p>{review.review}</p>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptyReviewText}>No reviews yet.</p>
                    )}
                  </div>

                  <div className={styles.reviewForm}>
                    <label className={styles.reviewLabel} htmlFor={`rating-${book.id}`}>Rating</label>
                    <select
                      id={`rating-${book.id}`}
                      value={currentForm.rating}
                      onChange={event => handleReviewFieldChange(book.id, 'rating', event.target.value)}
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>

                    <label className={styles.reviewLabel} htmlFor={`review-${book.id}`}>Your review</label>
                    <textarea
                      id={`review-${book.id}`}
                      value={currentForm.review}
                      onChange={event => handleReviewFieldChange(book.id, 'review', event.target.value)}
                      rows="3"
                      placeholder="Share your thoughts about this book"
                    />

                    <button
                      type="button"
                      className={styles.simpleBtn}
                      onClick={() => handleReviewSubmit(book.id)}
                      disabled={reviewFeedback.loading}
                    >
                      {reviewFeedback.loading ? 'Submitting...' : 'Submit Review'}
                    </button>

                    {reviewFeedback.error && (
                      <div className={styles.reviewError}>{reviewFeedback.error}</div>
                    )}
                  </div>
                </div>

                <button
                  className={styles.simpleBtn}
                  onClick={() => handleAddFavorite(book.id)}
                >
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookList;
