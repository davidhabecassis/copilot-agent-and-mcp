import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, clearFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const error = useAppSelector(state => state.favorites.error);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleClearAll = async () => {
    if (!token) {
      navigate('/');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to clear all favorite books?');
    if (!confirmed) return;

    try {
      await dispatch(clearFavorites(token)).unwrap();
      setConfirmClear(false);
    } catch (err) {
      alert('Unable to clear favorites right now. Please try again.');
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>{error || 'Failed to load favorites.'}</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>

      {favorites.length > 0 && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            style={{
              background: '#d9534f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {confirmClear && (
        <div style={{
          background: '#fff4f4',
          border: '1px solid #f0c7c7',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          maxWidth: '420px',
        }}>
          <p>Are you sure you want to clear all favorite books?</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={handleClearAll}>Yes, clear all</button>
            <button type="button" onClick={() => setConfirmClear(false)}>Cancel</button>
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
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
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        <ul>
          {favorites.map(book => (
            <li key={book.id}>
              <strong>{book.title}</strong> by {book.author}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Favorites;
