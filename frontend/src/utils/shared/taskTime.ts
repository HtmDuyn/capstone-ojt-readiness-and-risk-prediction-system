const clock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export const vietnamTaskMinute = (date = new Date()) => clock.format(date).replace(' ', 'T');

export function displayTaskTime(value?: string | null) {
  if (!value) return '—';
  const date = value.slice(0,10).split('-').reverse().join('/');
  return value.length > 10 ? date+' '+value.slice(11,16) : date;
}
