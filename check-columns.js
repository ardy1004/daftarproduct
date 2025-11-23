import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ibmfsihdkdqxtjlavstp.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibWZzaWhka2RxeHRqbGF2c3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTk1ODIsImV4cCI6MjA3MzE5NTU4Mn0.IMwcE5Cu5DKEXv0kGgsnKjhsBrOMmd9GFA9Lbrptul4"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  try {
    // Try to select one row to see the structure
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error fetching products:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('Current product columns:', Object.keys(data[0]))
    } else {
      console.log('No products found, but table exists')
      // Try to get column info through a different method
      console.log('Please check Supabase dashboard for table structure')
    }
  } catch (err) {
    console.error('Failed to check columns:', err)
  }
}

checkColumns()