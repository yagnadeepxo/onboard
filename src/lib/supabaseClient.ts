import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
require('dotenv').config()

const supabaseUrl: any = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey: any = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);