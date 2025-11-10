const HF_API = "https://router.huggingface.co/hf-inference"; // API جدید
const MODEL = "runwayml/stable-diffusion-v1-5"; // یا stabilityai/stable-diffusion-2-1 برای سرعت بیشتر

export async function textToImage(prompt) {
  const response = await fetch(`${HF_API}/models/${MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("HF Error:", err); // دیباگ
    throw new Error("AI failed: " + err.substring(0, 100));
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// بقیه کد مثل قبل (imageToModifiedImage)