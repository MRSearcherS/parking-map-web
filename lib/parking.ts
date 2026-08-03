import { supabase } from './supabaseClient';

export type ParkingPlace = {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  is_free: boolean;
  is_verified: boolean;
  is_demo: boolean;
  distance_meters: number | null;
};

export async function getNearbyParkings({
  latitude,
  longitude,
  isPro,
}: {
  latitude: number;
  longitude: number;
  isPro: boolean;
}): Promise<{ parkings: ParkingPlace[]; nearbyCount: number }> {
  if (isPro) {
    const { data, error } = await supabase.rpc('get_nearby_pro_parkings', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: 5000,
    });

    if (error) {
      throw error;
    }

    return {
      parkings: (data ?? []) as ParkingPlace[],
      nearbyCount: (data ?? []).length,
    };
  }

  const [{ data: demoData, error: demoError }, { data: countData, error: countError }] = await Promise.all([
    supabase.rpc('get_public_demo_parking', {
      user_lat: latitude,
      user_lng: longitude,
    }),
    supabase.rpc('get_nearby_parking_count', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: 5000,
    }),
  ]);

  if (demoError) {
    throw demoError;
  }

  if (countError) {
    throw countError;
  }

  return {
    parkings: (demoData ?? []) as ParkingPlace[],
    nearbyCount: Number(countData ?? 0),
  };
}
