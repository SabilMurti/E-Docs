# VS Code Backup Tool

Alat ini dibuat untuk membantumu membackup daftar ekstensi dan konfigurasi VS Code ke dalam project ini sebelum melakukan install ulang sistem.

## Cara Penggunaan

### 1. Jalankan Backup (Sebelum Install Ulang)

Jalankan perintah ini di terminal:

```bash
bash scripts/vscode-backup/backup.sh
```

Perintah ini akan menyimpan:

- Daftar ekstensi VS Code lokal.
- Daftar ekstensi Antigravity Server.
- File `settings.json`, `keybindings.json`, dan folder `snippets`.

**PENTING:** Setelah menjalankan backup, pastikan kamu melakukan `git add`, `git commit`, dan `git push` agar data cadangan tersimpan di repository (GitHub/GitLab).

### 2. Jalankan Restore (Setelah Install Ulang)

Setelah kamu menginstall ulang OS, menginstall VS Code, dan melakukan `git clone` project ini kembali:

```bash
bash scripts/vscode-backup/restore.sh
```

## Lokasi Data Backup

Semua data disimpan di folder `scripts/vscode-backup/data/`.
