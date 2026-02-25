#!/usr/bin/env python3
"""
CEISA 4.0 GitBook → E-Docs Full Importer (with images + complete content)
Uses Playwright to render JS, extracts full content + images.

Usage:
    python3 scripts/import_gitbook_full.py
"""

import asyncio
import sys
import re
import time
import requests
from playwright.async_api import async_playwright

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
API_BASE    = "http://localhost:8000/api"
SITE_SLUG   = "ceisa"
GITBOOK_BASE = "https://usermanualceisa40.gitbook.io/portal-ceisa40"

# Full page tree from GitBook sidebar
# Format: { title, icon, path, children: [...] }
STRUCTURE = [
    {
        "title": "CEISA 4.0", "icon": "📖", "path": "",
        "children": []
    },
    {
        "title": "Portal Pengguna Jasa", "icon": "🛡️",
        "path": "/portal-pengguna-jasa-1",
        "children": [
            {"title": "Pendaftaran Baru",        "path": "/portal-pengguna-jasa-1/pendaftaran-baru"},
            {"title": "Update Profile dan Email", "path": "/portal-pengguna-jasa-1/update-profile-dan-email"},
            {"title": "Setting Role Akses Menu",  "path": "/portal-pengguna-jasa-1/setting-role-akses-menu"},
            {"title": "Lupa Password",            "path": "/portal-pengguna-jasa-1/lupa-password"},
        ]
    },
    {
        "title": "Registrasi Pabean", "icon": "🔏",
        "path": "/registrasi-pabean",
        "children": [
            {"title": "Permohonan Izin Operasional FTZ",        "path": "/registrasi-pabean/permohonan-izin-operasional-ftz"},
            {"title": "Permohonan Izin Operasional PPJK",       "path": "/registrasi-pabean/permohonan-izin-operasional-ppjk"},
            {"title": "Permohonan Izin Operasional Pengangkut", "path": "/registrasi-pabean/permohonan-izin-operasional-pengangkut"},
            {"title": "Cabut dan Blokir Izin",                  "path": "/registrasi-pabean/cabut-dan-blokir-izin"},
            {"title": "Browse Blokir",                          "path": "/registrasi-pabean/browse-blokir"},
        ]
    },
    {
        "title": "Portal Impor - BC 2.0", "icon": "📔",
        "path": "/portal-pengguna-jasa",
        "children": [
            {"title": "Impor Barang Tidak Berwujud", "path": "/portal-pengguna-jasa/impor-barang-tidak-berwujud"},
            {"title": "Perekaman BC 2.0",            "path": "/portal-pengguna-jasa/perekaman-dokumen-bc-2.0"},
        ]
    },
    {
        "title": "Portal BC 2.4", "icon": "📙",
        "path": "/portal-bc-2.4",
        "children": []
    },
    {
        "title": "Portal TPB", "icon": "📘",
        "path": "/portal-tpb",
        "children": [
            {"title": "Dokumen BC 2.3",            "path": "/portal-tpb/dokumen-bc-2.3"},
            {"title": "Dokumen BC 2.5",            "path": "/portal-tpb/dokumen-bc-2.5"},
            {"title": "Dokumen BC 2.7",            "path": "/portal-tpb/dokumen-bc-2.7"},
            {"title": "Dokumen BC 4.0",            "path": "/portal-tpb/dokumen-bc-4.0"},
            {"title": "Dokumen BC 4.1",            "path": "/portal-tpb/dokumen-bc-4.1"},
            {"title": "Pengisian Fitur Unmanifest","path": "/portal-tpb/pengisian-fitur-unmanifest"},
        ]
    },
    {
        "title": "Portal Ekspor", "icon": "📗",
        "path": "/portal-bc-3.0",
        "children": [
            {"title": "Dokumen BC 3.0",           "path": "/portal-bc-3.0/ekspor-umum"},
            {"title": "Input Data BC 3.0",         "path": "/portal-bc-3.0/ekspor-umum/input-data-bc-3.0"},
            {"title": "Validasi dan Kirim Dokumen","path": "/portal-bc-3.0/ekspor-umum/validasi-dan-kirim-dokumen"},
        ]
    },
    {
        "title": "Pengajuan Rush Handling", "icon": "📔",
        "path": "/pengajuan-rush-handling",
        "children": [
            {"title": "Login",                              "path": "/pengajuan-rush-handling/login"},
            {"title": "Kirim Data Pengajuan Rush Handling", "path": "/pengajuan-rush-handling/kirim-data-pengajuan-rush-handling"},
        ]
    },
    {
        "title": "Portal Manifes", "icon": "⛴️",
        "path": "/portal-manifes",
        "children": [
            {"title": "Manifes Pengangkut",          "path": "/portal-manifes/manifes-pengangkut"},
            {"title": "Permohonan Kontainer Kosong", "path": "/portal-manifes/permohonan-kontainer-kosong"},
            {"title": "Perekaman NVOCC",             "path": "/portal-manifes/perekaman-nvocc"},
            {"title": "Monitoring",                  "path": "/portal-manifes/monitoring"},
        ]
    },
    {
        "title": "Perbendaharaan", "icon": "🧮",
        "path": "/perbendaharaan",
        "children": [
            {"title": "Browse Piutang",             "path": "/perbendaharaan/browse-piutang"},
            {"title": "Browse Pengembalian",        "path": "/perbendaharaan/browse-pengembalian"},
            {"title": "Perekaman Pengembalian",     "path": "/perbendaharaan/perekaman-pengembalian"},
            {"title": "Browse Billing",             "path": "/perbendaharaan/browse-billing"},
            {"title": "Perekaman Billing",          "path": "/perbendaharaan/perekaman-billing"},
            {"title": "Perekaman Permohonan Online","path": "/perbendaharaan/perekaman-permohonan-online"},
            {"title": "Jaminan",                    "path": "/perbendaharaan/jaminan"},
            {"title": "Browse Jaminan",             "path": "/perbendaharaan/browse-jaminan"},
            {"title": "Update Laporan Keuangan",    "path": "/perbendaharaan/update-laporan-keuangan"},
            {"title": "Penjamin Jaminan Online",    "path": "/perbendaharaan/penjamin-jaminan-online"},
            {"title": "Izin Corporate Guarantee",   "path": "/perbendaharaan/izin-corporate-guarantee"},
            {"title": "Penundaan dan Pengangsuran", "path": "/perbendaharaan/penundaan-dan-pengangsuran"},
        ]
    },
    {
        "title": "Keberatan dan Banding", "icon": "🏛️",
        "path": "/keberatan-dan-banding",
        "children": [
            {"title": "Keberatan", "path": "/keberatan-dan-banding/keberatan"},
            {"title": "Banding",   "path": "/keberatan-dan-banding/banding"},
        ]
    },
    {
        "title": "Portal Barang Kiriman", "icon": "📦",
        "path": "/portal-barang-kiriman",
        "children": [
            {"title": "Buat Dokumen BC 2.8",         "path": "/portal-barang-kiriman/buat-dokumen-bc-2.8"},
            {"title": "Browse Dokumen BC 2.8",       "path": "/portal-barang-kiriman/browse-dokumen-bc-2.8"},
        ]
    },
    {
        "title": "Ekspor Barang Kiriman", "icon": "📤",
        "path": "/ekspor-barang-kiriman",
        "children": [
            {"title": "Perekaman Ekspor Barang Kiriman", "path": "/ekspor-barang-kiriman/perekaman"},
        ]
    },
    {
        "title": "Voluntary Declaration (VD)", "icon": "📝",
        "path": "/voluntary-declaration-vd",
        "children": [
            {"title": "Perekaman VD", "path": "/voluntary-declaration-vd/perekaman-vd"},
        ]
    },
    {
        "title": "Permohonan Carnet", "icon": "📰",
        "path": "/permohonan-carnet",
        "children": []
    },
    {
        "title": "Barang Pindahan", "icon": "🧳",
        "path": "/barang-pindahan",
        "children": []
    },
    {
        "title": "SMART PCC", "icon": "📡",
        "path": "/smart-pcc",
        "children": [
            {"title": "SIMPUL", "path": "/smart-pcc/simpul"},
        ]
    },
    {
        "title": "Perizinan", "icon": "🚪",
        "path": "/perizinan",
        "children": [
            {"title": "Permohonan Izin", "path": "/perizinan/permohonan-izin"},
        ]
    },
    {
        "title": "Vessel Declaration System", "icon": "🚢",
        "path": "/vessel-declaration-system",
        "children": []
    },
    {
        "title": "TPS Online", "icon": "🚧",
        "path": "/tps-online",
        "children": []
    },
]

