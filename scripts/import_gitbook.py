#!/usr/bin/env python3
"""
Import GitBook CEISA 4.0 → E-Docs
Scrapes https://usermanualceisa40.gitbook.io/portal-ceisa40
and creates pages via E-Docs API.
"""

import requests
import json
import time
import re
import sys
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
API_BASE   = "http://localhost:8000/api"
EMAIL      = None   # will prompt
PASSWORD   = None   # will prompt
SITE_SLUG  = "ceisa"   # target site slug

GITBOOK_BASE = "https://usermanualceisa40.gitbook.io/portal-ceisa40"

# Full structure: (title, emoji, gitbook_path, [sub_pages])
# sub_pages: (title, gitbook_path)
PAGES = [
    {
        "title": "CEISA 4.0",
        "icon": "📖",
        "url": "",
        "description": "Terdapat pada sistem aplikasi Pabean Portal yang merupakan program aplikasi berbasis komputer yang digunakan untuk kepentingan pengelolaan dalam kegiatan kepabeanan menggunakan website.",
        "children": []
    },
    {
        "title": "Portal Pengguna Jasa",
        "icon": "🛡️",
        "url": "/portal-pengguna-jasa-1",
        "description": "Berikut beberapa proses pada halaman Portal Pengguna Jasa. User dapat mengakses halaman Portal Pengguna Jasa di https://portal.beacukai.go.id/.",
        "children": [
            {"title": "Update Profile dan Email", "url": "/portal-pengguna-jasa-1/update-profile-dan-email"},
            {"title": "Setting Role Akses Menu",  "url": "/portal-pengguna-jasa-1/setting-role-akses-menu"},
            {"title": "Lupa Password",            "url": "/portal-pengguna-jasa-1/lupa-password"},
            {"title": "Pendaftaran Baru",         "url": "/portal-pengguna-jasa-1/pendaftaran-baru"},
        ]
    },
    {
        "title": "Registrasi Pabean",
        "icon": "🔏",
        "url": "/registrasi-pabean",
        "description": "Pendaftaran yang dilakukan pengguna jasa (importir, eksportir, PPJK, pengusaha BKC, pengangkut, pengusaha kawasan berikat dan sejenisnya) untuk mendapatkan nomor identitas kepabeanan.",
        "children": [
            {"title": "Permohonan Izin Operasional FTZ",       "url": "/registrasi-pabean/permohonan-izin-operasional-ftz"},
            {"title": "Permohonan Izin Operasional PPJK",      "url": "/registrasi-pabean/permohonan-izin-operasional-ppjk"},
            {"title": "Permohonan Izin Operasional Pengangkut","url": "/registrasi-pabean/permohonan-izin-operasional-pengangkut"},
            {"title": "Cabut dan Blokir Izin",                 "url": "/registrasi-pabean/cabut-dan-blokir-izin"},
            {"title": "Browse Blokir",                         "url": "/registrasi-pabean/browse-blokir"},
        ]
    },
    {
        "title": "Portal Impor - BC 2.0",
        "icon": "📔",
        "url": "/portal-pengguna-jasa",
        "description": "Berikut beberapa proses perekaman untuk perekaman BC 2.0.",
        "children": [
            {"title": "Impor Barang Tidak Berwujud", "url": "/portal-pengguna-jasa/impor-barang-tidak-berwujud"},
            {"title": "Perekaman BC 2.0",            "url": "/portal-pengguna-jasa/perekaman-dokumen-bc-2.0"},
        ]
    },
    {
        "title": "Portal BC 2.4",
        "icon": "📙",
        "url": "/portal-bc-2.4",
        "description": "Penyampaian Dokumen Penyelesaian Barang Asal Impor yang Mendapat Kemudahan Impor Tujuan Ekspor (KITE).",
        "children": []
    },
    {
        "title": "Portal TPB",
        "icon": "📘",
        "url": "/portal-tpb",
        "description": "Portal Tempat Penimbunan Berikat untuk berbagai jenis dokumen BC.",
        "children": [
            {"title": "Dokumen BC 2.3",           "url": "/portal-tpb/dokumen-bc-2.3"},
            {"title": "Dokumen BC 2.5",           "url": "/portal-tpb/dokumen-bc-2.5"},
            {"title": "Dokumen BC 2.7",           "url": "/portal-tpb/dokumen-bc-2.7"},
            {"title": "Dokumen BC 4.0",           "url": "/portal-tpb/dokumen-bc-4.0"},
            {"title": "Dokumen BC 4.1",           "url": "/portal-tpb/dokumen-bc-4.1"},
            {"title": "Pengisian Fitur Unmanifest","url": "/portal-tpb/pengisian-fitur-unmanifest"},
        ]
    },
    {
        "title": "Portal Ekspor",
        "icon": "📗",
        "url": "/portal-bc-3.0",
        "description": "Berikut beberapa proses perekaman untuk perekaman BC 3.0 (Portal Ekspor).",
        "children": [
            {"title": "Dokumen BC 3.0", "url": "/portal-bc-3.0/ekspor-umum"},
        ]
    },
    {
        "title": "Pengajuan Rush Handling",
        "icon": "📔",
        "url": "/pengajuan-rush-handling",
        "description": "Pelayanan Segera (Rush Handling) adalah pelayanan kepabeanan yang diberikan atas barang impor tertentu yang karena karakteristiknya perlu segera dikeluarkan dari Kawasan Pabean.",
        "children": [
            {"title": "Login",                              "url": "/pengajuan-rush-handling/login"},
            {"title": "Kirim Data Pengajuan Rush Handling", "url": "/pengajuan-rush-handling/kirim-data-pengajuan-rush-handling"},
        ]
    },
    {
        "title": "Portal Manifes",
        "icon": "⛴️",
        "url": "/portal-manifes",
        "description": "Portal Manifes melingkupi desain dan fungsi fitur-fitur seperti Manifes Pengangkut, Permohonan Kontainer Kosong, Dokumen Perekaman NVOCC dan Monitoring.",
        "children": [
            {"title": "Manifes Pengangkut",          "url": "/portal-manifes/manifes-pengangkut"},
            {"title": "Permohonan Kontainer Kosong", "url": "/portal-manifes/permohonan-kontainer-kosong"},
            {"title": "Perekaman NVOCC",             "url": "/portal-manifes/perekaman-nvocc"},
            {"title": "Monitoring",                  "url": "/portal-manifes/monitoring"},
        ]
    },
    {
        "title": "Perbendaharaan",
        "icon": "🧮",
        "url": "/perbendaharaan",
        "description": "Aplikasi yang diperuntukkan untuk pencatatan dan monitoring terkait pendapatan negara baik berupa piutang maupun pembayaran.",
        "children": [
            {"title": "Browse Piutang",             "url": "/perbendaharaan/browse-piutang"},
            {"title": "Browse Pengembalian",        "url": "/perbendaharaan/browse-pengembalian"},
            {"title": "Perekaman Pengembalian",     "url": "/perbendaharaan/perekaman-pengembalian"},
            {"title": "Browse Billing",             "url": "/perbendaharaan/browse-billing"},
            {"title": "Perekaman Billing",          "url": "/perbendaharaan/perekaman-billing"},
            {"title": "Perekaman Permohonan Online","url": "/perbendaharaan/perekaman-permohonan-online"},
            {"title": "Jaminan",                    "url": "/perbendaharaan/jaminan"},
            {"title": "Browse Jaminan",             "url": "/perbendaharaan/browse-jaminan"},
            {"title": "Update Laporan Keuangan",    "url": "/perbendaharaan/update-laporan-keuangan"},
            {"title": "Penjamin Jaminan Online",    "url": "/perbendaharaan/penjamin-jaminan-online"},
            {"title": "Izin Corporate Guarantee",   "url": "/perbendaharaan/izin-corporate-guarantee"},
            {"title": "Penundaan dan Pengangsuran", "url": "/perbendaharaan/penundaan-dan-pengangsuran"},
        ]
    },
    {
        "title": "Keberatan dan Banding",
        "icon": "🏛️",
        "url": "/keberatan-dan-banding",
        "description": "Pengelolaan proses keberatan dan banding dalam sistem kepabeanan.",
        "children": [
            {"title": "Keberatan", "url": "/keberatan-dan-banding/keberatan"},
            {"title": "Banding",   "url": "/keberatan-dan-banding/banding"},
        ]
    },
    {
        "title": "Portal Barang Kiriman",
        "icon": "📦",
        "url": "/portal-barang-kiriman",
        "description": "Portal untuk pengelolaan barang kiriman dalam sistem kepabeanan CEISA 4.0.",
        "children": []
    },
    {
        "title": "Ekspor Barang Kiriman",
        "icon": "📤",
        "url": "/ekspor-barang-kiriman",
        "description": "Aplikasi Ekspor Barang Kiriman yang bertujuan untuk mengakomodir data Consignment Note yang disampaikan oleh Penyelenggara Pos berdasarkan threshold tertentu.",
        "children": []
    },
    {
        "title": "Voluntary Declaration (VD)",
        "icon": "📝",
        "url": "/voluntary-declaration-vd",
        "description": "Deklarasi Inisiatif merupakan pemberitahuan importir, pengusaha di kawasan perdagangan bebas dan pelabuhan bebas, atau pengusaha tempat penimbunan berikat.",
        "children": []
    },
    {
        "title": "Permohonan Carnet",
        "icon": "📰",
        "url": "/permohonan-carnet",
        "description": "Permohonan penggunaan dokumen Carnet dalam kepabeanan.",
        "children": []
    },
    {
        "title": "Barang Pindahan",
        "icon": "🧳",
        "url": "/barang-pindahan",
        "description": "Pengelolaan dokumen untuk barang pindahan dalam sistem CEISA 4.0.",
        "children": []
    },
    {
        "title": "SMART PCC",
        "icon": "📡",
        "url": "/smart-pcc",
        "description": "Sistem Aplikasi SMART PCC yang diantaranya terdapat Sistem Penelitian Ulang (SIMPUL).",
        "children": []
    },
    {
        "title": "Perizinan",
        "icon": "🚪",
        "url": "/perizinan",
        "description": "Pengelolaan perizinan dalam sistem kepabeanan CEISA 4.0.",
        "children": []
    },
    {
        "title": "Vessel Declaration System",
        "icon": "🚢",
        "url": "/vessel-declaration-system",
        "description": "Sistem deklarasi kapal dalam kerangka kepabeanan.",
        "children": []
    },
    {
        "title": "TPS Online",
        "icon": "🚧",
        "url": "/tps-online",
        "description": "Tempat Penimbunan Sementara (TPS) Online dalam sistem CEISA 4.0.",
        "children": []
    },
]

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def scrape_page_content(url_path):
    """Scrape GitBook page and return plain text content."""
    full_url = GITBOOK_BASE + url_path if url_path else GITBOOK_BASE
    try:
        resp = requests.get(full_url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (compatible; E-Docs Importer/1.0)"
        })
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # Try to find the main article content
        article = (
            soup.find("article") or
            soup.find("main") or
            soup.find(class_=re.compile(r"content|article|prose", re.I))
        )
        target = article or soup

        # Remove nav, sidebar, footer, scripts, styles
        for tag in target.find_all(["nav", "aside", "footer", "script", "style", "button"]):
            tag.decompose()

        # Extract structured text
        paragraphs = []
        for el in target.find_all(["h1","h2","h3","h4","p","li","ul","ol"]):
            text = el.get_text(" ", strip=True)
            if text and len(text) > 10:
                if el.name in ("h1","h2","h3","h4"):
                    level = int(el.name[1])
                    paragraphs.append(f"{'#' * level} {text}")
                elif el.name == "li":
                    paragraphs.append(f"- {text}")
                else:
                    paragraphs.append(text)

        return "\n\n".join(paragraphs[:60])  # cap at 60 blocks
    except Exception as e:
        print(f"  ⚠ Scrape failed for {url_path}: {e}")
        return None


