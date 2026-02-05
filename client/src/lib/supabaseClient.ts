import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ibmfsihdkdqxtjlavstp.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibWZzaWhka2RxeHRqbGF2c3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTk1ODIsImV4cCI6MjA3MzE5NTU4Mn0.IMwcE5Cu5DKEXv0kGgsnKjhsBrOMmd9GFA9Lbrptul4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)