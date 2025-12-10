import os
import asyncio
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

def render_html(context: Dict[str, Any]) -> str:
    template = _env.get_template('presentation.html.j2')
    return template.render(**context)

async def html_to_pdf_bytes(html: str) -> bytes:
    """Attempt to render HTML -> PDF using Playwright if available, else fallback to simple bytes.
    Requires PLAYWRIGHT_ENABLED=1 and package installed.
    """
    if not os.getenv('PLAYWRIGHT_ENABLED'):
        # Fallback: return HTML bytes so caller can detect lack of PDF support.
        return html.encode('utf-8')
    try:
        from playwright.async_api import async_playwright  # type: ignore
    except Exception:
        return html.encode('utf-8')
    # Minimal implementation
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html, wait_until='load')
        pdf_bytes = await page.pdf(format='A4', print_background=True)
        await browser.close()
        return pdf_bytes

async def build_presentation_pdf(presentation: Dict[str, Any], export_options: Optional[Dict[str, Any]] = None) -> dict:
    export_options = export_options or {}
    theme = export_options.get('theme', 'default')
    cover = presentation.get('cover') or {}
    summary = presentation.get('summary') or {}
    pages = presentation.get('pages') or []
    photos = presentation.get('photos') or []
    meta = presentation.get('meta') or {}

    context = {
        'cover': cover,
        'summary': summary,
        'pages': pages,
        'photos': { str(p.get('id')): p for p in photos },
        'meta': meta,
        'theme': theme,
    }
    html = render_html(context)
    pdf_bytes = await html_to_pdf_bytes(html)
    return {
        'pdf': pdf_bytes,
        'is_pdf': pdf_bytes[:4] != b'<!DO',  # crude detection if we fell back to HTML bytes
        'html': html if pdf_bytes[:4] == b'<!DO' else None,
    }
