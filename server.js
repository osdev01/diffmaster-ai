import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// API endpoint to generate images using AI API (like HuggingFace or similar)
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('🔄 Generating AI image for prompt:', prompt.substring(0, 50) + '...');

    // Use a free AI image generation API (you can replace with your preferred service)
    // For now, using a mock/placeholder that returns a generated image URL
    // You can integrate with services like:
    // - Replicate (requires API key)
    // - Together AI
    // - OpenAI DALL-E (requires API key)
    // - Stability AI (requires API key)

    // For demonstration, let's use a free alternative or mock
    // In production, replace with your actual AI service

    // Option 1: Use Pollinations.ai (free, no API key needed)
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}`;

    console.log('✅ Generated image URL:', imageUrl);

    // Download the image and return as base64
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.json({
      imageData: `data:image/png;base64,${base64}`,
      success: true
    });

  } catch (error) {
    console.log('❌ AI Image generation failed:', error.message);

    // Fallback to Unsplash if AI fails
    try {
      console.log('🔄 Falling back to Unsplash...');
      const searchQuery = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&orientation=landscape`;

      const unsplashResponse = await fetch(unsplashUrl, {
        headers: { 'Accept-Version': 'v1' }
      });

      if (unsplashResponse.ok) {
        const data = await unsplashResponse.json();
        if (data.results && data.results.length > 0) {
          const imageUrl = data.results[0].urls.regular;
          const imageResponse = await fetch(imageUrl);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');

          res.json({
            imageData: `data:image/jpeg;base64,${base64}`,
            success: true,
            fallback: true
          });
        } else {
          throw new Error('No fallback images found');
        }
      } else {
        throw new Error('Fallback API also failed');
      }
    } catch (fallbackError) {
      console.log('❌ Fallback also failed:', fallbackError.message);
      res.status(500).json({ error: 'Failed to generate image from both AI and fallback services' });
    }
  }
});

// Serve generated images
app.use('/images', express.static(path.join(__dirname, 'api', 'outputs')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});