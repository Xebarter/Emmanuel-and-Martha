const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to get a gallery image from Supabase
async function getGalleryImage() {
  try {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('gallery')
      .select('url')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching gallery image:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0].url : null;
  } catch (error) {
    console.error('Error getting gallery image:', error);
    return null;
  }
}

// Function to generate HTML with dynamic meta tags
function generateHtmlWithMetaTags(url, title, description, image) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${image}">
  
  <!-- Facebook -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
</head>
<body style="background-color: #f0f0f0; font-family: Arial, sans-serif;">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
}

// For any route, serve the index.html file with dynamic meta tags for social media crawlers
app.get('*', async (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const isSocialMediaCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|Discordbot/i.test(userAgent);
  
  // Default values
  let title = 'John and Priscilla';
  let description = 'Join us as we celebrate our love';
  let image = 'https://johnandpriscilla.vercel.app/og-image.jpg'; // Fallback image
  
  // If it's a social media crawler, try to fetch dynamic data
  if (isSocialMediaCrawler) {
    // Try to get a gallery image
    const galleryImage = await getGalleryImage();
    if (galleryImage) {
      image = galleryImage;
    }
    
    // Serve HTML with meta tags directly for social media crawlers
    const html = generateHtmlWithMetaTags(
      `https://johnandpriscilla.vercel.app${req.url}`,
      title,
      description,
      image
    );
    res.send(html);
  } else {
    // For regular users, serve the standard SPA
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});