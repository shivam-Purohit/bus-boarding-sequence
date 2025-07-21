import { useState } from 'react';
import { Bus, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Booking, BoardingSequence } from '@/types/boarding';
import { generateBoardingSequence, parseCSV, exportToCSV } from '@/utils/boardingLogic';

export default function SimpleBoardingGenerator() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<BoardingSequence[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const processInput = () => {
    if (!inputText.trim()) {
      setErrors(['Please enter booking data']);
      setResult(null);
      return;
    }

    try {
      const bookings = parseCSV(inputText);
      const processingResult = generateBoardingSequence(bookings);
      
      if (processingResult.success && processingResult.data) {
        setResult(processingResult.data);
        setErrors(processingResult.errors || []);
      } else {
        setResult(null);
        setErrors(processingResult.errors || ['Failed to process bookings']);
      }
    } catch (error) {
      setResult(null);
      setErrors([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const downloadCSV = () => {
    if (!result) return;
    
    const csvContent = exportToCSV(result);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boarding-sequence-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setInputText('');
    setResult(null);
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
            <Bus className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Bus Boarding Sequence</h1>
          <p className="text-muted-foreground">Generate boarding order based on seat distance</p>
        </div>

        {!result ? (
          /* Input Section */
          <Card>
            <CardHeader>
              <CardTitle>Enter Booking Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="booking-data">Paste CSV data or upload file:</Label>
                <Textarea
                  id="booking-data"
                  placeholder="Booking_ID, Seat1, Seat2, ...&#10;120, A1, A2&#10;121, C20, C21, C22&#10;100, B15"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button variant="outline" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </span>
                    </Button>
                  </Label>
                </div>
                
                <Button onClick={processInput} disabled={!inputText.trim()}>
                  Generate Sequence
                </Button>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Results Section */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Boarding Sequence
                <div className="flex gap-2">
                  <Button onClick={downloadCSV} size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={reset} variant="outline" size="sm">
                    New Sequence
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded font-medium text-sm">
                  <div>Seq</div>
                  <div>Booking ID</div>
                  <div>Seats</div>
                </div>
                
                {result.map((item) => (
                  <div key={item.Booking_ID} className="grid grid-cols-3 gap-4 p-3 border rounded">
                    <div>
                      <Badge variant="outline">{item.sequence}</Badge>
                    </div>
                    <div className="font-mono">{item.Booking_ID}</div>
                    <div className="flex flex-wrap gap-1">
                      {item.seats.map((seat, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {seat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {errors.length > 0 && (
                <Alert className="mt-4">
                  <AlertDescription>
                    <div className="font-medium mb-1">Warnings:</div>
                    <ul className="list-disc list-inside text-sm">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="text-sm">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Rules:</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Higher seat numbers board first</li>
                  <li>• Ties broken by Booking ID</li>
                  <li>• Row letters ignored</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Format:</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• CSV: Booking_ID, Seat1, Seat2, ...</li>
                  <li>• Example: 120, A1, A2</li>
                  <li>• Case insensitive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}