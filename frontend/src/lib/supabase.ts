import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttjgkymrlnwjrianabbp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0amdreW1ybG53anJpYW5hYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjQ4NDAsImV4cCI6MjA3NDIwMDg0MH0.ezMlK3-52icTpFmYruTpCaQh1lO61F-LU12L9NeafVw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)