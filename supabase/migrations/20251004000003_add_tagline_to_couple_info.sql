-- Add tagline field to couple_info in site_settings table
DO $$
DECLARE
    current_value jsonb;
BEGIN
    -- Get the current couple_info value
    SELECT value INTO current_value 
    FROM site_settings 
    WHERE key = 'couple_info';
    
    -- If we found the record, update it to include tagline field
    IF FOUND THEN
        -- Add tagline field if it doesn't exist
        IF NOT (current_value ? 'tagline') THEN
            current_value = jsonb_set(current_value, '{tagline}', '"Join us as we celebrate our love"', true);
        END IF;
        
        -- Update the record
        UPDATE site_settings 
        SET value = current_value, 
            updated_at = NOW()
        WHERE key = 'couple_info';
    END IF;
END $$;