# ─────────────────────────────────────────────
# CONTENT SCRAPER (Playwright)
# ─────────────────────────────────────────────

SKIP_TEXT_PATTERNS = [
    "Previous", "Next", "Powered by GitBook", "Last updated",
    "chevron-", "arrow-up-right", "gitbookPowered",
]

async def scrape_page(page, url_path: str) -> dict:
    """
    Returns { nodes: [...tiptap_nodes] }
    where nodes include headings, paragraphs, images, lists, code blocks.
    """
    full_url = GITBOOK_BASE + url_path if url_path else GITBOOK_BASE
    nodes = []

    try:
        await page.goto(full_url, wait_until="networkidle", timeout=30000)
        # Wait for main content to render
        try:
            await page.wait_for_selector("main, article, [role='main']", timeout=8000)
        except Exception:
            pass

        # Extract content via JS evaluation
        content_data = await page.evaluate("""
        () => {
            // Find the article/main content area
            const article = document.querySelector('article') ||
                            document.querySelector('main') ||
                            document.querySelector('[data-testid="page-content"]') ||
                            document.querySelector('.page-inner') ||
                            document.body;

            const nodes = [];
            const seen = new Set();

            function processNode(el) {
                const tag = el.tagName ? el.tagName.toLowerCase() : '';

                if (['nav', 'aside', 'footer', 'header', 'script', 'style', 'button', 'form'].includes(tag)) return;
                if (el.getAttribute && el.getAttribute('role') === 'navigation') return;

                // Headings
                if (['h1','h2','h3','h4'].includes(tag)) {
                    const text = el.textContent.trim();
                    if (text && !seen.has('h:'+text)) {
                        seen.add('h:'+text);
                        nodes.push({ type: 'heading', level: parseInt(tag[1]), text });
                    }
                    return;
                }

                // Images
                if (tag === 'img') {
                    const src = el.getAttribute('src') || '';
                    const alt = el.getAttribute('alt') || '';
                    if (src && !src.startsWith('data:') && src.length > 10) {
                        const absSrc = src.startsWith('http') ? src : window.location.origin + src;
                        if (!seen.has('img:'+absSrc)) {
                            seen.add('img:'+absSrc);
                            nodes.push({ type: 'image', src: absSrc, alt });
                        }
                    }
                    return;
                }

                // Code blocks
                if (tag === 'pre' || tag === 'code') {
                    const text = el.textContent.trim();
                    if (text && el.closest('pre')) {
                        if (!seen.has('code:'+text.slice(0,100))) {
                            seen.add('code:'+text.slice(0,100));
                            nodes.push({ type: 'codeBlock', text });
                        }
                    }
                    return;
                }

                // Paragraphs
                if (tag === 'p') {
                    const text = el.textContent.trim();
                    if (text && text.length > 5 && !seen.has('p:'+text.slice(0,100))) {
                        seen.add('p:'+text.slice(0,100));
                        nodes.push({ type: 'paragraph', text });
                    }
                    return;
                }

                // Lists
                if (tag === 'ul' || tag === 'ol') {
                    const items = [];
                    el.querySelectorAll(':scope > li').forEach(li => {
                        const t = li.textContent.trim();
                        if (t) items.push(t);
                    });
                    if (items.length && !seen.has('list:'+items[0])) {
                        seen.add('list:'+items[0]);
                        nodes.push({ type: tag === 'ol' ? 'orderedList' : 'bulletList', items });
                    }
                    return;
                }

                // Recurse into children
                el.childNodes.forEach(child => {
                    if (child.nodeType === 1) processNode(child);
                });
            }

            article.childNodes.forEach(child => {
                if (child.nodeType === 1) processNode(child);
            });

            return nodes;
        }
        """)

        # Convert to Tiptap format
        for node in content_data:
            t = node.get("type")

            if t == "heading":
                level = min(node.get("level", 2), 3)
                text  = node.get("text", "").strip()
                if text:
                    nodes.append({
                        "type": "heading",
                        "attrs": {"level": level},
                        "content": [{"type": "text", "text": text}]
                    })

            elif t == "paragraph":
                text = node.get("text", "").strip()
                # Skip nav/footer artifacts
                if text and not any(p in text for p in SKIP_TEXT_PATTERNS):
                    nodes.append({
                        "type": "paragraph",
                        "content": [{"type": "text", "text": text}]
                    })

            elif t == "image":
                src = node.get("src", "")
                alt = node.get("alt", "")
                if src:
                    nodes.append({
                        "type": "image",
                        "attrs": {"src": src, "alt": alt, "title": alt}
                    })

            elif t == "codeBlock":
                text = node.get("text", "")
                if text:
                    nodes.append({
                        "type": "codeBlock",
                        "attrs": {"language": None},
                        "content": [{"type": "text", "text": text}]
                    })

            elif t in ("bulletList", "orderedList"):
                items = node.get("items", [])
                list_items = [
                    {
                        "type": "listItem",
                        "content": [{"type": "paragraph", "content": [{"type": "text", "text": item}]}]
                    }
                    for item in items if item
                ]
                if list_items:
                    nodes.append({"type": t, "content": list_items})

    except Exception as e:
        print(f"    ⚠ Scrape error for {url_path}: {e}")

    if not nodes:
        nodes = [{"type": "paragraph", "content": [{"type": "text", "text": ""}]}]

    return {"type": "doc", "content": nodes}


