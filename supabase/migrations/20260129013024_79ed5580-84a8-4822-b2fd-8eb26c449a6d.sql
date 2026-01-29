-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create destinations table
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_from DECIMAL(10,2) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Destinations are public
CREATE POLICY "Anyone can view destinations" ON public.destinations FOR SELECT USING (true);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookings" ON public.bookings FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample destinations
INSERT INTO public.destinations (name, country, description, image_url, price_from, rating, featured) VALUES
('Santorini', 'Grekland', 'Upplev de ikoniska vita husen och magiska solnedgångarna över Egeiska havet.', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800', 12999, 4.9, true),
('Bali', 'Indonesien', 'Tropiskt paradis med risterrasser, tempel och kristallklara stränder.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 15999, 4.8, true),
('Malediverna', 'Malediverna', 'Lyxiga övervattenbungalows i turkost vatten - ultimat avkoppling.', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', 24999, 4.9, true),
('Tokyo', 'Japan', 'Moderna skyskrapor möter gamla tempel i denna fascinerande storstad.', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 13499, 4.7, false),
('Amalfikusten', 'Italien', 'Dramatiska klippor, pittoreska byar och utsökt italiensk mat.', 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800', 11999, 4.8, true),
('Kapstaden', 'Sydafrika', 'Berget möter havet - safari, vinodlingar och pulserande stad.', 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', 14999, 4.6, false);