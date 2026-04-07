import { Navigation, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SchoolItem } from './SchoolsList'
import { SNAZZY_STYLE } from '~/styles/snazzyStyle.ts'

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
        Polyline: any
        LatLngBounds: any
        SymbolPath: any
        places: {
          AutocompleteService: any
          AutocompleteSessionToken: any
        }
      }
    }
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Decode a Google encoded polyline into lat/lng pairs
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push({ lat: lat * 1e-5, lng: lng * 1e-5 })
  }
  return points
}

export default function MapDrawer({
  isOpen,
  school,
  onClose,
}: Readonly<MapDrawerProps>) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const schoolMarkerRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)
  const originMarkerRef = useRef<any>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const sessionTokenRef = useRef<any>(null)
  const suggestionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)
  const [startingPoint, setStartingPoint] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [directionsError, setDirectionsError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load Google Maps API script
  useEffect(() => {
    if (mapLoaded) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
    script.async = true
    script.onload = () => { setMapLoaded(true) }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setMapLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) script.remove()
    }
  }, [mapLoaded])

  // Initialize Places AutocompleteService once the Maps API is ready
  useEffect(() => {
    if (mapLoaded && window.google?.maps.places) {
      try {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        console.log('AutocompleteService initialized successfully')
      } catch (error) {
        console.error('Failed to initialize AutocompleteService:', error)
      }
    } else {
      console.warn('Google Maps Places API not available yet', {
        mapLoaded,
        hasGoogle: !!window.google,
        hasPlaces: !!window.google?.maps.places,
      })
    }
  }, [mapLoaded])

  // Close suggestions when clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize or update map when drawer opens or school changes
  useEffect(() => {
    if (!isOpen || !mapLoaded || !mapRef.current || !school) return

    if (typeof window === 'undefined' || !window.google) {
      console.error('Google Maps API not loaded')
      return
    }

    const schoolLat = extractLatitude(school.location)
    const schoolLng = extractLongitude(school.location)

    if (schoolLat === null || schoolLng === null) {
      setDirectionsError('School location data is not available')
      return
    }

    if (!mapInstanceRef.current) {
      // First open — create the map instance
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: { lat: schoolLat, lng: schoolLng },
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        styles: SNAZZY_STYLE,
      })
    } else {
      // School changed — re-center, clear any existing route and reset form
      mapInstanceRef.current.setCenter({ lat: schoolLat, lng: schoolLng })
      mapInstanceRef.current.setZoom(16)
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null)
        routePolylineRef.current = null
      }
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null)
        originMarkerRef.current = null
      }
      setStartingPoint('')
      setDirectionsError(null)
    }

    // Remove old school marker and place a fresh one
    if (schoolMarkerRef.current) {
      schoolMarkerRef.current.setMap(null)
    }
    schoolMarkerRef.current = new window.google.maps.Marker({
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
  }, [isOpen, mapLoaded, school])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const extractLatitude = (location: string): number | null => {
    const match = /^([-\d.]+),/.exec(location)
    return match ? Number.parseFloat(match[1]) : null
  }

  const extractLongitude = (location: string): number | null => {
    const match = /,\s*([-\d.]+)$/.exec(location)
    return match ? Number.parseFloat(match[1]) : null
  }

  const handleStartingPointChange = (value: string) => {
    setStartingPoint(value)

    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current)

    if (value.length < 3 || !autocompleteServiceRef.current) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    suggestionDebounceRef.current = setTimeout(() => {
      try {
        if (!autocompleteServiceRef.current) {
          console.warn('AutocompleteService not available')
          return
        }

        const requestOptions: any = {
          input: value,
          componentRestrictions: { country: 'ca' },
        }

        if (sessionTokenRef.current) {
          requestOptions.sessionToken = sessionTokenRef.current
        }

        autocompleteServiceRef.current.getPlacePredictions(
          requestOptions,
          (predictions: any, status: string) => {
            if (status === 'OK' && predictions?.length) {
              setSuggestions(
                predictions.map((p: any) => ({ placeId: p.place_id, description: p.description }))
              )
              setShowSuggestions(true)
            } else {
              setSuggestions([])
              setShowSuggestions(false)
            }
          }
        )
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
  }

  const handleSuggestionSelect = (description: string) => {
    setStartingPoint(description)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const clearRoute = () => {
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
      routePolylineRef.current = null
    }
    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null)
      originMarkerRef.current = null
    }
  }

  const handleGetDirections = async (e: FormSubmitEvent) => {
    e.preventDefault()
    setDirectionsError(null)

    if (!startingPoint.trim()) {
      setDirectionsError('Please enter a starting point')
      return
    }

    if (!school || !mapInstanceRef.current) {
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
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.startLocation,routes.legs.endLocation',
        },
        body: JSON.stringify({
          origin: { address: startingPoint },
          destination: {
            location: {
              latLng: { latitude: schoolLat, longitude: schoolLng },
            },
          },
          travelMode: 'DRIVE',
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `Routes API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found. Please check your starting point.')
      }

      const route = data.routes[0]
      const path = decodePolyline(route.polyline.encodedPolyline)

      if (!window.google) throw new Error('Google Maps API not available')

      // Replace any existing route
      clearRoute()

      // Draw the route polyline
      routePolylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#1d4ed8',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: mapInstanceRef.current,
      })

      // Origin marker (green)
      const startLat: number = route.legs[0].startLocation.latLng.latitude
      const startLng: number = route.legs[0].startLocation.latLng.longitude
      originMarkerRef.current = new window.google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        map: mapInstanceRef.current,
        title: 'Starting point',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      // Fit map to the full route
      const bounds = new window.google.maps.LatLngBounds()
      for (const point of path) bounds.extend(point)
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
    clearRoute()
    setStartingPoint('')
    setSuggestions([])
    setShowSuggestions(false)
    setDirectionsError(null)

    if (school && mapInstanceRef.current) {
      const schoolLat = extractLatitude(school.location)
      const schoolLng = extractLongitude(school.location)
      if (schoolLat !== null && schoolLng !== null) {
        mapInstanceRef.current.setCenter({ lat: schoolLat, lng: schoolLng })
        mapInstanceRef.current.setZoom(16)
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
                  {school.address}, {school.city}, {school.province}{' '}
                  {school.postalCode}
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
                  Starting Point
                </label>
                <div className="relative">
                  <input
                    id="starting-point"
                    type="text"
                    value={startingPoint}
                    onChange={(e) => handleStartingPointChange(e.target.value)}
                    disabled={isLoadingDirections || !mapLoaded}
                    placeholder="Enter starting address"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                      {suggestions.map((s) => (
                        <li key={s.placeId}>
                          <button
                            type="button"
                            onMouseDown={() => handleSuggestionSelect(s.description)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {s.description}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={
                    !startingPoint.trim() || isLoadingDirections || !mapLoaded
                  }
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
                💡 Tip: You can enter an address (e.g., "123 Main St, Calgary")
              </p>
            </div>
          </form>

          {/* Map Container */}
          <div
            ref={mapRef}
            className="flex-1 bg-slate-100 dark:bg-slate-800"
            style={{ minHeight: '300px' }}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-600 dark:text-slate-400">
                  Loading map...
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
