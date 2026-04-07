import { Navigation, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SchoolItem } from './SchoolsList'

type FormSubmitEvent = React.SyntheticEvent<HTMLFormElement>

interface MapDrawerProps {
  isOpen: boolean
  school?: SchoolItem | null
  onClose: () => void
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: any
        Marker: any
        DirectionsService: any
        DirectionsRenderer: any
        LatLng: any
        LatLngBounds: any
        TravelMode: any
        SymbolPath: any
      }
    }
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export default function MapDrawer({
  isOpen,
  school,
  onClose,
}: Readonly<MapDrawerProps>) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [startingPoint, setStartingPoint] = useState('')
  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [directionsError, setDirectionsError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load Google Maps API script
  useEffect(() => {
    if (mapLoaded) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
    script.async = true
    script.onload = () => {
      setMapLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setMapLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.remove()
      }
    }
  }, [mapLoaded])

  // Initialize map when drawer opens and API is loaded
  useEffect(() => {
    if (!isOpen || !mapLoaded || !mapRef.current || !school) return

    if (typeof window === 'undefined' || !window.google) {
      console.error('Google Maps API not loaded')
      return
    }

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      const schoolLat = extractLatitude(school.location)
      const schoolLng = extractLongitude(school.location)

      if (schoolLat === null || schoolLng === null) {
        setDirectionsError('School location data is not available')
        return
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: { lat: schoolLat, lng: schoolLng },
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        styles: getMapStyles(),
      })

      // Initialize directions service and renderer
      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#1f2937',
          strokeOpacity: 0.7,
          strokeWeight: 4,
        },
      })

      // Add marker for school
      new window.google.maps.Marker({
        position: { lat: schoolLat, lng: schoolLng },
        map: mapInstanceRef.current,
        title: school.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
    }
  }, [isOpen, mapLoaded, school])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const extractLatitude = (location: string): number | null => {
    const latRegex = /^([-\d.]+),/
    const match = latRegex.exec(location)
    return match ? Number.parseFloat(match[1]) : null
  }

  const extractLongitude = (location: string): number | null => {
    const lngRegex = /,([-\d.]+)$/
    const match = lngRegex.exec(location)
    return match ? Number.parseFloat(match[1]) : null
  }

  const getMapStyles = () => [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1f2937' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: '#f0f0f0' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#d0d0d0' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#dbeef6' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry.fill',
      stylers: [{ color: '#ffeee0' }],
    },
  ]

  const handleGetDirections = async (e: FormSubmitEvent) => {
    e.preventDefault()
    setDirectionsError(null)

    if (!startingPoint.trim()) {
      setDirectionsError('Please enter a starting point')
      return
    }

    if (!school || !mapInstanceRef.current || !directionsServiceRef.current) {
      setDirectionsError('Map or school data is not available')
      return
    }

    const schoolLat = extractLatitude(school.location)
    const schoolLng = extractLongitude(school.location)

    if (schoolLat === null || schoolLng === null) {
      setDirectionsError('School location data is not available')
      return
    }

    setIsLoadingDirections(true)

    try {
      const result = await new Promise<any>((resolve, reject) => {
        directionsServiceRef.current.route(
          {
            origin: startingPoint,
            destination: {
              lat: schoolLat,
              lng: schoolLng,
            },
            travelMode: window.google?.maps.TravelMode.DRIVING,
          },
          (response: any, status: any) => {
            if (status === 'OK') {
              resolve(response)
            } else {
              reject(new Error(`Directions request failed: ${status}`))
            }
          },
        )
      })

      directionsRendererRef.current.setDirections(result)

      // Fit bounds to show entire route
      if (!window.google) {
        console.error('Google Maps API not loaded')
        return
      }
      const bounds = new window.google.maps.LatLngBounds()
      const legs = result.routes[0].legs
      legs.forEach((leg: any) => {
        bounds.extend(leg.start_location)
        bounds.extend(leg.end_location)
      })
      mapInstanceRef.current.fitBounds(bounds)
    } catch (error) {
      setDirectionsError(
        error instanceof Error
          ? error.message
          : 'Failed to get directions. Please check your starting point and try again.',
      )
    } finally {
      setIsLoadingDirections(false)
    }
  }

  const handleClearDirections = () => {
    if (directionsRendererRef.current && school) {
      directionsRendererRef.current.setDirections({ routes: [] })
      setStartingPoint('')
      setDirectionsError(null)

      const schoolLat = extractLatitude(school.location)
      const schoolLng = extractLongitude(school.location)

      if (schoolLat !== null && schoolLng !== null && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: schoolLat, lng: schoolLng })
        mapInstanceRef.current.setZoom(14)
      }
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close map panel"
      />

      <div className="fixed inset-0 flex justify-end">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="School Map"
          className={`flex h-screen w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 border-l-2 border-gray-400 dark:border-gray-800 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {school?.name || 'School Map'}
              </h3>
              {school?.address && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {school.address}, {school.city}, {school.province} {school.postalCode}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Close map panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Map Container */}
          <div
            ref={mapRef}
            className="flex-1 bg-slate-100 dark:bg-slate-800"
            style={{ minHeight: '300px' }}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-600 dark:text-slate-400">Loading map...</p>
              </div>
            )}
          </div>

          {/* Directions Form */}
          <form
            onSubmit={handleGetDirections}
            className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="starting-point"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Starting Point (Address or Coordinates)
                </label>
                <input
                  id="starting-point"
                  type="text"
                  value={startingPoint}
                  onChange={(e) => setStartingPoint(e.target.value)}
                  disabled={isLoadingDirections || !mapLoaded}
                  placeholder="Enter starting address or coordinates"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!startingPoint.trim() || isLoadingDirections || !mapLoaded}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  title="Get directions"
                >
                  <Navigation size={18} />
                  {isLoadingDirections ? 'Loading...' : 'Get Directions'}
                </button>
                {startingPoint && (
                  <button
                    type="button"
                    onClick={handleClearDirections}
                    disabled={isLoadingDirections}
                    className="rounded-md bg-slate-200 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                    title="Clear directions"
                  >
                    Clear
                  </button>
                )}
              </div>

              {directionsError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {directionsError}
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Tip: You can enter an address (e.g., "123 Main St, Calgary") or coordinates (e.g., "51.0456, -114.0575")
              </p>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