def text_to_tiptap(text: str, description: str = "") -> dict:
    """Convert plain text/markdown-like string to Tiptap ProseMirror JSON."""
    content_nodes = []

    if description:
        content_nodes.append({
            "type": "paragraph",
            "content": [{"type": "text", "text": description}]
        })

    if not text:
        return {"type": "doc", "content": content_nodes or [{"type": "paragraph", "content": [{"type": "text", "text": ""}]}]}

    lines = text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1

        if not line:
            continue

        # Heading
        h_match = re.match(r'^(#{1,4})\s+(.+)$', line)
        if h_match:
            level = min(len(h_match.group(1)), 3)
            content_nodes.append({
                "type": "heading",
                "attrs": {"level": level},
                "content": [{"type": "text", "text": h_match.group(2)}]
            })
            continue

        # Bullet list item
        if line.startswith("- "):
            list_items = []
            while i <= len(lines) and line.startswith("- "):
                list_items.append({
                    "type": "listItem",
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": line[2:]}]
                    }]
                })
                if i < len(lines):
                    line = lines[i].strip()
                    i += 1
                else:
                    break
            content_nodes.append({"type": "bulletList", "content": list_items})
            continue

        # Normal paragraph
        # Remove navigation artifacts
        if any(skip in line for skip in ["Previous", "Next", "Powered by GitBook", "Last updated", "arrow-up-right", "chevron-"]):
            continue

        if len(line) > 5:
            content_nodes.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": line}]
            })

    if not content_nodes:
        content_nodes = [{"type": "paragraph", "content": [{"type": "text", "text": ""}]}]

    return {"type": "doc", "content": content_nodes}


