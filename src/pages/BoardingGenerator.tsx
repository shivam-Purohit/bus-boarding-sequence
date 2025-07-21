import { useState } from 'react';
import { Bus, Upload, Edit3, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { ManualInput } from '@/components/ManualInput';
import { BoardingResults } from '@/components/BoardingResults';
import type { Booking, BoardingSequence, ProcessingResult } from '@/types/boarding';
import { generateBoardingSequence, parseCSV } from '@/utils/boardingLogic';

export default function BoardingGenerator() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileContent = (content: string) => {
    setProcessing(true);
    try {
      const parsedBookings = parseCSV(content);
      setBookings(parsedBookings);
      
      if (parsedBookings.length > 0) {
        const generatedResult = generateBoardingSequence(parsedBookings);
        setResult(generatedResult);
      } else {
        setResult({
          success: false,
          errors: ['No valid bookings found in the uploaded file']
        });
      }
    } catch (error) {
      setResult({
        success: false,
        errors: [`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualBookings = (manualBookings: Booking[]) => {
    setBookings(manualBookings);
    
    if (manualBookings.length > 0) {
      const generatedResult = generateBoardingSequence(manualBookings);
      setResult(generatedResult);
    } else {
      setResult(null);
    }
  };

  const resetAll = () => {
    setBookings([]);
    setResult(null);
  };

  const hasResults = result?.success && result.data && result.data.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-transport-blue-light/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-transport-blue to-transport-blue/80 shadow-elegant mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-transport-blue to-transport-blue/80 bg-clip-text text-transparent">
            Bus Boarding Sequence Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate optimal boarding sequences based on seat distance from the front. 
            Passengers seated farther back board first for efficient loading.
          </p>
        </div>

        {!hasResults ? (
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Manual Input
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <FileUpload 
                  onFileContent={handleFileContent} 
                  disabled={processing}
                />
              </TabsContent>

              <TabsContent value="manual">
                <ManualInput 
                  onBookingsChange={handleManualBookings}
                  disabled={processing}
                />
              </TabsContent>
            </Tabs>

            {result && !result.success && (
              <Card className="mt-6 border-destructive">
                <CardContent className="p-6">
                  <div className="text-destructive">
                    <h3 className="font-semibold mb-2">Processing Failed</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors?.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Generated Boarding Sequence</h2>
              <Button onClick={resetAll} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Sequence
              </Button>
            </div>
            
            <BoardingResults 
              boardingSequence={result.data!}
              errors={result.errors}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Boarding Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Passengers seated farther back board first</li>
                    <li>• Higher seat numbers = farther from front</li>
                    <li>• Multiple seats per booking? Uses the highest number</li>
                    <li>• Ties broken by Booking ID (ascending)</li>
                    <li>• Row letters (A, B, C) are ignored</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Input Formats</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV: Booking_ID, Seat1, Seat2, ...</li>
                    <li>• Seats: A1, B02, C003, etc.</li>
                    <li>• Case insensitive</li>
                    <li>• Leading zeros handled automatically</li>
                    <li>• Multiple separators supported (comma, space)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}