import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { BoardingSequence } from '@/types/boarding';
import { exportToCSV } from '@/utils/boardingLogic';

interface BoardingResultsProps {
  boardingSequence: BoardingSequence[];
  errors?: string[];
}

export function BoardingResults({ boardingSequence, errors }: BoardingResultsProps) {
  const downloadCSV = () => {
    const csvContent = exportToCSV(boardingSequence);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `boarding-sequence-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    const text = boardingSequence
      .map(item => `${item.sequence}\t${item.Booking_ID}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(`Seq\tBooking_ID\n${text}`);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Boarding Sequence
          </div>
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              Copy
            </Button>
            <Button onClick={downloadCSV} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors && errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Processing Warnings:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-background border rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted font-medium text-sm">
            <div>Seq</div>
            <div>Booking ID</div>
            <div>Max Seat #</div>
            <div>Seats</div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {boardingSequence.map((item) => (
              <div
                key={item.Booking_ID}
                className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">
                  <Badge variant="outline">{item.sequence}</Badge>
                </div>
                <div className="font-mono">{item.Booking_ID}</div>
                <div className="text-muted-foreground">{item.maxSeatNumber}</div>
                <div className="text-sm">
                  <div className="flex flex-wrap gap-1">
                    {item.seats.map((seat, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {seat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <div className="font-medium mb-2">Boarding Rules Applied:</div>
          <ul className="space-y-1">
            <li>• Passengers with seats farther back (higher numbers) board first</li>
            <li>• For multiple seats per booking, the highest seat number determines priority</li>
            <li>• Ties are broken by Booking ID (ascending order)</li>
            <li>• Row letters are ignored for distance calculation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}