import { CalendarDate, parseDate } from '@internationalized/date';

/**
 * Parser ngày an toàn mà xử lý các định dạng ngày không hợp lệ
 * @param dateString Chuỗi ngày để phân tích
 * @returns CalendarDate hoặc null nếu phân tích thất bại
 */
export function safeParseDate(
  dateString: string | null | undefined
): CalendarDate | null {
  if (!dateString?.trim()) return null;

  try {
    return parseDate(dateString);
  } catch {
    // Fallback to JavaScript Date for other formats
    const jsDate = new Date(dateString);
    if (!isNaN(jsDate.getTime())) {
      return new CalendarDate(
        jsDate.getFullYear(),
        jsDate.getMonth() + 1,
        jsDate.getDate()
      );
    }
  }

  return null;
}

/**
 * Format CalendarDate thành chuỗi ngày theo định dạng YYYY-MM-DD
 * @param date CalendarDate để format
 * @returns Chuỗi ngày theo định dạng YYYY-MM-DD hoặc chuỗi rỗng nếu date là null
 */
export function formatCalendarDateToString(date: CalendarDate | null): string {
  if (!date) return '';
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
