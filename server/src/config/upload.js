import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/src/config -> server/uploads/listings
export const uploadsRoot = path.resolve(__dirname, "../../uploads");
export const listingUploadsDir = path.join(uploadsRoot, "listings");

fs.mkdirSync(listingUploadsDir, { recursive: true });

const allowedTypes = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);

function safeExtension(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExts = allowedTypes.get(file.mimetype);

  if (!allowedExts) return null;
  if (!ext || !allowedExts.has(ext)) {
    if (file.mimetype === "image/jpeg") return ".jpg";
    if (file.mimetype === "image/png") return ".png";
    if (file.mimetype === "image/webp") return ".webp";
    return null;
  }

  return ext;
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, listingUploadsDir);
  },
  filename: (_req, file, callback) => {
    const ext = safeExtension(file) || ".jpg";
    const safeBase = path
      .basename(file.originalname || "image", path.extname(file.originalname || ""))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 36) || "image";

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${unique}-${safeBase}${ext}`);
  },
});

export const listingImageUpload = multer({
  storage,
  limits: {
    files: 8,
    fileSize: 3 * 1024 * 1024,
    fields: 30,
  },
  fileFilter: (_req, file, callback) => {
    const ext = safeExtension(file);
    if (!ext) {
      return callback(new Error("Only JPG, PNG, or WEBP image uploads are allowed."));
    }

    callback(null, true);
  },
});

export function toPublicUploadUrl(req, filename) {
  const safeName = path.basename(filename || "");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/uploads/listings/${safeName}`;
}