# ---------------------------------------------------------------------------
# API CLIENT
# ---------------------------------------------------------------------------

class EDocsClient:
    def __init__(self, base_url):
        self.base = base_url
        self.token = None
        self.session = requests.Session()

    def login_github(self):
        """Try to login — for local dev we need a token. Using a simple approach."""
        print("\n🔐 E-Docs Login")
        print("  (Get your token from browser localStorage → authStore → token)")
        token = input("  Paste your Bearer token: ").strip()
        if not token:
            print("❌ No token provided, aborting.")
            sys.exit(1)
        self.token = token
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        # Verify
        me = self.session.get(f"{self.base}/auth/me")
        if me.status_code == 200:
            user = me.json().get("user") or me.json()
            print(f"  ✅ Logged in as: {user.get('name', 'Unknown')}")
            return True
        else:
            print(f"  ❌ Auth failed: {me.status_code} {me.text[:200]}")
            sys.exit(1)

    def get_sites(self):
        resp = self.session.get(f"{self.base}/sites")
        resp.raise_for_status()
        return resp.json().get("data", resp.json())

    def create_page(self, site_slug, title, content, parent_id=None, icon=None):
        payload = {
            "title": title,
            "content": content,
            "branch": "main",
        }
        if parent_id:
            payload["parent_id"] = parent_id
        if icon:
            payload["icon"] = icon

        resp = self.session.post(f"{self.base}/sites/{site_slug}/pages", json=payload)
        if resp.status_code in (200, 201):
            data = resp.json()
            page = data.get("data") or data
            return page
        else:
            print(f"    ❌ Failed to create '{title}': {resp.status_code} {resp.text[:300]}")
            return None


