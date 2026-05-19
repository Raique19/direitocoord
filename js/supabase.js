import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://yvlzvcpthrbdsktpiaok.supabase.co'

const supabaseKey = 'sb_publishable_ynjm48o4qTc7LyNj_CIdog_I3ASAZ4A'

export const supabase = createClient(supabaseUrl, supabaseKey)