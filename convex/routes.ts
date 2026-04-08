import { v } from 'convex/values'
import { action } from './_generated/server'

type RoutesApiResponse = {
  routes?: Array<{
    polyline?: { encodedPolyline?: string }
    legs?: Array<{
      startLocation?: {
        latLng?: {
          latitude?: number
          longitude?: number
        }
      }
    }>
  }>
  error?: {
    message?: string
  }
}

function getGoogleRoutesApiKey() {
  return (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>
      }
    }
  ).process?.env?.GOOGLE_ROUTES_API_KEY
}

export const computeRoute = action({
  args: {
    originAddress: v.string(),
    destinationLat: v.number(),
    destinationLng: v.number(),
  },
  handler: async (_ctx, args) => {
    const apiKey = getGoogleRoutesApiKey()

    if (!apiKey) {
      throw new Error('GOOGLE_ROUTES_API_KEY is not configured for directions.')
    }

    const originAddress = args.originAddress.trim()
    if (!originAddress) {
      throw new Error('Starting point is required.')
    }

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.startLocation',
      },
      body: JSON.stringify({
        origin: { address: originAddress },
        destination: {
          location: {
            latLng: {
              latitude: args.destinationLat,
              longitude: args.destinationLng,
            },
          },
        },
        travelMode: 'DRIVE',
      }),
    })

    const data: RoutesApiResponse = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error?.message ?? `Routes API error: ${response.statusText}`)
    }

    const route = data.routes?.[0]
    const encodedPolyline = route?.polyline?.encodedPolyline
    const startLat = route?.legs?.[0]?.startLocation?.latLng?.latitude
    const startLng = route?.legs?.[0]?.startLocation?.latLng?.longitude

    if (!encodedPolyline || typeof startLat !== 'number' || typeof startLng !== 'number') {
      throw new Error('No route found. Please check your starting point.')
    }

    return {
      encodedPolyline,
      startLat,
      startLng,
    }
  },
})

