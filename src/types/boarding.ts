export interface Booking {
  Booking_ID: string;
  seats: string[];
}

export interface ProcessedBooking extends Booking {
  maxSeatNumber: number;
  normalizedSeats: string[];
}

export interface BoardingSequence {
  sequence: number;
  Booking_ID: string;
  maxSeatNumber: number;
  seats: string[];
}

export interface ProcessingResult {
  success: boolean;
  data?: BoardingSequence[];
  errors?: string[];
}