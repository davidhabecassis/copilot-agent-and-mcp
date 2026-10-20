import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';

export const setSort = createAction('books/setSort', (payload = {}) => ({
  payload: {
    sortBy: payload.sortBy || 'title',
    sortOrder: payload.sortOrder || 'asc',
  },
}));

export const fetchBooks = createAsyncThunk('books/fetchBooks', async ({ sortBy, sortOrder } = {}) => {
  const params = new URLSearchParams();
  if (sortBy) params.set('sort', sortBy);
  if (sortOrder) params.set('order', sortOrder);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`http://localhost:4000/api/books${query}`);
  return res.json();
});

const booksSlice = createSlice({
  name: 'books',
  initialState: { items: [], status: 'idle', sortBy: 'title', sortOrder: 'asc' },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(setSort, (state, action) => {
        state.sortBy = action.payload.sortBy;
        state.sortOrder = action.payload.sortOrder;
      })
      .addCase(fetchBooks.pending, state => { state.status = 'loading'; })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBooks.rejected, state => { state.status = 'failed'; });
  },
});

export default booksSlice.reducer;
