import { v2 as cloudinary } from "cloudinary";

export class CloudinaryService {
  static async upload(file: File, folder: string = "mini-twitter"): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: "image",
      transformation: [{ width: 1200, crop: "limit" }, { quality: "auto" }],
      api_key: apiKey,
      api_secret: apiSecret,
    };

    if (!apiKey || !apiSecret) {
      uploadOptions.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Upload failed"));
            } else {
              resolve(result.secure_url);
            }
          }
        )
        .end(buffer);
    });
  }
}
