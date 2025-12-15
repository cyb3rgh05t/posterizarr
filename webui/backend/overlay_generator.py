from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
from typing import Dict, Any

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex string (#RRGGBB) to RGB tuple"""
    h = hex_color.lstrip("#")
    if len(h) != 6: return (0, 0, 0)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def generate_overlay_image(options: Dict[str, Any]) -> Image.Image:
    # 1. Setup Canvas
    overlay_type = options.get("overlay_type", "poster")
    if overlay_type == "background":
        canvas_w, canvas_h = 3840, 2160
    else:
        # Standard Poster (2000x3000)
        canvas_w, canvas_h = 2000, 3000

    # Transparent Base
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    # 2. Extract Options
    # Border
    border_enabled = options.get("border_enabled", False)
    border_px = int(options.get("border_px", 0))
    border_color = hex_to_rgb(options.get("border_color", "#FFFFFF"))
    corner_radius_pct = float(options.get("corner_radius", 0.0))

    # Gradient/Matte
    matte_height = float(options.get("matte_height_ratio", 0.0))
    fade_height = float(options.get("fade_height_ratio", 0.0))

    # Effects
    inner_glow_str = float(options.get("inner_glow_strength", 0.0))
    vignette_str = float(options.get("vignette_strength", 0.0))

    grain_amt = float(options.get("grain_amount", 0.0))
    grain_size = float(options.get("grain_size", 1.0))

    # NEW: Blur Strength (Default 0.0)
    blur_amt = float(options.get("blur_amount", 0.0))

    # Helper to create a solid color layer
    def get_color_layer(hex_key, default="#000000"):
        rgb = hex_to_rgb(options.get(hex_key, default))
        return Image.new("RGBA", (canvas_w, canvas_h), (*rgb, 255))

    # ---------------------------------------------------------
    # LAYER 1: VIGNETTE (Radial)
    # ---------------------------------------------------------
    if vignette_str > 0:
        grad_w, grad_h = canvas_w // 4, canvas_h // 4
        X, Y = np.meshgrid(np.linspace(-1, 1, grad_w), np.linspace(-1, 1, grad_h))
        radius = np.sqrt(X**2 + Y**2)
        radius = np.clip(radius, 0, 1)

        mask_data = (radius * 255 * vignette_str).astype(np.uint8)
        vignette_mask = Image.fromarray(mask_data, mode="L").resize((canvas_w, canvas_h), Image.Resampling.BICUBIC)

        color_fill = get_color_layer("vignette_color", "#000000")
        color_fill.putalpha(vignette_mask)
        canvas = Image.alpha_composite(canvas, color_fill)

    # ---------------------------------------------------------
    # LAYER 2: MATTE / GRADIENT FADE (Bottom Up)
    # ---------------------------------------------------------
    if matte_height > 0 or fade_height > 0:
        gradient_layer = get_color_layer("gradient_color", "#000000")
        mask = Image.new("L", (canvas_w, canvas_h), 0)
        draw = ImageDraw.Draw(mask)

        matte_h_px = int(canvas_h * matte_height)
        fade_h_px = int(canvas_h * fade_height)

        if matte_h_px > 0:
            draw.rectangle([0, canvas_h - matte_h_px, canvas_w, canvas_h], fill=255)

        if fade_h_px > 0:
            start_y = canvas_h - matte_h_px - fade_h_px
            for y in range(fade_h_px):
                alpha = int(255 * (y / fade_h_px))
                draw.line([(0, start_y + y), (canvas_w, start_y + y)], fill=alpha)

        gradient_layer.putalpha(mask)
        canvas = Image.alpha_composite(canvas, gradient_layer)

    # ---------------------------------------------------------
    # LAYER 3: INNER GLOW (Fade from all sides)
    # ---------------------------------------------------------
    if inner_glow_str > 0:
        blur_radius = int(min(canvas_w, canvas_h) * 0.2 * inner_glow_str)
        if blur_radius < 1: blur_radius = 1

        mask = Image.new("L", (canvas_w, canvas_h), 255)
        draw = ImageDraw.Draw(mask)
        inset = blur_radius * 1.5
        draw.rectangle([inset, inset, canvas_w - inset, canvas_h - inset], fill=0)
        mask = mask.filter(ImageFilter.GaussianBlur(blur_radius))

        glow_layer = get_color_layer("inner_glow_color", "#000000")
        glow_layer.putalpha(mask)
        canvas = Image.alpha_composite(canvas, glow_layer)

    # ---------------------------------------------------------
    # LAYER 4: GRAIN
    # ---------------------------------------------------------
    if grain_amt > 0:
        scale_factor = max(0.1, grain_size)
        noise_w = int(canvas_w / scale_factor)
        noise_h = int(canvas_h / scale_factor)
        if noise_w < 1: noise_w = 1
        if noise_h < 1: noise_h = 1

        max_alpha = int(255 * grain_amt)
        noise_mask = np.random.randint(0, max_alpha, (noise_h, noise_w), dtype=np.uint8)
        noise_mask_img = Image.fromarray(noise_mask, mode="L")
        noise_mask_img = noise_mask_img.resize((canvas_w, canvas_h), Image.Resampling.NEAREST)

        black_grain = Image.new("RGBA", (canvas_w, canvas_h), (0,0,0,255))
        black_grain.putalpha(noise_mask_img)
        canvas = Image.alpha_composite(canvas, black_grain)

    # ---------------------------------------------------------
    # NEW LAYER: BLUR (Softens previous effects)
    # ---------------------------------------------------------
    # We apply blur BEFORE the border so the border stays sharp
    if blur_amt > 0:
        # A radius of 10-20 is usually a good starting point for a noticeable blur
        canvas = canvas.filter(ImageFilter.GaussianBlur(radius=blur_amt))

    # ---------------------------------------------------------
    # LAYER 5: BORDER & ROUNDED CORNERS
    # ---------------------------------------------------------
    if border_enabled:
        border_layer = Image.new("RGBA", (canvas_w, canvas_h), (*border_color, 255))
        min_dim = min(canvas_w, canvas_h)
        outer_radius = int(min_dim * 0.5 * corner_radius_pct)
        inner_radius = outer_radius - border_px

        mask = Image.new("L", (canvas_w, canvas_h), 0)
        draw = ImageDraw.Draw(mask)

        if outer_radius > 0:
            draw.rounded_rectangle([0, 0, canvas_w-1, canvas_h-1], radius=outer_radius, fill=255)
        else:
            draw.rectangle([0, 0, canvas_w, canvas_h], fill=255)

        if border_px > 0:
            ix0, iy0 = border_px, border_px
            ix1, iy1 = canvas_w - border_px - 1, canvas_h - border_px - 1
            if inner_radius > 0:
                draw.rounded_rectangle([ix0, iy0, ix1, iy1], radius=inner_radius, fill=0)
            else:
                draw.rectangle([ix0, iy0, ix1, iy1], fill=0)

        border_layer.putalpha(mask)
        canvas = Image.alpha_composite(canvas, border_layer)

        if outer_radius > 0:
            cutout_mask = Image.new("L", (canvas_w, canvas_h), 0)
            d_cut = ImageDraw.Draw(cutout_mask)
            d_cut.rounded_rectangle([0, 0, canvas_w-1, canvas_h-1], radius=outer_radius, fill=255)
            r, g, b, a = canvas.split()
            new_a = ImageChops.multiply(a, cutout_mask)
            canvas.putalpha(new_a)

    # ---------------------------------------------------------
    # DEBUG LAYER: TEXT AREA GUIDE
    # ---------------------------------------------------------
    if options.get("show_text_area", False):
        box_w = int(options.get("text_box_w", 0))
        box_h = int(options.get("text_box_h", 0))
        y_off = int(options.get("text_box_offset", 0))

        if box_w > 0 and box_h > 0:
            x1 = (canvas_w - box_w) // 2
            x2 = x1 + box_w
            y2 = canvas_h - y_off
            y1 = y2 - box_h

            overlay_guide = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
            draw_guide = ImageDraw.Draw(overlay_guide)
            draw_guide.rectangle([x1, y1, x2, y2], fill=(255, 0, 0, 80), outline=(255, 0, 0, 255), width=3)
            draw_guide.line([x1, y1, x2, y2], fill=(255, 0, 0, 120), width=2)
            draw_guide.line([x1, y2, x2, y1], fill=(255, 0, 0, 120), width=2)
            canvas = Image.alpha_composite(canvas, overlay_guide)

    return canvas