# ─────────────────────────────────────────────
# E-DOCS API CLIENT
# ─────────────────────────────────────────────

class EDocsClient:
    def __init__(self):
        self.session = requests.Session()

    def login(self):
        print("\n🔐 E-Docs Login")
        token = input("  Paste Bearer token: ").strip()
        if not token:
            sys.exit("❌ No token.")
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        me = self.session.get(f"{API_BASE}/auth/me")
        if me.status_code != 200:
            sys.exit(f"❌ Auth failed: {me.status_code}")
        user = me.json().get("user") or me.json()
        print(f"  ✅ Logged in as: {user.get('name', '?')}")

    def get_pages(self):
        """Return list of existing pages in the site."""
        resp = self.session.get(f"{API_BASE}/sites/{SITE_SLUG}/pages")
        if resp.status_code == 200:
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
        return []

    def find_page_by_title(self, title, pages, prefix=""):
        """Recursively find a page slug by title."""
        for p in pages:
            full_title = (prefix + p.get("title", "")).strip()
            # Match if title ends with our title (handles icon prefix)
            if p.get("title", "").strip().endswith(title.strip()) or \
               title.strip() in p.get("title", "").strip():
                return p
            if p.get("children"):
                found = self.find_page_by_title(title, p["children"])
                if found:
                    return found
        return None

    def update_page(self, page_slug, content, title=None):
        """Update existing page content."""
        payload = {"content": content}
        if title:
            payload["title"] = title
        resp = self.session.put(
            f"{API_BASE}/sites/{SITE_SLUG}/pages/{page_slug}",
            json=payload
        )
        if resp.status_code in (200, 201):
            return resp.json().get("data") or resp.json()
        else:
            print(f"    ❌ Update failed {page_slug}: {resp.status_code} {resp.text[:200]}")
            return None

    def create_page(self, title, content, parent_id=None, icon=None):
        """Create new page."""
        payload = {"title": title, "content": content, "branch": "main"}
        if parent_id:
            payload["parent_id"] = parent_id
        if icon:
            payload["icon"] = icon
        resp = self.session.post(
            f"{API_BASE}/sites/{SITE_SLUG}/pages",
            json=payload
        )
        if resp.status_code in (200, 201):
            return resp.json().get("data") or resp.json()
        else:
            print(f"    ❌ Create failed '{title}': {resp.status_code} {resp.text[:200]}")
            return None


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("  🔄 CEISA 4.0 GitBook → E-Docs  (Full Re-import with Images)")
    print("=" * 60)

    client = EDocsClient()
    client.login()

    # Build a flat map of existing pages {title_lower: slug}
    print("\n📋 Fetching existing pages...")
    existing_pages = client.get_pages()

    def flatten(pages, result=None):
        if result is None: result = {}
        for p in pages:
            result[p.get("title", "").strip().lower()] = p
            if p.get("children"):
                flatten(p["children"], result)
        return result

    existing_map = flatten(existing_pages)
    print(f"  Found {len(existing_map)} existing pages")

    mode = input("\n▶ Mode: [u]pdate existing / [c]reate new / [b]oth? (default: u): ").strip().lower() or "u"
    confirm = input(f"▶ Start import? (y/N): ").strip().lower()
    if confirm != "y":
        sys.exit("Cancelled.")

    total_ok = total_fail = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 900}
        )
        bpage = await context.new_page()

        print(f"\n🚀 Importing {len(STRUCTURE)} sections...\n")

        for idx, section in enumerate(STRUCTURE):
            s_title = section["title"]
            s_icon  = section.get("icon", "")
            s_path  = section.get("path", "")
            children = section.get("children", [])

            print(f"[{idx+1}/{len(STRUCTURE)}] {s_icon} {s_title}")

            # Scrape parent page
            tiptap = await scrape_page(bpage, s_path)
            img_count = sum(1 for n in tiptap["content"] if n.get("type") == "image")
            print(f"  📄 {len(tiptap['content'])} nodes, 🖼 {img_count} images")

            full_title = f"{s_icon} {s_title}".strip()

            # Find existing or create
            existing = existing_map.get(full_title.lower()) or \
                       existing_map.get(s_title.lower()) or \
                       client.find_page_by_title(s_title, existing_pages)

            parent_id = None
            if existing and mode in ("u", "b"):
                result = client.update_page(existing["slug"], tiptap)
                if result:
                    parent_id = existing.get("id")
                    print(f"  ✅ Updated: {existing['slug']}")
                    total_ok += 1
                else:
                    total_fail += 1
            elif mode in ("c", "b") or not existing:
                result = client.create_page(full_title, tiptap, icon=s_icon)
                if result:
                    parent_id = result.get("id")
                    print(f"  ✅ Created: {result.get('slug', '?')}")
                    total_ok += 1
                else:
                    total_fail += 1

            # Process children
            for child in children:
                c_title = child["title"]
                c_path  = child.get("path", "")

                print(f"     └─ {c_title}")
                c_tiptap = await scrape_page(bpage, c_path)
                c_imgs   = sum(1 for n in c_tiptap["content"] if n.get("type") == "image")
                print(f"        📄 {len(c_tiptap['content'])} nodes, 🖼 {c_imgs} images")

                c_existing = existing_map.get(c_title.lower()) or \
                             client.find_page_by_title(c_title, existing_pages)

                if c_existing and mode in ("u", "b"):
                    r = client.update_page(c_existing["slug"], c_tiptap)
                    if r:
                        print(f"        ✅ Updated: {c_existing['slug']}")
                        total_ok += 1
                    else:
                        total_fail += 1
                elif mode in ("c", "b") or not c_existing:
                    r = client.create_page(c_title, c_tiptap, parent_id=parent_id)
                    if r:
                        print(f"        ✅ Created: {r.get('slug', '?')}")
                        total_ok += 1
                    else:
                        total_fail += 1

                await asyncio.sleep(0.3)

            await asyncio.sleep(0.5)

        await browser.close()

    print("\n" + "=" * 60)
    print(f"  ✅ Done! Success: {total_ok}  Failed: {total_fail}")
    print(f"  🌐 http://localhost:5173/sites/{SITE_SLUG}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
