-- Enable realtime for models table
ALTER PUBLICATION supabase_realtime ADD TABLE public.models;

-- Enable realtime for carbon_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.carbon_logs;

-- Enable realtime for certificates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;