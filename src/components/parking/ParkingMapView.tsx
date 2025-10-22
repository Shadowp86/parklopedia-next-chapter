import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ParkingSpot } from '@/types/database';

interface ParkingMapViewProps {
  spots: ParkingSpot[];
  userLocation: { lat: number; lng: number } | null;
  onSpotClick: (spot: ParkingSpot) => void;
  onClose: () => void;
}

const ParkingMapView = ({ spots, userLocation, onSpotClick, onClose }: ParkingMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    // Check if token is already available (you can store it in env or fetch from edge function)
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      setShowTokenInput(false);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const center: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : spots[0]
      ? [spots[0].longitude, spots[0].latitude]
      : [77.5946, 12.9716]; // Default to Bangalore

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    // Add user location marker
    if (userLocation) {
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML('<div class="text-sm font-medium">Your Location</div>')
        )
        .addTo(map.current);
    }

    // Add parking spot markers
    spots.forEach((spot) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = spot.available_spots > 0 ? '#10B981' : '#EF4444';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '12px';
      el.textContent = spot.available_spots.toString();

      el.addEventListener('click', () => {
        setSelectedSpot(spot);
        map.current?.flyTo({
          center: [spot.longitude, spot.latitude],
          zoom: 15,
        });
      });

      new mapboxgl.Marker(el)
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-semibold text-sm">${spot.name}</h3>
              <p class="text-xs text-gray-600 mt-1">${spot.available_spots}/${spot.total_spots} spots</p>
              <p class="text-xs font-medium mt-1">₹${spot.price_per_hour}/hr</p>
            </div>`
          )
        )
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
    };
  }, [spots, userLocation, mapboxToken]);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
    }
  };

  if (showTokenInput) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            To view the parking map, please enter your Mapbox public token. You can get one from{' '}
            <a
              href="https://mapbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-blue hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <input
            type="text"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            placeholder="pk.eyJ1..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
          />
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleTokenSubmit} className="flex-1">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-dark-base">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 dark:bg-dark-elevated/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Parking Map</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-dark-elevated rounded-lg shadow-lg p-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">You</span>
          </div>
        </div>
      </div>

      {/* Selected Spot Card */}
      {selectedSpot && (
        <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-80 z-10">
          <Card className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{selectedSpot.name}</h3>
              <button
                onClick={() => setSelectedSpot(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface rounded"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {selectedSpot.address}
            </p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">
                {selectedSpot.available_spots}/{selectedSpot.total_spots} spots available
              </span>
              <span className="text-lg font-semibold text-accent-blue">
                ₹{selectedSpot.price_per_hour}/hr
              </span>
            </div>
            <Button
              onClick={() => onSpotClick(selectedSpot)}
              className="w-full"
              disabled={selectedSpot.available_spots === 0}
            >
              {selectedSpot.available_spots === 0 ? 'Fully Booked' : 'Book Now'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ParkingMapView;
