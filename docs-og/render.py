from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(__file__).with_name("og.html")
OUTPUT = ROOT / "public" / "og-image.png"


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        page.goto(SOURCE.as_uri(), wait_until="networkidle", timeout=60000)
        page.evaluate("document.fonts.ready")
        assert page.evaluate('document.fonts.check(\'600 64px "Space Grotesk"\')'), "Space Grotesk did not load"
        assert page.evaluate('document.fonts.check(\'400 22px "JetBrains Mono"\')'), "JetBrains Mono did not load"
        page.screenshot(path=str(OUTPUT), type="png")
        browser.close()
    from PIL import Image
    with Image.open(OUTPUT) as image:
        assert image.size == (1200, 630), f"Unexpected dimensions: {image.size}"
        assert image.format == "PNG"
    size = OUTPUT.stat().st_size
    assert size < 300 * 1024, f"PNG is too large: {size} bytes"
    print(f"Wrote {OUTPUT} ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
