export function formatElapsedTime(milliseconds: number): string {
    if (!milliseconds || milliseconds < 0) return 'N/A';

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const ms = milliseconds % 1000;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    if (ms > 0 || parts.length === 0) parts.push(`${ms}ms`);

    return parts.join(' ');
} 