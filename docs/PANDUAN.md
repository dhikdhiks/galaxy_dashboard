# Skill Galaxy — Panduan Penggunaan

Dashboard pribadi untuk melacak jalur belajar: kumpulan **group** (topik), berisi
**skill** (resource belajar), masing-masing dengan status dan persentase
kemajuan. Tampilannya berupa galaksi ikon yang melayang.

Dokumen ini mencakup cara memasang, cara memakai tiap menu, referensi field,
sampai troubleshooting.

---

## Daftar isi

1. [Tentang aplikasi](#1-tentang-aplikasi)
2. [Prasyarat](#2-prasyarat)
3. [Instalasi](#3-instalasi)
4. [Perintah yang tersedia](#4-perintah-yang-tersedia)
5. [Menu dan halaman](#5-menu-dan-halaman)
6. [Referensi field, status, dan ikon](#6-referensi-field-status-dan-ikon)
7. [Skema data MongoDB](#7-skema-data-mongodb)
8. [Efek visual](#8-efek-visual)
9. [Deployment ke Vercel](#9-deployment-ke-vercel)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tentang aplikasi

| | |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack) + TypeScript + Tailwind CSS 4 |
| Database | MongoDB — driver resmi [`mongodb`](https://www.npmjs.com/package/mongodb) v7 |
| Autentikasi | **Tidak ada** — dashboard privat, satu pengguna |
| Build | `cacheComponents: true` + `partialPrefetching: true` (PPR) |

Data diakses lewat dua file:

- `src/lib/mongodb.ts` — koneksi (client di-cache di `globalThis`)
- `src/lib/db.ts` — CRUD bertipe untuk koleksi `groups` dan `skills`

> ### ⚠️ Tidak ada login
>
> Siapa pun yang mengetahui URL bisa **melihat sekaligus mengubah** seluruh data.
> Untuk pemakaian lokal biasanya tidak masalah. Kalau di-deploy ke Vercel, URL-nya
> bisa diakses publik — pertimbangkan ini sebelum membagikan tautan.

---

## 2. Prasyarat

- **Node.js 20+** (dikembangkan dan diuji di Node 24)
- **npm**
- **String koneksi MongoDB** — MongoDB Atlas (gratis), MongoDB lokal, atau host
  MongoDB lain

---

## 3. Instalasi

```bash
# 1. Install dependensi
npm install

# 2. Salin template environment lalu isi MongoDB URI
cp .env.example .env.local
```

Buka `.env.local` dan isi:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/"
MONGODB_DB="skill_galaxy"        # opsional, default: skill_galaxy
```

```bash
# 3. Buat koleksi + index
npm run db:init

# 4. (Opsional) isi data contoh
npm run db:seed

# 5. Jalankan
npm run dev
```

Buka <http://localhost:3000>.

### Isi `.env.local`

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `MONGODB_URI` | **Ya** | String koneksi MongoDB (`mongodb://` atau `mongodb+srv://`) |
| `MONGODB_DB` | Tidak | Nama database. Default `skill_galaxy` |

`.env.local` sudah masuk `.gitignore` (tidak ikut ter-commit). Yang di-commit
hanya `.env.example`.

### Data contoh (`npm run db:seed`)

Mengisi **6 group** dan **29 skill** untuk jalur belajar data science + web
development:

| Slug | Skill |
|---|---|
| `python-data-science` | 5 |
| `machine-learning` | 5 |
| `data-visualization` | 4 |
| `frontend-development` | 5 |
| `backend-apis` | 5 |
| `devops-tooling` | 5 |

Seed **idempoten**: hanya menambah yang belum ada (`$setOnInsert`). Menjalankan
ulang tidak pernah menimpa editan kamu (progress, nama, urutan, status).

---

## 4. Perintah yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development (hot reload) |
| `npm run build` | Build produksi ke `.next/` |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | ESLint |
| `npm run db:init` | Buat koleksi + index di MongoDB |
| `npm run db:seed` | Isi data contoh (aman dijalankan berulang) |

Script database memakai `--env-file-if-exists=.env.local`, jadi tidak error
walau `.env.local` belum dibuat (cuma akan gagal karena `MONGODB_URI` kosong).

Port 3000 terpakai? Jalankan di port lain:

```bash
npm run dev -- -p 4300
```

---

## 5. Menu dan halaman

### Peta route

| URL | Halaman |
|---|---|
| `/` | Overview |
| `/groups/[slug]` | Detail group (galaxy) |
| `/admin` | Admin |
| `/groups/<slug-tidak-ada>` | 404 |
| `/​_not-found` | Halaman 404 bawaan Next |

---

### 5.1 Navigasi header

Header menempel di atas (`sticky`) dan selalu tampil di semua halaman.

```
◉ SkillGalaxy          [ Overview ]  [ ⚙ Admin ]
```

| Menu | Tujuan |
|---|---|
| **Logo `SkillGalaxy`** | Kembali ke Overview |
| **Overview** | Halaman utama `/`. Sorot ungu menandai halaman aktif |
| **Admin** | Panel pengelolaan `/admin`. Di layar kecil hanya ikon gigi yang tampil |

---

### 5.2 Overview — `/`

Halaman utama berisi empat bagian:

**1. Kartu statistik** (4 kartu)

| Kartu | Isi |
|---|---|
| Groups | Jumlah group |
| Skills | Jumlah skill total |
| In progress | Skill berstatus *Learning* atau *Practiced* |
| Mastered | Skill berstatus *Mastered* |

**2. Kolom cari** — mencari group berdasarkan nama, slug, atau deskripsi.
Di sebelah kanannya tampil rasio hasil (`4 / 6`). Tombol **✕** muncul hanya
ketika ada kata kunci, untuk mengosongkan pencarian.

**3. Grid group** — kartu group, 1 kolom di layar kecil, 2 kolom di `sm`, 3
kolom di `lg`. Tiap kartu menampilkan:

- Ikon group
- Nama dan deskripsi (maksimal 2 baris)
- Jumlah skill + persentase kemajuan + progress bar
- Panah ↗ di kanan atas

Hover mengangkat kartu sedikit ke atas. **Klik kartu untuk masuk ke group.**

**4. Status kosong**

- Belum ada group → tombol **Create a group** (langsung ke Admin)
- Pencarian tidak cocok → tombol **Clear search**

> **Catatan kemajuan group:** persentase pada kartu adalah **rata-rata** seluruh
> progress skill di dalamnya, dibulatkan. Misal skill 0%, 50%, 100% → `50%`.

---

### 5.3 Detail group — `/groups/[slug]`

Halaman target utama: seluruh skill sebuah group dirender sebagai ikon yang
melayang.

**Navigasi atas**

| Tombol | Fungsi |
|---|---|
| `← Overview` | Kembali ke `/` |
| `✎ Edit group` | Buka `/admin` |

**Header group** — ikon, nama, deskripsi, dua statistik (**Skills** jumlah skill,
**Mastered** jumlah skill berstatus *Mastered*), serta progress bar kemajuan
group.

**Panel galaksi — dua tampilan**

Tombol toggle di kanan atas: **◎ Galaxy** / **☰ List**.

| | Galaxy | List |
|---|---|---|
| Tampilan | Ikon bulatan tersebar | Baris rapi dengan info lengkap |
| Posisi | Spiral sudut emas — selalu sama untuk data yang sama | Urut sesuai `sortOrder` lalu nama |
| Label | Muncul saat hover/focus | Selalu terlihat |
| Info | Nama + progress | Nama, URL, deskripsi, progress bar, badge status, persentase |

**Tata letak galaksi**

- Posisi memakai **spiral sudut emas** (`golden angle`), deterministik — bukan
  acak. Data yang sama selalu menghasilkan tata letak yang sama.
- **Otomatis pindah ke tampilan List** kalau skill lebih dari **24** — area
  galaksi jadi terlalu padat.
- Kamu tetap bisa menekan **Galaxy** untuk memaksa kembali.

**Interaksi ikon**

| Aksi | Hasil |
|---|---|
| Hover / focus | Ikon membesar, muncul label (nama + progress) |
| Klik | Membuka URL skill di tab baru |

Ikon tidak pernah menampilkan SVG mentah dari database — hanya **identifier**
yang dipetakan ke whitelist ikon. Kalau identifier tidak dikenal, ikon cadangan
yang tampil.

**Navigasi bawah (paginasi)**

Tombol group sebelumnya / berikutnya di kiri dan kanan, dengan penanda posisi
misal `2 / 6`. Tidak ada group sebelumnya → ruang kosong di kiri (agar posisi
penanda tetap di tengah).

**State kosong** — group tanpa skill menampilkan **This galaxy is empty** dengan
tombol **Add a skill** menuju Admin.

---

### 5.4 Admin — `/admin`

Tempat mengelola seluruh data. Ada **dua tab** di bagian atas, tersimpan langsung
ke MongoDB setiap kali disimpan.

#### Tab **Groups (n)**

Daftar seluruh group: ikon, nama, `slug`, dan deskripsi.

| Tombol | Fungsi |
|---|---|
| **+ New group** | Buka form grup baru |
| **✎ Edit** | Buka form untuk grup tersebut |
| **Delete** | Hapus group — ada dialog konfirmasi |

**Form Group — field:**

| Field | Wajib | Keterangan |
|---|---|---|
| **Name** | **Ya** | Nama tampil |
| **Slug** | Tidak | Kosongkan untuk di-derive dari nama (`Python Data Science` → `python-data-science`). Harus unik |
| **Description** | Tidak | Teks bebas, tampil di kartu & header |
| **Icon** | Tidak | *Identifier*, bukan SVG. Lihat [daftar ikon](#ikon-yang-didukung) |
| **Sort order** | Tidak | Angka. **Kecil tampil lebih dulu** |

> ### ⚠️ Menghapus group = menghapus semua isinya
>
> Seluruh skill di dalam group ikut terhapus (`deleteMany`). Konfirmasi juga
> menegaskan hal ini. **Tidak bisa dibatalkan.**
>
> Selain itu, **mengubah slug akan memutus tautan lama** — URL lama langsung
> menjadi 404.

#### Tab **Skills (n)**

Daftar seluruh skill lintas group: ikon, nama, nama group, persentase, dan badge
status. Perlu ada minimal satu group sebelum bisa menambah skill.

**Form Skill — field:**

| Field | Wajib | Keterangan |
|---|---|---|
| **Name** | **Ya** | Nama resource |
| **Group** | **Ya** | Dropdown group tujuan |
| **URL** | **Ya** | Harus URL valid (`https://…`) — dibuka saat ikon diklik |
| **Description** | Tidak | Teks pendek, tampil di tampilan List |
| **Status** | Tidak | Lihat [daftar status](#status-skill) |
| **Progress** | Tidak | Angka **0–100** |
| **Icon** | Tidak | Identifier ikon |
| **Sort order** | Tidak | Angka, kecil lebih dulu |

**Menghapus skill** — ada dialog konfirmasi; hanya skill itu yang terhapus.

**Delete** di kedua tab selalu menampilkan dialog konfirmasi dulu.

---

### 5.5 Halaman error dan 404

| Situasi | Yang tampil |
|---|---|
| Slug group tidak ada | Halaman **404 — Group not found** (status HTTP 404) dengan tombol **Back to overview** |
| Database tidak terjangkau | **Something went wrong — Could not load this view** dengan tombol **Try again** |
| Error tak terduga di route mana pun | Batas error (`src/app/error.tsx`) di level aplikasi |

---

## 6. Referensi field, status, dan ikon

### Status skill

| Nilai | Label | Makna |
|---|---|---|
| `not_started` | **Not started** | Belum disentuh (abu-abu) |
| `learning` | **Learning** | Sedang dipelajari (biru) |
| `practiced` | **Practiced** | Sudah dipraktikkan (ungu) |
| `mastered` | **Mastered** | Dikuasai (cyan) |

### Ikon yang didukung

Field **Icon** diisi **identifier**, bukan SVG. Nilai yang valid:

```
atom     book     boxes    brain    braces   camera   cloud    code
compass  cpu      database flame    flag     gamepad  git      globe
graduation layers  lightbulb message monitor music    network  orbit
palette  pen      play     puzzle   rocket   server   shield   smartphone
sparkle  star     target   terminal video    wand     wrench   zap
```

> Identifier di luar daftar **tidak error** — aplikasi menampilkan ikon cadangan
> dengan aman. Ini disengaja: SVG dari database tidak pernah di-render mentah.

### Field yang dihitung otomatis

| Field | Cara hitung |
|---|---|
| Kemajuan group | Rata-rata progress seluruh skillnya, dibulatkan |
| Statistik Overview | Dihitung dari seluruh skill |
| `createdAt` / `updatedAt` | Diisi otomatis oleh server |

---

## 7. Skema data MongoDB

### Koleksi `groups`

| Field | Tipe | Keterangan |
|---|---|---|
| `_id` | ObjectId | Kunci utama |
| `name` | string | Wajib |
| `slug` | string | **Unik** — dipakai di URL |
| `description` | string \| null | |
| `icon` | string \| null | Identifier ikon |
| `sortOrder` | number | Urutan tampil |
| `createdAt`, `updatedAt` | Date | |

### Koleksi `skills`

| Field | Tipe | Keterangan |
|---|---|---|
| `_id` | ObjectId | Kunci utama |
| `groupId` | ObjectId | Relasi ke `groups._id` |
| `name` | string | Wajib |
| `url` | string | Wajib, harus `http(s)://` |
| `icon` | string \| null | Identifier ikon |
| `description` | string \| null | |
| `status` | string | Salah satu dari 4 status |
| `progress` | number | 0–100 |
| `sortOrder` | number | Urutan tampil |
| `createdAt`, `updatedAt` | Date | |

### Index (dibuat `npm run db:init`)

| Koleksi | Index | Nama |
|---|---|---|
| `groups` | `{ slug: 1 }` **unique** | `uniq_groups_slug` |
| `groups` | `{ sortOrder: 1, name: 1 }` | `groups_sort` |
| `skills` | `{ groupId: 1 }` | `skills_group_id` |
| `skills` | `{ status: 1 }` | `skills_status` |
| `skills` | `{ sortOrder: 1, name: 1 }` | `skills_sort` |

Index `slug` unik adalah jaminan tidak ada dua group dengan slug sama; index
`groupId` membuat pemuatan skill per group jadi satu pencarian bertitik.

---

## 8. Efek visual

### Particles latar

Lapisan partikel interaktif memakai library **particles.js** (MIT, Vincent
Garreau) yang di-vendor di `particles.js-master/`, build min-nya disalin ke
`public/particles.min.js` dan dimuat sebagai script biasa.

| Setelan | Nilai |
|---|---|
| Jumlah | 80 partikel (kepadatan otomatis mengikuti ukuran layar) |
| Warna | Palet theme — ungu, biru, cyan |
| Garis penghubung | Jarak 150px, opacity 0.25 |
| Hover | **Repulse** — partikel menjauh dari kursor |
| Klik | **Push** — menambah partikel |
| Deteksi event | `window` (canvas `pointer-events: none` di belakang konten) |
| Batas keamanan | **Maksimal 240 partikel** |

> **Mengapa ada batas 240?** Mode `push` di library aslinya menambah partikel
> **tanpa batas**. Karena klik di form admin ikut terdeteksi, session panjang
> bisa membuat bidang partikel meledak dan lemot. Pembungkus di
> `src/components/ParticleField.tsx` membatasi tanpa mengubah file library.

### Drift ikon skill

Setiap ikon di galaksi memiliki **jam masing-masing** — amplitudo, kecepatan, dan
titik mulai berbeda, diturunkan dari indeks memakai sudut emas yang sama dengan
tata letaknya (deterministik, tanpa `Math.random`):

| Parameter | Rentang |
|---|---|
| Amplitudo | 6–12px |
| Durasi | 4,5–8 detik |
| Fase | `animation-delay` negatif, berbeda tiap ikon |

### Menghormati preferensi gerak

Dengan `prefers-reduced-motion: reduce`, seluruh animasi dimatikan — termasuk
partikel (tidak dimuat sama sekali) dan drift ikon.

---

## 9. Deployment ke Vercel

```bash
git init
git add .
git commit -m "Skill Galaxy dashboard"
```

1. Push ke GitHub, lalu **Import** repository di Vercel.
2. Tambahkan environment variable di **Project → Settings → Environment
   Variables**:

   | Name | Value | Scope |
   |---|---|---|
   | `MONGODB_URI` | String koneksi Atlas | Preview + Production |
   | `MONGODB_DB` | `skill_galaxy` | Preview + Production (opsional) |

3. **MongoDB Atlas → Network Access** — izinkan IP outbound Vercel, atau
   pakai `0.0.0.0/0` (praktis untuk project pribadi).
4. Deploy.

Setelah build, jalankan sekali secara lokal agar index terbentuk di Atlas:

```bash
MONGODB_URI="<uri-produksi>" npm run db:init
```

> Ingat peringatan di [bagian 1](#1-tentang-aplikasi): tidak ada autentikasi,
> jadi URL produksi bisa diakses dan diedit siapa pun yang mengetahuinya.

---

## 10. Troubleshooting

### `MONGODB_URI is not set`

`.env.local` belum dibuat atau kosong.

```bash
cp .env.example .env.local   # lalu isi MONGODB_URI
```

### `MongoNetworkTimeoutError: Socket 'secureConnect' timed out`

**Penyebab sudah terdiagnosis dan ditangani.** Bukan DNS, bukan SRV/TXT, bukan
IPv6, bukan IP whitelist Atlas, bukan proxy. Akar masalahnya: **kehilangan paket
SYN di jalur egress lokal** — sekitar 3,5% koneksi baru macet beberapa detik.

Sudah dipasang mitigasi berikut:

| Mitigasi | Lokasi |
|---|---|
| `connectTimeoutMS: 5000` (bukan default 30 detik) | `src/lib/mongodb.ts` |
| `serverSelectionTimeoutMS: 10000` | `src/lib/mongodb.ts` |
| Retry hanya untuk kegagalan cepat — tidak melipatgandakan timeout | `src/lib/mongodb.ts` |
| Negative cache 3 detik — proxy dan page tidak bayar timeout dua kali | `src/lib/mongodb.ts` |
| Warm-up koneksi saat server start | `src/instrumentation.ts` |
| Retry penuh untuk script CLI | `mongodb/connect.mjs` |

Pengukuran: sehatnya koneksi ~**400ms**. Dengan DB mati, `/` gagal dalam
~10 detik (bukan 41 detik).

Kalau masih gagal terus-menerus, cek dulu: string koneksi benar? Atlas
**Network Access** mengizinkan IP kamu?

### Halaman menampilkan skeleton lama sekali

Wajar saat koneksi pertama ke database masih di-establish. Setelah hangat,
permintaan berikutnya cepat (puluhan milidetik).

### Ikon tidak muncul / tampil ikon cadangan

Identifier di field **Icon** tidak ada di [whitelist](#ikon-yang-didukung).
Salin persis salah satu nilai di daftar.

### `slug` unik sudah dipakai

Dua group tidak boleh berbagi slug — ada index unique. Kosongkan field slug agar
di-derive otomatis dari nama.

### URL group lama sekarang 404

Slug-nya berubah. Lihat catatan di [tab Groups](#tab-groups-n).

### Port 3000 sudah terpakai

```bash
npm run dev -- -p 4300
```

### `npm run lint` gagal karena file library

`particles.js-master/**` dan `public/**` sudah masuk daftar ignore di
`eslint.config.mjs`. Kalau kamu menambah vendor library lain, tambahkan juga ke
`globalIgnores`.

### `npm audit` melaporkan 5 vulnerability severitas tinggi

Bawaan, bukan akibat perubahan terbaru. Belum diperbaiki.

---

## Struktur proyek

```
├── mongodb/
│   ├── init.mjs          # buat koleksi + index   (npm run db:init)
│   ├── seed.mjs          # data contoh idempoten  (npm run db:seed)
│   ├── connect.mjs       # opsi koneksi bersama utk CLI
│   └── README.md
├── particles.js-master/  # sumber library particles.js (MIT)
├── public/
│   └── particles.min.js  # build yang dilayankan ke browser
├── src/
│   ├── app/
│   │   ├── page.tsx              # Overview          /
│   │   ├── groups/[slug]/page.tsx# Detail group
│   │   ├── admin/                # Admin  + server actions
│   │   ├── error.tsx             # batas error
│   │   ├── not-found.tsx         # UI 404
│   │   ├── layout.tsx            # shell + ParticleField
│   │   └── globals.css           # design token, animasi
│   ├── components/               # komponen UI (client)
│   ├── lib/
│   │   ├── mongodb.ts            # koneksi
│   │   ├── db.ts                 # CRUD + agregasi
│   │   └── types.ts              # tipe + validasi
│   ├── instrumentation.ts        # warm-up koneksi saat boot
│   └── proxy.ts                  # cek slug → 404 sebelum render
├── .env.example
├── PRD.md · IMPLEMENTATION_PLAN.md · docs/
└── package.json
```

---

## Dokumen terkait

- [`README.md`](../README.md) — ringkasan singkat
- [`docs/SETUP (2).md`](<./SETUP (2).md>) — setup detail
- [`docs/DESIGN_SYSTEM (2).md`](<./DESIGN_SYSTEM (2).md>) — design token & aturan UI
- [`mongodb/README.md`](../mongodb/README.md) — skema & troubleshooting database
- [`PRD.md`](../PRD.md) — kebutuhan produk
