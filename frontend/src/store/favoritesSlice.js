import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async (token) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch favorites');
  }

  return res.json();
});

export const addFavorite = createAsyncThunk('favorites/addFavorite', async ({ token, bookId }) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });

  if (!res.ok) {
    throw new Error('Failed to add favorite');
  }

  return bookId;
});

export const clearFavorites = createAsyncThunk('favorites/clearFavorites', async (token) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to clear favorites');
  }

  return res.json();
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFavorites.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchFavorites.rejected, state => {
        state.status = 'failed';
        state.error = 'Failed to load favorites.';
      })
      .addCase(addFavorite.fulfilled, () => {
        // The caller refetches the favorites list after a successful add.
      })
      .addCase(clearFavorites.fulfilled, state => {
        state.items = [];
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(clearFavorites.rejected, state => {
        state.status = 'failed';
        state.error = 'Failed to clear favorites.';
      });
  },
});

export default favoritesSlice.reducer;
