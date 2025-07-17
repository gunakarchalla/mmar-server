import sharp from "sharp";
import { File } from "../../../mmar-global-data-structure";

/**
 * @description Compresses an image buffer.
 * @param {File} file - The file containing the image buffer to compress.
 * @param {number} targetWidth - The target width to resize the image to.
 * @param {number} quality - The quality for the compression (e.g., 0.8 for 80%).
 * @returns {Promise<Buffer>} - The compressed image buffer.
 */
export async function compressImage(
    file: File,
    targetWidth: number,
    quality: number,
): Promise<Buffer> {
    // Assuming JPEG for quality setting. You might want to adjust based on mimetype.
    const imgFormat = file.get_type().split("/").pop();
    console.log(`Compressing image of type: ${imgFormat}`);
    const imageBuffer = file.get_data();
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const originalSize = { width: metadata.width, height: metadata.height };
    const wPercent = targetWidth / originalSize.width;
    const targetHeight = Math.round(originalSize.height * wPercent);
    const resizeOptions = { fit: sharp.fit.inside };
    const formatOptions = imgFormat === 'jpeg' || imgFormat === 'webp' ? { quality } : {};

    return await image
        .resize(targetWidth, targetHeight, resizeOptions)
        .toFormat(imgFormat as keyof sharp.FormatEnum | sharp.AvailableFormatInfo, formatOptions)
        .toBuffer();
}