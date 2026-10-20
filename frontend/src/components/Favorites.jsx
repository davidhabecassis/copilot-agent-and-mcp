import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, clearFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleClearFavorites = async () => {
    if (!token) {
      navigate('/');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to clear all favorite books?');
    if (!confirmed) return;

    await dispatch(clearFavorites(token));
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>
      {favorites.length > 0 && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button
            type="button"
            onClick={handleClearFavorites}
            disabled={status === 'clearing'}
            style={{
              background: '#e25555',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.6rem 1rem',
              cursor: status === 'clearing' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'clearing' ? 'Clearing...' : 'Clear All'}
          </button>
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
