const HF_API = "https://api-inference.huggingface.co/models"
const TEXT_MODEL = "runwayml/stable-diffusion-v1-5"
const IMG_MODEL = "lllyasviel/control_v1p_sd15_brightness"

export async function textToImage(prompt) {
  return await callHF(TEXT_MODEL, { inputs: prompt })
}

export async function imageToModifiedImage(file) {
  const base64 = await fileToBase64(file)
  return await callHF(IMG_MODEL, {
    inputs: base64,
    parameters: { prompt: "subtle changes, keep style" }
  })
}

async function callHF(model, payload) {
  const res = await fetch(`${HF_API}/${model}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) throw new Error("AI failed")
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}