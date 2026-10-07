// The day record: one per date, holding the day's mode, Top 3, check-in, shutdown and win.
import * as store from '../data/store.js';

export const reviewOf = (date) => store.get('dailyReviews', date) || { id: date, date };
export const saveReview = (date, patch) => store.put('dailyReviews', { ...reviewOf(date), ...patch, id: date, date });
