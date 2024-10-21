import moment from 'moment';

export function formatDateTime(ts?: number | Date | null): string {
    if (!ts) return '';
    const date = typeof ts === 'number' ? new Date(ts) : ts;
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
}
