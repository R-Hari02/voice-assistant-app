// api/upload.js

// ====== SIMPLE IN-MEMORY RATE LIMITER ======
// This resets automatically when the serverless function sleeps.
const uploadLimits = new Map(); 
// Structure: { ip: { count: number, timestamp: number } }

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ====== GET USER IP ======
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  // ====== RATE LIMIT LOGIC ======
  const now = Date.now();
  const limitWindow = 60 * 60 * 1000; // 1 hour
  const maxUploads = 3;

  const entry = uploadLimits.get(ip) || { count: 0, timestamp: now };

  // Reset window if expired
  if (now - entry.timestamp > limitWindow) {
    entry.count = 0;
    entry.timestamp = now;
  }

  // Block if limit reached
  if (entry.count >= maxUploads) {
    return res.status(429).json({
      error: "Upload limit reached for your IP. Try again in 1 hour.",
    });
  }

  // ====== PARSE FORM DATA ======
  const formData = await new Promise((resolve, reject) => {
    const busboy = require("busboy")({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;

    busboy.on("file", (name, file, info) => {
      fileInfo = info;
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("finish", () => {
      resolve({ fields, fileBuffer, fileInfo });
    });

    req.pipe(busboy);
  });

  // ====== FILE CHECK ======
  if (!fileBuffer) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // 5MB limit
  const MAX_SIZE = 5 * 1024 * 1024;
  if (fileBuffer.length > MAX_SIZE) {
    return res.status(400).json({ error: "File too large (max 5MB)" });
  }

  // ====== UPDATE RATE LIMIT COUNT ======
  entry.count += 1;
  uploadLimits.set(ip, entry);

  // ====== (OPTIONAL) PROCESS FILE WITH GEMINI ======
  // If you use Gemini, here is where that goes.
  // Example:
  //
  // const result = await gemini_model.generateContent({
  //   file: { inlineData: { data: fileBuffer.toString("base64"), mimeType: fileInfo.mimeType } }
  // });
  //
  // return res.status(200).json({ output: result.text() });

  // TEMP SAFE RETURN (no processing yet)
  return res.status(200).json({
    message: "File uploaded successfully bro",
    fileName: fileInfo.filename,
    size: fileBuffer.length,
    uploadsUsed: entry.count,
    uploadsRemaining: maxUploads - entry.count,
  });
}
