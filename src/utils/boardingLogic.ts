import type { Booking, ProcessedBooking, BoardingSequence, ProcessingResult } from '@/types/boarding';

/**
 * Normalizes seat format to extract seat number
 * Handles formats like: A1, B02, C003, a1, b02, etc.
 */
export function normalizeSeat(seat: string): { seatNumber: number; normalizedSeat: string } | null {
  const cleaned = seat.trim().toUpperCase();
  const match = cleaned.match(/^([A-Z]+)(\d+)$/);
  
  if (!match) {
    return null;
  }
  
  const [, rowLetter, seatNum] = match;
  const seatNumber = parseInt(seatNum, 10);
  
  if (isNaN(seatNumber) || seatNumber <= 0) {
    return null;
  }
  
  return {
    seatNumber,
    normalizedSeat: `${rowLetter}${seatNumber}`
  };
}

/**
 * Processes a single booking to find the maximum seat number
 */
export function processBooking(booking: Booking): ProcessedBooking | null {
  const normalizedSeats: string[] = [];
  const seatNumbers: number[] = [];
  
  for (const seat of booking.seats) {
    const normalized = normalizeSeat(seat);
    if (normalized) {
      normalizedSeats.push(normalized.normalizedSeat);
      seatNumbers.push(normalized.seatNumber);
    }
  }
  
  if (seatNumbers.length === 0) {
    return null; // No valid seats found
  }
  
  const maxSeatNumber = Math.max(...seatNumbers);
  
  return {
    ...booking,
    maxSeatNumber,
    normalizedSeats
  };
}

/**
 * Generates boarding sequence based on the rules
 */
export function generateBoardingSequence(bookings: Booking[]): ProcessingResult {
  const errors: string[] = [];
  const processedBookings: ProcessedBooking[] = [];
  
  // Process each booking
  for (const booking of bookings) {
    if (!booking.Booking_ID || !booking.seats || booking.seats.length === 0) {
      errors.push(`Invalid booking: ${booking.Booking_ID || 'Unknown ID'} - missing ID or seats`);
      continue;
    }
    
    const processed = processBooking(booking);
    if (!processed) {
      errors.push(`Booking ${booking.Booking_ID}: No valid seats found`);
      continue;
    }
    
    processedBookings.push(processed);
  }
  
  if (processedBookings.length === 0) {
    return {
      success: false,
      errors: errors.length > 0 ? errors : ['No valid bookings found']
    };
  }
  
  // Sort by descending max seat number, then by ascending Booking_ID
  processedBookings.sort((a, b) => {
    if (a.maxSeatNumber !== b.maxSeatNumber) {
      return b.maxSeatNumber - a.maxSeatNumber; // Descending by seat number
    }
    return a.Booking_ID.localeCompare(b.Booking_ID); // Ascending by Booking_ID
  });
  
  // Generate sequence
  const boardingSequence: BoardingSequence[] = processedBookings.map((booking, index) => ({
    sequence: index + 1,
    Booking_ID: booking.Booking_ID,
    maxSeatNumber: booking.maxSeatNumber,
    seats: booking.normalizedSeats
  }));
  
  return {
    success: true,
    data: boardingSequence,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Parses CSV content into bookings
 */
export function parseCSV(csvContent: string): Booking[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  const bookings: Booking[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && (line.toLowerCase().includes('booking') || line.toLowerCase().includes('seat'))) {
      continue; // Skip header row
    }
    
    const parts = line.split(',').map(part => part.trim());
    if (parts.length < 2) continue;
    
    const bookingId = parts[0];
    const seats = parts.slice(1).filter(seat => seat);
    
    if (bookingId && seats.length > 0) {
      bookings.push({
        Booking_ID: bookingId,
        seats
      });
    }
  }
  
  return bookings;
}

/**
 * Exports boarding sequence to CSV format
 */
export function exportToCSV(boardingSequence: BoardingSequence[]): string {
  const headers = ['Seq', 'Booking_ID', 'Max_Seat_Number', 'Seats'];
  const rows = boardingSequence.map(item => [
    item.sequence.toString(),
    item.Booking_ID,
    item.maxSeatNumber.toString(),
    item.seats.join(';')
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}