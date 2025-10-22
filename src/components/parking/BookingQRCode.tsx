import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BookingQRCodeProps {
  bookingId: string;
  spotName: string;
  bookingDate: string;
  startTime: string;
}

const BookingQRCode = ({ bookingId, spotName, bookingDate, startTime }: BookingQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const qrData = JSON.stringify({
        bookingId,
        spotName,
        bookingDate,
        startTime,
      });

      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [bookingId, spotName, bookingDate, startTime]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `parking-booking-${bookingId}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleShare = async () => {
    if (canvasRef.current) {
      try {
        const blob = await new Promise<Blob>((resolve) => {
          canvasRef.current!.toBlob((blob) => {
            resolve(blob!);
          });
        });

        const file = new File([blob], `parking-booking-${bookingId}.png`, {
          type: 'image/png',
        });

        if (typeof navigator.share === 'function') {
          await navigator.share({
            title: 'Parking Booking',
            text: `Parking booked at ${spotName} on ${bookingDate} at ${startTime}`,
            files: [file],
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Card className="p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">Booking Confirmed!</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Show this QR code at the parking entrance
      </p>

      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-200 dark:border-gray-700 rounded-lg"
        />
      </div>

      <div className="space-y-2 text-sm text-left mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
          <span className="font-mono font-semibold">{bookingId.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Location:</span>
          <span className="font-medium">{spotName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Date:</span>
          <span className="font-medium">{bookingDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Time:</span>
          <span className="font-medium">{startTime}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download size={18} className="mr-2" />
          Download
        </Button>
        {typeof navigator.share === 'function' && (
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <Share2 size={18} className="mr-2" />
            Share
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BookingQRCode;
