import sharp, { type FormatEnum } from "sharp";
import { File } from "../../../mmar-global-data-structure";
import { HTTP400Error } from "./middleware/error_handling/standard_errors.middleware";

/**
 * @description - The output formats this service will encode to.
 *
 * The requested format is derived from the mimetype the client sent with the
 * upload, so it is untrusted input on its way into sharp's encoder selection.
 * Only these are accepted, and quality is only meaningful for the lossy ones.
 */
const SUPPORTED_FORMATS = {
    jpeg: { encoder: "jpeg", lossy: true },
    // "image/jpg" is not a registered mimetype but browsers and clients send it
    // anyway, so it is accepted and encoded as jpeg.
    jpg: { encoder: "jpeg", lossy: true },
    webp: { encoder: "webp", lossy: true },
    avif: { encoder: "avif", lossy: true },
    tiff: { encoder: "tiff", lossy: true },
    png: { encoder: "png", lossy: false },
    gif: { encoder: "gif", lossy: false },
} as const satisfies Record<
    string,
    // What sharp's toFormat() accepts: avif is spelled out because it is not a
    // member of FormatEnum in sharp's own typings.
    { encoder: "avif" | keyof FormatEnum; lossy: boolean }
>;

type SupportedFormat = keyof typeof SUPPORTED_FORMATS;

/**
 * @description - The largest image this service will decode, in pixels.
 *
 * A small compressed file can describe an enormous raster — the classic
 * decompression bomb — and decoding it allocates width × height × channels
 * bytes before any resizing happens. This is sharp's own default ceiling, made
 * explicit so that it is not lost if the default changes.
 */
const MAX_INPUT_PIXELS = 268_402_689;

/**
 * @description - Resize an image to a target width and re-encode it.
 * @param {File} file - The file holding the image to compress.
 * @param {number} targetWidth - The width to resize to, in pixels.
 * @param {number} quality - The encoder quality, 1 to 100.
 * @returns {Promise<Buffer>} - The compressed image.
 * @throws {HTTP400Error} - If the image is unreadable or its format unsupported.
 */
export async function compressImage(
    file: File,
    targetWidth: number,
    quality: number,
): Promise<Buffer> {
    const requested = file.get_type().split("/").pop()?.toLowerCase() ?? "";
    if (!(requested in SUPPORTED_FORMATS)) {
        throw new HTTP400Error(
            `Cannot compress a ${file.get_type()} image. Supported formats: ` +
            `${Object.keys(SUPPORTED_FORMATS).join(", ")}.`
        );
    }
    const imgFormat = requested as SupportedFormat;

    const image = sharp(file.get_data(), { limitInputPixels: MAX_INPUT_PIXELS });

    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
        throw new HTTP400Error(
            "The uploaded file could not be read as an image."
        );
    }

    // The height follows the width so that the aspect ratio is kept. `inside`
    // means the result is never enlarged beyond the box, so an image already
    // narrower than the target is left at its own size.
    const targetHeight = Math.round(
        metadata.height * (targetWidth / metadata.width)
    );

    const { encoder, lossy } = SUPPORTED_FORMATS[imgFormat];

    return await image
        .resize(targetWidth, targetHeight, { fit: sharp.fit.inside })
        .toFormat(encoder, lossy ? { quality } : {})
        .toBuffer();
}
