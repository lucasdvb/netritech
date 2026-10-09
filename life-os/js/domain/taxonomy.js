export const SECTIONS = [
  { id: 'morning', label: 'Morning', icon: 'sunrise' },
  { id: 'body', label: 'Body', icon: 'activity' },
  { id: 'mind', label: 'Mind', icon: 'book-open' },
  { id: 'spirit', label: 'Spirit', icon: 'sparkle' },
  { id: 'life', label: 'Life', icon: 'briefcase' },
  { id: 'evening', label: 'Evening', icon: 'moon' },
];

export const CATEGORIES = [
  { id: 'body', label: 'Body', icon: 'activity' },
  { id: 'health', label: 'Health', icon: 'heart-pulse' },
  { id: 'posture', label: 'Posture', icon: 'person-standing' },
  { id: 'mind', label: 'Mind', icon: 'book-open' },
  { id: 'spirit', label: 'Spirit', icon: 'sparkle' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'relationships', label: 'Relationships', icon: 'heart' },
  { id: 'life', label: 'Life admin', icon: 'house' },
];

export const HABIT_TYPES = [
  { id: 'binary', label: 'Done / not done', hint: 'One tap.' },
  { id: 'numeric', label: 'Number', hint: 'Water, protein — anything with a unit.' },
  { id: 'duration', label: 'Duration', hint: 'Minutes or hours.' },
  { id: 'quantity', label: 'Count', hint: 'Reps, steps, breaks.' },
  { id: 'rating', label: 'Rating 1–10', hint: 'Energy, mood, quality.' },
  { id: 'check', label: 'Yes / no check', hint: 'A health or lifestyle check.' },
  { id: 'limit', label: 'Less', hint: 'Cut down or quit: at most so many a day.' },
];

export const SCHEDULES = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Specific days' },
  { id: 'perWeek', label: 'Times per week' },
  { id: 'perMonth', label: 'Times per month' },
  { id: 'interval', label: 'Every few days' },
];

export const MODES = {
  normal: { label: 'Normal day', short: 'Normal', icon: 'activity' },
  minimum: { label: 'Minimum day', short: 'Minimum', icon: 'leaf', hint: 'Just the essentials. Never abandon the system completely.' },
  rest: { label: 'Rest day', short: 'Rest', icon: 'sofa', hint: 'Lower intensity: walking, mobility, family.' },
  sick: { label: 'Sick day', short: 'Sick', icon: 'thermometer', hint: 'Rest, fluids, food, sleep. Scoring is paused.' },
  // Set by a fresh start after time away, never chosen by hand.
  away: { label: 'Away', short: 'Away', icon: 'compass', hint: 'Time away. Nothing was expected, and runs skip it.', auto: true },
};

export const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;
// Only known categories become colours: the id lands in CSS and markup, so anything else is 'life'.
export const catColor = (id) => `var(--c-${CATEGORIES.some((c) => c.id === id) ? id : 'life'})`;
export const habitColor = (h) => catColor(h?.color || h?.category);
export const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label || id;
