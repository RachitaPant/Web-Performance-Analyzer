import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbpqoypuxxngicligpky.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicHFveXB1eHhuZ2ljbGlncGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNzczMjMsImV4cCI6MjA1OTg1MzMyM30.FGnGlGwmC5cFQ9Kx7o6LUI7pTRDuD0l7UV15n1zzljU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
