import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listingImageUpload, toPublicUploadUrl } from "../config/upload.js";

const router = Router();

router.post("/listing-images", requireAuth, (req, res) => {
  listingImageUpload.array("images", 8)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Image upload failed.",
      });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image.",
      });
    }

    const uploaded = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: toPublicUploadUrl(req, file.filename),
    }));

    return res.status(201).json({
      success: true,
      message: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded successfully.`,
      data: uploaded,
    });
  });
});

export default router;
