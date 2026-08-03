CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  access_level TEXT NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'pro', 'admin')),
  pro_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parking_places (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parking_places_location_idx
ON public.parking_places
USING GIST (location);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_parking_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_parking_location ON public.parking_places;
CREATE TRIGGER trg_set_parking_location
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.parking_places
FOR EACH ROW
EXECUTE FUNCTION public.set_parking_location();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, access_level)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_user_is_pro()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.access_level IN ('pro', 'admin')
        OR (p.pro_until IS NOT NULL AND p.pro_until > NOW())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_demo_parking(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  address TEXT,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_free BOOLEAN,
  is_verified BOOLEAN,
  is_demo BOOLEAN,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.name,
    p.address,
    p.description,
    p.latitude,
    p.longitude,
    p.is_free,
    p.is_verified,
    TRUE AS is_demo,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM public.parking_places p
  WHERE p.is_demo = TRUE AND p.is_approved = TRUE
  ORDER BY p.id ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_parking_count(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.parking_places p
  WHERE p.is_free = TRUE
    AND p.is_approved = TRUE
    AND p.is_demo = FALSE
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    );
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_pro_parkings(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  address TEXT,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_free BOOLEAN,
  is_verified BOOLEAN,
  is_demo BOOLEAN,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.current_user_is_pro() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.address,
    p.description,
    p.latitude,
    p.longitude,
    p.is_free,
    p.is_verified,
    FALSE AS is_demo,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM public.parking_places p
  WHERE p.is_free = TRUE
    AND p.is_approved = TRUE
    AND p.is_demo = FALSE
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND access_level = (SELECT access_level FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "No direct parking reads" ON public.parking_places;
CREATE POLICY "No direct parking reads"
ON public.parking_places
FOR SELECT
USING (FALSE);

TRUNCATE public.parking_places RESTART IDENTITY;

INSERT INTO public.parking_places (
  name, address, description, latitude, longitude, is_free, is_verified, is_approved, is_demo
) VALUES
(
  'Демо-парковка',
  'Пример карточки парковки',
  'Это демонстрационная точка. Реальные адреса и координаты доступны только в PRO.',
  55.7558,
  37.6173,
  TRUE,
  TRUE,
  TRUE,
  TRUE
),
(
  'Парковка у торгового центра',
  'Москва, ул. Примерная, 10',
  'Бесплатная парковка на 40 мест. Обычно свободна вечером.',
  55.751244,
  37.618423,
  TRUE,
  TRUE,
  TRUE,
  FALSE
),
(
  'Парковка возле парка',
  'Москва, Парк Победы',
  'Бесплатная городская парковка. Возможна загруженность в выходные.',
  55.7362,
  37.5183,
  TRUE,
  TRUE,
  TRUE,
  FALSE
),
(
  'Парковка у набережной',
  'Москва, Москворецкая набережная',
  'Небольшая бесплатная парковка рядом с прогулочной зоной.',
  55.7475,
  37.6244,
  TRUE,
  FALSE,
  TRUE,
  FALSE
),
(
  'Парковка возле офиса',
  'Москва, ул. Тверская, 15',
  'Бесплатные места доступны вечером и в выходные.',
  55.7616,
  37.6095,
  TRUE,
  FALSE,
  TRUE,
  FALSE
);
