const HF_API = "https://api-inference.huggingface.co/models";
const MODEL = "runwayml/stable-diffusion-v1-5"; // یا stabilityai/stable-diffusion-2-1 برای سرعت بیشتر

export async function textToImage(prompt, maxRetries = 3) {
  const url = `${HF_API}/${MODEL}`;
  const token = import.meta.env.VITE_HF_TOKEN;
  
  if (!token) {
    throw new Error("VITE_HF_TOKEN is not set in .env file");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

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
      throw new Error("AI failed: " + err.substring(0, 100));
    }

    // بررسی نوع پاسخ
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      // اگر JSON است، احتمالاً base64 در آن است
      const data = await response.json();
      if (data.image) {
        // اگر base64 است
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
        const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
        return URL.createObjectURL(blob);
      }
    }
    
    // اگر blob مستقیم است
    const blob = await response.blob();
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