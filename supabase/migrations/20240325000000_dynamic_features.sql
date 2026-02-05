
-- 1. Marketplace Listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  efficiency_rating TEXT,
  co2_per_request TEXT,
  tags TEXT[],
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Data (Mirroring current static catalog)
INSERT INTO marketplace_listings (name, provider, description, efficiency_rating, co2_per_request, tags, popular) VALUES
('Eco-BERT Large', 'Green AI Labs', 'Optimized BERT model for NLP tasks. Distilled for 40% less energy consumption.', 'A++', '0.12g', ARRAY['NLP', 'Distilled', 'Low-Code'], true),
('Green-GPT-4', 'Open Sustain', 'General purpose LLM fine-tuned on carbon-neutral infrastructure.', 'A+', '0.45g', ARRAY['LLM', 'Generative', 'Chat'], true),
('Efficient-ViT B16', 'Computer Vision Co.', 'Vision Transformer designed for edge devices. High throughput.', 'A++', '0.28g', ARRAY['Computer Vision', 'Edge', 'Fast'], false),
('Whisper Solar', 'Audio Tech', 'Speech-to-text model trained exclusively on solar power farms.', 'A', '0.33g', ARRAY['Audio', 'Speech-to-Text', 'Renewable'], false),
('Stable Diffusion Eco', 'Art Gen', 'Image generation model with optimized sampling steps.', 'B', '0.82g', ARRAY['Image Gen', 'Creative', 'Optimized'], true),
('Code Llama Green', 'Dev Tools Inc.', 'Code completion model hosted in Iceland (Hydro/Geothermal).', 'A+', '0.05g', ARRAY['Coding', 'Developer', 'Zero Carbon'], false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read listings
CREATE POLICY "Public profiles are viewable by everyone" ON marketplace_listings
  FOR SELECT USING (true);


-- 2. Financial Applications
CREATE TABLE IF NOT EXISTS financial_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'loan', 'grant', 'insurance'
  amount_requested TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE financial_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see and insert their own applications
CREATE POLICY "Users can see own applications" ON financial_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON financial_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