# ---------------------------------------------------------------------------
# MAIN IMPORT
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  📥 CEISA 4.0 GitBook → E-Docs Importer")
    print("=" * 60)

    client = EDocsClient(API_BASE)
    client.login_github()

    # List sites to confirm
    print(f"\n📂 Importing into site: '{SITE_SLUG}'")
    print("   (Edit SITE_SLUG in the script to change this)")

    confirm = input("\n▶ Mulai import? (y/N): ").strip().lower()
    if confirm != "y":
        print("Cancelled.")
        sys.exit(0)

    total_created = 0
    total_failed = 0

    print(f"\n🚀 Starting import of {len(PAGES)} sections...\n")

    for order_idx, page_def in enumerate(PAGES):
        title       = page_def["title"]
        icon        = page_def.get("icon", "")
        url_path    = page_def.get("url", "")
        description = page_def.get("description", "")
        children    = page_def.get("children", [])

        print(f"[{order_idx+1}/{len(PAGES)}] {icon} {title}")

        # Scrape content for parent page
        scraped = scrape_page_content(url_path) if url_path else None
        tiptap = text_to_tiptap(scraped or "", description)

        parent_page = client.create_page(
            site_slug=SITE_SLUG,
            title=f"{icon} {title}".strip(),
            content=tiptap,
            icon=icon,
        )

        if parent_page:
            parent_id = parent_page.get("id")
            print(f"  ✅ Created parent: {parent_page.get('slug', '?')}")
            total_created += 1

            # Create child pages
            for child in children:
                child_title = child["title"]
                child_url   = child.get("url", "")

                print(f"     └─ {child_title}")
                child_scraped = scrape_page_content(child_url) if child_url else None
                child_tiptap  = text_to_tiptap(child_scraped or "", "")

                child_page = client.create_page(
                    site_slug=SITE_SLUG,
                    title=child_title,
                    content=child_tiptap,
                    parent_id=parent_id,
                )

                if child_page:
                    total_created += 1
                    print(f"        ✅ {child_page.get('slug', '?')}")
                else:
                    total_failed += 1

                time.sleep(0.3)  # be nice to the server
        else:
            total_failed += 1

        time.sleep(0.5)

    print("\n" + "=" * 60)
    print(f"  ✅ Import selesai!")
    print(f"  📄 Berhasil: {total_created} halaman")
    print(f"  ❌ Gagal:    {total_failed} halaman")
    print("=" * 60)
    print(f"\n🌐 Cek hasilnya di: http://localhost:5173/sites/{SITE_SLUG}")


if __name__ == "__main__":
    main()
