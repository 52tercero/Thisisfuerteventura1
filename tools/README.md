Image conversion helper

Usage (Windows PowerShell):

1) Install ImageMagick (includes magick.exe) or libwebp tools.
   - ImageMagick: https://imagemagick.org/script/download.php#windows
   - libwebp: https://developers.google.com/speed/webp/download

2) Run the script from the workspace root:

```
pwsh -NoProfile -NonInteractive -File .\tools\convert-images.ps1 -InputPath images/header_image.png
```

Outputs:
- `images/header_image.webp`
- `images/header_image.avif` (if ImageMagick is available)

After conversion, replace any HTML references to PNG/JPG with WEBP/AVIF and keep PNG/JPG as fallback only if necessary.
