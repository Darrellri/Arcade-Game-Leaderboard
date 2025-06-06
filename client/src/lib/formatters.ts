
export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
