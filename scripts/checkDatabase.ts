import { createAdminClient } from '../utils/supabase/admin'

async function checkSchema() {
    console.log('Checking menus table schema...')
    const supabase = createAdminClient()

    // fetch a single row to see columns
    const { data, error } = await supabase.from('menus').select('*').limit(1)
    if (error) {
        console.error('Error:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns in menus table:', Object.keys(data[0]))
    } else {
        console.log('No data found in menus table to infer schema.')
    }
}

checkSchema()
