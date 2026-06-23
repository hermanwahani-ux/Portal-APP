# Security Specification: EduDigital Admin Portal

## 1. Data Invariants
- **Aplikasi (`apps`)**: Modul/aplikasi divalidasi keaktifan statusnya (`status` harus berupa `'active'` atau `'inactive'`). Nama dan URL adalah kolom mandatori. Pengguna "Viewer" dilarang menambah, memodifikasi, atau menghapus aplikasi.
- **Pengguna (`users`)**: Peran berkisar antara `'Admin'`, `'Editor'`, atau `'Viewer'`. Modifikasi peran pengguna hanya diizinkan bagi peran `'Admin'`. Pengguna dilarang mengubah status diri sendiri tanpa otorisasi.
- **Pengaturan Sistem (`system`)**: Terdapat dokumen tunggal di `system/settings`. Diperbarui hanya oleh `'Admin'`.
- **Log Aktivitas (`logs`)**: Bersifat tambah-saja (*write-once* atau *create-only*), dilarang dihapus atau dimodifikasi oleh siapa pun untuk menjaga ketertelusuran kepatuhan audit.

## 2. The "Dirty Dozen" Payloads (Aksi Penyerangan)
1. **Identity Spoofing pada `apps`**: Pengguna ilegal mencoba membuat dokumen aplikasi atas nama Admin tepercaya.
2. **Ghost Fields pada `apps`**: Pengirim menyisipkan kolom ilegal luar seperti `{ isSystemCritical: true }` ke dokumen aplikasi.
3. **Extreme ID Poisoning**: Membuat ID dokumen aplikasi sepanjang 1MB berisi karakter asing untuk mematikan kinerja portal.
4. **Mutasi `logs`**: Modifikasi audit log aktivitas masa lalu oleh pengguna mana pun untuk menyembunyikan serangan.
5. **Penghapusan `logs`**: Penghapusan entri log audit oleh Viewer atau Editor.
6. **Privilege Escalation**: Pengguna non-Admin memperbarui dokumen profil mereka sendiri di `/users/{userId}` dengan status peran `'Admin'`.
7. **Negasi Email Verified**: Penyerang mencoba bypass verifikasi dengan login menggunakan email yang sama namun status verifikasi email di-spoof menjadi `false`.
8. **Shadow Field Injection di `users`**: Percobaan menyisipkan `{ isDeveloper: true }` ke dalam profil pengguna.
9. **Settings Overwrite**: Pengguna luar atau peran "Viewer" mencoba menimpa parameter config global di `/system/settings`.
10. **Array Overfill**: Injeksi item data seukuran 1MB ke dalam array kategori atau atribut.
11. **Immutability Breach**: Pengguna mengubah nama atau tautan unik aplikasi yang ditandai konstan.
12. **Bypass Temporal Integrity**: Menetapkan tanggal pembuatan dokumen `createdAt` ke nilai masa lalu atau masa depan alih-alih `request.time` (waktu server).

## 3. Test Runner Configurations
File rujukan uji draf `src/firestore.rules.test.ts` akan memvalidasi perilaku penolakan akses `PERMISSION_DENIED` terhadap seluruh serangan di atas.
