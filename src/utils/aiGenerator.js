export async function textToImage(prompt, maxRetries = 3) {
  console.log('🎨 Starting image generation with prompt:', prompt.substring(0, 100) + '...');

  // Use Unsplash API instead of HuggingFace models
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    console.log('📡 API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image generated successfully');

      if (data.imageData) {
        // Convert base64 data URL to blob URL
        const response2 = await fetch(data.imageData);
        const blob = await response2.blob();
        return URL.createObjectURL(blob);
      } else {
        throw new Error('No image data received');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API failed with:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Image generation failed:', error.message);
    throw new Error("Image generation failed. Please check your internet connection and try again.");
  }
}

async function textToImageWithModel(prompt, model, maxRetries = 3) {
  const HF_API_BASE = import.meta.env.DEV
    ? "/api/hf"
    : "https://router.huggingface.co/hf-inference";

  const token = import.meta.env.VITE_HF_TOKEN;

  if (!token) {
    throw new Error("VITE_HF_TOKEN is not set in .env file");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const url = `${HF_API_BASE}/models/${model}`;
    console.log('📡 Trying URL:', url);

    const headers = {
      "Content-Type": "application/json",
    };

    // در development از header مخصوص استفاده می‌کنیم
    if (import.meta.env.DEV) {
      headers["x-hf-token"] = token; // lowercase برای سازگاری با proxy
    } else {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ inputs: prompt }),
    });

    console.log('📡 HF API response status:', response.status);

    if (response.status === 503) {
      // مدل در حال لود شدن است
      let waitTime = 20;
      try {
        const errorData = await response.json();
        waitTime = errorData.estimated_time || 20;
      } catch {
        // اگر JSON نبود، از زمان پیش‌فرض استفاده می‌کنیم
      }

      if (attempt < maxRetries - 1) {
        console.log(`Model loading, waiting ${waitTime}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue; // دوباره تلاش کن
      } else {
        throw new Error(`Model is still loading after ${maxRetries} attempts. Estimated wait time: ${waitTime}s`);
      }
    }

    if (!response.ok) {
      let err;
      try {
        err = await response.text();
      } catch {
        err = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error("HF Error:", err);
      console.error("Full error details:", {
        url,
        model,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: err
      });

      // If 404, try next model
      if (response.status === 404) {
        throw new Error(`Model ${model} not found`);
      }

      throw new Error("AI failed: " + err.substring(0, 100));
    }

    // بررسی نوع پاسخ
    const contentType = response.headers.get("content-type");
    console.log('📄 Response content type:', contentType);

    if (contentType && contentType.includes("application/json")) {
      // اگر JSON است، احتمالاً base64 در آن است
      const data = await response.json();
      console.log('📄 JSON response received:', data);
      if (data.image) {
        // اگر base64 است
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
        const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
        return URL.createObjectURL(blob);
      }
    }

    // اگر blob مستقیم است
    const blob = await response.blob();
    console.log('📄 Blob received, size:', blob.size);
    return URL.createObjectURL(blob);
  }

  // اگر به اینجا رسیدیم، یعنی همه تلاش‌ها ناموفق بودند
  throw new Error("Failed to generate image after multiple attempts");
}

export async function imageToModifiedImage(imageFile) {
  // برای image-to-image، از یک مدل مناسب استفاده می‌کنیم
  // یا می‌توانیم همان تصویر را با تغییرات کوچک برگردانیم
  // در اینجا از text-to-image با prompt اصلاح شده استفاده می‌کنیم

  // خواندن تصویر و تبدیل به base64 برای استفاده در prompt
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // استفاده از text-to-image با prompt که شامل تغییرات است
        // این یک راه حل ساده است - برای production بهتر است از image-to-image model استفاده شود
        const base64 = e.target.result
        const prompt = `A modified version of this image with 5 subtle differences: move an object, change a color, add a shadow, resize something, remove a detail. Original image: ${base64.substring(0, 100)}...`

        // استفاده از همان textToImage با prompt اصلاح شده
        const modifiedUrl = await textToImage(prompt)
        resolve(modifiedUrl)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(imageFile)
  })
}