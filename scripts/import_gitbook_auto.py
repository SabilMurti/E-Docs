#!/usr/bin/env python3
"""
CEISA 4.0 GitBook → E-Docs  (Full auto, no prompts, with images)
Playwright-based scraper — extracts full content + images from GitBook.

Run:  python3 scripts/import_gitbook_auto.py
"""

import asyncio, sys, time, requests
from playwright.async_api import async_playwright

# ──────────────────────────────────────────────────
# CONFIG  (no need to change anything else)
# ──────────────────────────────────────────────────
BEARER_TOKEN = "8|AC2CSMQd4CalZXTFZIXg8H8ejgXBDliCjxVWPvCJ66deceb5"
API_BASE     = "http://localhost:8000/api"
SITE_SLUG    = "ceisa"
GITBOOK_BASE = "https://usermanualceisa40.gitbook.io/portal-ceisa40"

SKIP_TEXT = [
    "Previous", "Next", "Powered by GitBook", "Last updated",
    "on GitBook", "Edit on GitHub",
]

# ──────────────────────────────────────────────────
# FULL PAGE STRUCTURE (title, icon, path, children)
# ──────────────────────────────────────────────────
STRUCTURE = [
    {
        "title": "Portal Pengguna Jasa", "icon": "🛡️",
        "path": "/portal-pengguna-jasa-1",
        "children": [
            {"title": "Pendaftaran Baru",         "path": "/portal-pengguna-jasa-1/pendaftaran-baru"},
            {"title": "Update Profile dan Email",  "path": "/portal-pengguna-jasa-1/update-profile-dan-email"},
            {"title": "Setting Role Akses Menu",   "path": "/portal-pengguna-jasa-1/setting-role-akses-menu"},
            {"title": "Lupa Password",             "path": "/portal-pengguna-jasa-1/lupa-password"},
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
        "path": "/portal-bc-2.4", "children": []
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
            {"title": "Pengisian Fitur Unmanifest", "path": "/portal-tpb/pengisian-fitur-unmanifest"},
        ]
    },
    {
        "title": "Portal Ekspor", "icon": "📗",
        "path": "/portal-bc-3.0",
        "children": [
            {"title": "Dokumen BC 3.0",            "path": "/portal-bc-3.0/ekspor-umum"},
            {"title": "Input Data BC 3.0",          "path": "/portal-bc-3.0/ekspor-umum/input-data-bc-3.0"},
            {"title": "Validasi dan Kirim Dokumen", "path": "/portal-bc-3.0/ekspor-umum/validasi-dan-kirim-dokumen"},
        ]
    },
    {
        "title": "Pengajuan Rush Handling", "icon": "📔",
        "path": "/pengajuan-rush-handling",
        "children": [
            {"title": "Login",                               "path": "/pengajuan-rush-handling/login"},
            {"title": "Kirim Data Pengajuan Rush Handling",  "path": "/pengajuan-rush-handling/kirim-data-pengajuan-rush-handling"},
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
            {"title": "Buat Dokumen BC 2.8",   "path": "/portal-barang-kiriman/buat-dokumen-bc-2.8"},
            {"title": "Browse Dokumen BC 2.8",  "path": "/portal-barang-kiriman/browse-dokumen-bc-2.8"},
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
        "path": "/permohonan-carnet", "children": []
    },
    {
        "title": "Barang Pindahan", "icon": "🧳",
        "path": "/barang-pindahan", "children": []
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
        "path": "/vessel-declaration-system", "children": []
    },
    {
        "title": "TPS Online", "icon": "🚧",
        "path": "/tps-online", "children": []
    },
]


# ──────────────────────────────────────────────────
# SCRAPER
# ──────────────────────────────────────────────────
async def scrape(bpage, url_path: str) -> dict:
    url = GITBOOK_BASE + url_path if url_path else GITBOOK_BASE
    nodes = []
    try:
        await bpage.goto(url, wait_until="networkidle", timeout=30000)
        try:
            await bpage.wait_for_selector("article, main", timeout=8000)
        except Exception:
            pass

        data = await bpage.evaluate("""
        () => {
            const root = document.querySelector('article') ||
                         document.querySelector('main')    ||
                         document.body;
            const result = [];
            const seen   = new Set();

            const SKIP_ROLES = new Set(['navigation','complementary','banner','contentinfo']);
            const SKIP_TAGS  = new Set(['nav','aside','footer','header','script','style','button','noscript']);

            function walk(el) {
                const tag = (el.tagName || '').toLowerCase();
                if (SKIP_TAGS.has(tag)) return;
                const role = (el.getAttribute && el.getAttribute('role')) || '';
                if (SKIP_ROLES.has(role)) return;

                if (/^h[1-4]$/.test(tag)) {
                    const t = el.innerText.trim();
                    if (t && !seen.has('h'+t)) { seen.add('h'+t); result.push({type:'heading',level:+tag[1],text:t}); }
                    return;
                }
                if (tag === 'img') {
                    const src = el.src || el.getAttribute('src') || '';
                    const alt = el.alt || '';
                    if (src && !src.startsWith('data:') && src.length > 20 && !seen.has(src)) {
                        seen.add(src);
                        result.push({type:'image', src, alt});
                    }
                    return;
                }
                if (tag === 'pre') {
                    const t = el.innerText.trim();
                    if (t && !seen.has('c'+t.slice(0,80))) { seen.add('c'+t.slice(0,80)); result.push({type:'code',text:t}); }
                    return;
                }
                if (tag === 'p') {
                    const t = el.innerText.trim();
                    const key = 'p'+t.slice(0,80);
                    if (t.length > 4 && !seen.has(key)) { seen.add(key); result.push({type:'paragraph',text:t}); }
                    return;
                }
                if (tag === 'ul' || tag === 'ol') {
                    const items = [...el.querySelectorAll(':scope > li')].map(l=>l.innerText.trim()).filter(Boolean);
                    const key = 'l'+(items[0]||'').slice(0,40);
                    if (items.length && !seen.has(key)) { seen.add(key); result.push({type:tag, items}); }
                    return;
                }
                for (const child of el.children) walk(child);
            }

            for (const child of root.children) walk(child);
            return result;
        }
        """)

        for n in data:
            t = n.get("type")
            if t == "heading":
                lv = min(int(n.get("level", 2)), 4)
                tx = n.get("text", "").strip()
                if tx:
                    nodes.append({"type": "heading", "attrs": {"level": lv},
                                  "content": [{"type": "text", "text": tx}]})
            elif t == "paragraph":
                tx = n.get("text", "").strip()
                if tx and not any(s in tx for s in SKIP_TEXT):
                    nodes.append({"type": "paragraph",
                                  "content": [{"type": "text", "text": tx}]})
            elif t == "image":
                src = n.get("src", "")
                if src:
                    nodes.append({"type": "image",
                                  "attrs": {"src": src, "alt": n.get("alt",""), "title": None}})
            elif t == "code":
                nodes.append({"type": "codeBlock", "attrs": {"language": None},
                              "content": [{"type": "text", "text": n["text"]}]})
            elif t in ("ul", "ol"):
                items = n.get("items", [])
                if items:
                    nodes.append({
                        "type": "bulletList" if t == "ul" else "orderedList",
                        "content": [
                            {"type": "listItem", "content": [
                                {"type": "paragraph", "content": [{"type": "text", "text": i}]}
                            ]} for i in items
                        ]
                    })
    except Exception as e:
        print(f"    ⚠ {url_path}: {e}")

    if not nodes:
        nodes = [{"type": "paragraph", "content": [{"type": "text", "text": "(Konten belum tersedia)"}]}]

    return {"type": "doc", "content": nodes}


# ──────────────────────────────────────────────────
# E-DOCS API
# ──────────────────────────────────────────────────
class API:
    def __init__(self):
        self.s = requests.Session()
        self.s.headers.update({
            "Authorization": f"Bearer {BEARER_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def verify(self):
        r = self.s.get(f"{API_BASE}/auth/me")
        if r.status_code != 200:
            sys.exit(f"❌ Token invalid: {r.status_code}")
        name = (r.json().get("user") or r.json()).get("name", "?")
        print(f"✅ Token valid — User: {name}")

    def all_pages(self):
        r = self.s.get(f"{API_BASE}/sites/{SITE_SLUG}/pages")
        if r.ok:
            d = r.json()
            return d.get("data", d) if isinstance(d, dict) else d
        return []

    def _flatten(self, pages, out=None):
        if out is None: out = {}
        for p in pages:
            out[p.get("title","").strip().lower()] = p
            if p.get("children"):
                self._flatten(p["children"], out)
        return out

    def update(self, slug, content):
        r = self.s.put(f"{API_BASE}/sites/{SITE_SLUG}/pages/{slug}",
                       json={"content": content})
        return r.ok

    def create(self, title, content, parent_id=None, icon=None):
        d = {"title": title, "content": content, "branch": "main"}
        if parent_id: d["parent_id"] = parent_id
        if icon:      d["icon"] = icon
        r = self.s.post(f"{API_BASE}/sites/{SITE_SLUG}/pages", json=d)
        if r.ok:
            return (r.json().get("data") or r.json())
        print(f"    ❌ {title}: {r.status_code} {r.text[:120]}")
        return None


# ──────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("  🔄 CEISA GitBook → E-Docs  (AUTO MODE with images)")
    print("=" * 60)

    api = API()
    api.verify()

    print("📋 Fetching existing pages...")
    existing_pages = api.all_pages()
    existing = api._flatten(existing_pages)
    print(f"   {len(existing)} pages found\n")

    ok = fail = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx     = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 900},
        )
        bpage   = await ctx.new_page()

        for i, section in enumerate(STRUCTURE):
            title    = section["title"]
            icon     = section.get("icon", "")
            path     = section.get("path", "")
            children = section.get("children", [])

            full_title = f"{icon} {title}".strip()
            print(f"[{i+1}/{len(STRUCTURE)}] {full_title}")

            # Scrape parent
            tiptap = await scrape(bpage, path)
            imgs   = sum(1 for n in tiptap["content"] if n.get("type") == "image")
            print(f"   📄 {len(tiptap['content'])} nodes  🖼 {imgs} images")

            parent_id = None
            match = existing.get(full_title.lower()) or existing.get(title.lower())

            if match:
                if api.update(match["slug"], tiptap):
                    parent_id = match.get("id")
                    print(f"   ✅ Updated: {match['slug']}")
                    ok += 1
                else:
                    fail += 1
            else:
                res = api.create(full_title, tiptap, icon=icon)
                if res:
                    parent_id = res.get("id")
                    print(f"   ✅ Created: {res.get('slug','?')}")
                    ok += 1
                else:
                    fail += 1

            # Scrape children
            for child in children:
                ct = child["title"]
                cp = child.get("path", "")
                print(f"      └─ {ct}")
                c_tip = await scrape(bpage, cp)
                ci    = sum(1 for n in c_tip["content"] if n.get("type") == "image")
                print(f"         📄 {len(c_tip['content'])} nodes  🖼 {ci} images")

                cm = existing.get(ct.lower())
                if cm:
                    if api.update(cm["slug"], c_tip):
                        print(f"         ✅ Updated: {cm['slug']}")
                        ok += 1
                    else:
                        fail += 1
                else:
                    r = api.create(ct, c_tip, parent_id=parent_id)
                    if r:
                        print(f"         ✅ Created: {r.get('slug','?')}")
                        ok += 1
                    else:
                        fail += 1

                await asyncio.sleep(0.5)

            await asyncio.sleep(0.8)

        await browser.close()

    print("\n" + "=" * 60)
    print(f"  ✅ Done!  Success: {ok}  Failed: {fail}")
    print(f"  🌐 http://localhost:5173/sites/{SITE_SLUG}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
