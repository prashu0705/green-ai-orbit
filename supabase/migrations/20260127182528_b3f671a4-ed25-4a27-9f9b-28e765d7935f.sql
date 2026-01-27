-- Enum for model status
CREATE TYPE public.model_status AS ENUM ('active', 'idle', 'training');

-- Regions table with carbon factors
CREATE TABLE public.regions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    carbon_factor DECIMAL(10,4) NOT NULL DEFAULT 0.45,
    renewable_percentage INTEGER NOT NULL DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    job_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Models table
CREATE TABLE public.models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    region_id UUID REFERENCES public.regions(id) NOT NULL,
    status model_status NOT NULL DEFAULT 'active',
    gpu_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    gpu_count INTEGER NOT NULL DEFAULT 1,
    energy_kwh DECIMAL(10,4) NOT NULL DEFAULT 0,
    co2_emissions DECIMAL(10,4) NOT NULL DEFAULT 0,
    efficiency_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_deployed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    next_maintenance_at TIMESTAMP WITH TIME ZONE
);

-- Energy logs for tracking consumption over time
CREATE TABLE public.energy_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
    energy_kwh DECIMAL(10,4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Carbon logs for tracking emissions over time
CREATE TABLE public.carbon_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
    co2_kg DECIMAL(10,4) NOT NULL,
    region_id UUID REFERENCES public.regions(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Certificates table (blockchain-style ledger)
CREATE TABLE public.certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model_name TEXT NOT NULL,
    training_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_co2_kg DECIMAL(10,4) NOT NULL,
    renewable_percentage INTEGER NOT NULL,
    certificate_hash TEXT NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Carbon intensity forecasts for scheduling
CREATE TABLE public.carbon_forecasts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID REFERENCES public.regions(id) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    carbon_intensity_g INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(region_id, timestamp)
);

-- Energy mix sources
CREATE TABLE public.energy_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_name TEXT NOT NULL,
    percentage INTEGER NOT NULL,
    is_renewable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Models policies
CREATE POLICY "Users can view their own models" ON public.models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own models" ON public.models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own models" ON public.models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own models" ON public.models FOR DELETE USING (auth.uid() = user_id);

-- Energy logs policies
CREATE POLICY "Users can view energy logs for their models" ON public.energy_logs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.models WHERE models.id = energy_logs.model_id AND models.user_id = auth.uid()));
CREATE POLICY "Users can insert energy logs for their models" ON public.energy_logs FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.models WHERE models.id = energy_logs.model_id AND models.user_id = auth.uid()));

-- Carbon logs policies
CREATE POLICY "Users can view their own carbon logs" ON public.carbon_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own carbon logs" ON public.carbon_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Carbon forecasts - publicly readable for all authenticated users
CREATE POLICY "Authenticated users can view forecasts" ON public.carbon_forecasts FOR SELECT TO authenticated USING (true);

-- Energy sources policies
CREATE POLICY "Users can view their own energy sources" ON public.energy_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own energy sources" ON public.energy_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own energy sources" ON public.energy_sources FOR UPDATE USING (auth.uid() = user_id);

-- Regions - publicly readable
CREATE POLICY "Anyone can view regions" ON public.regions FOR SELECT USING (true);

-- Insert default regions with carbon factors
INSERT INTO public.regions (name, code, carbon_factor, renewable_percentage) VALUES
    ('US East (N. Virginia)', 'us-east-1', 0.45, 25),
    ('US West (Oregon)', 'us-west-2', 0.08, 90),
    ('US West (N. California)', 'us-west-1', 0.20, 65),
    ('EU North (Stockholm)', 'eu-north-1', 0.02, 98),
    ('EU West (Ireland)', 'eu-west-1', 0.30, 45),
    ('Asia Pacific (Tokyo)', 'ap-northeast-1', 0.50, 20);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();