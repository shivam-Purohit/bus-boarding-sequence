import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Booking } from '@/types/boarding';

interface ManualInputProps {
  onBookingsChange: (bookings: Booking[]) => void;
  disabled?: boolean;
}

interface BookingInput {
  id: string;
  Booking_ID: string;
  seatsInput: string;
}

export function ManualInput({ onBookingsChange, disabled }: ManualInputProps) {
  const [bookings, setBookings] = useState<BookingInput[]>([
    { id: '1', Booking_ID: '', seatsInput: '' }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  const addBooking = () => {
    const newBooking: BookingInput = {
      id: Date.now().toString(),
      Booking_ID: '',
      seatsInput: ''
    };
    setBookings([...bookings, newBooking]);
  };

  const removeBooking = (id: string) => {
    if (bookings.length > 1) {
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  const updateBooking = (id: string, field: keyof Omit<BookingInput, 'id'>, value: string) => {
    const updated = bookings.map(booking =>
      booking.id === id ? { ...booking, [field]: value } : booking
    );
    setBookings(updated);
    validateAndSubmit(updated);
  };

  const validateAndSubmit = (currentBookings: BookingInput[]) => {
    const validationErrors: string[] = [];
    const validBookings: Booking[] = [];

    currentBookings.forEach((booking, index) => {
      if (!booking.Booking_ID.trim()) {
        if (booking.seatsInput.trim()) {
          validationErrors.push(`Row ${index + 1}: Booking ID is required`);
        }
        return;
      }

      if (!booking.seatsInput.trim()) {
        validationErrors.push(`Row ${index + 1}: At least one seat is required`);
        return;
      }

      const seats = booking.seatsInput
        .split(/[,;\s]+/)
        .map(s => s.trim())
        .filter(s => s);

      if (seats.length === 0) {
        validationErrors.push(`Row ${index + 1}: No valid seats found`);
        return;
      }

      validBookings.push({
        Booking_ID: booking.Booking_ID.trim(),
        seats
      });
    });

    setErrors(validationErrors);
    onBookingsChange(validBookings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Manual Input
          <Button
            onClick={addBooking}
            size="sm"
            variant="outline"
            disabled={disabled}
            className="ml-auto"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Booking
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking, index) => (
          <div key={booking.id} className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor={`booking-${booking.id}`}>
                Booking ID
              </Label>
              <Input
                id={`booking-${booking.id}`}
                value={booking.Booking_ID}
                onChange={(e) => updateBooking(booking.id, 'Booking_ID', e.target.value)}
                placeholder="e.g., 120"
                disabled={disabled}
              />
            </div>
            
            <div className="flex-[2]">
              <Label htmlFor={`seats-${booking.id}`}>
                Seats (comma or space separated)
              </Label>
              <Input
                id={`seats-${booking.id}`}
                value={booking.seatsInput}
                onChange={(e) => updateBooking(booking.id, 'seatsInput', e.target.value)}
                placeholder="e.g., A1, A2, B15"
                disabled={disabled}
              />
            </div>
            
            <Button
              onClick={() => removeBooking(booking.id)}
              size="sm"
              variant="outline"
              disabled={disabled || bookings.length <= 1}
              className="h-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Seat Format Examples:</h4>
          <div className="text-sm text-muted-foreground">
            <p>• A1, B2, C3 (comma separated)</p>
            <p>• A1 B2 C3 (space separated)</p>
            <p>• A01, B02, C003 (with leading zeros)</p>
            <p>• a1, b2, c3 (case insensitive)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}