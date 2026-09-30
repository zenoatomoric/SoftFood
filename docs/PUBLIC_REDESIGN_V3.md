# หน้า Public ฉบับปรับปรุง (branch `redesign-public-v3`)

เอกสารนี้อธิบายว่า branch นี้เปลี่ยนอะไรไปจาก `main` (เวอร์ชันที่ deploy อยู่ที่ soft-food.vercel.app) ทีละไฟล์ พร้อมเหตุผล วิธีทดสอบ และวิธีย้อนกลับ

- **ขอบเขต:** เฉพาะหน้า public (หน้าแรกที่ผู้ชมทั่วไปเห็น) กับ API ที่หน้านี้ดึงข้อมูล
- **ไม่แตะ:** dashboard, ระบบ login/สิทธิ์, ฟอร์มสำรวจ, Supabase schema, package.json (ไม่มี dependency ใหม่)
- **สถานะ:** ยังไม่ merge และยังไม่ deploy ขึ้น production

---

## 1. วิธีเข้าดู

| วิธี | ทำอย่างไร | เหมาะกับ |
|---|---|---|
| ดูโค้ดที่เปลี่ยนบน GitHub | เปิด Pull Request ของ branch นี้ แล้วกดแท็บ **Files changed** จะเห็นทุกบรรทัดที่เพิ่ม/ลบเทียบกับ `main` · แท็บ **Commits** แยกงานเป็นก้อน ๆ ตามหัวข้อ 6 | ตรวจโค้ด |
| ดูหน้าเว็บจริงผ่าน Vercel Preview | ถ้าโปรเจกต์ Vercel เชื่อมกับ repo นี้ไว้ Vercel จะสร้างลิงก์ Preview ให้ branch นี้อัตโนมัติ (ดูใน PR ส่วน Checks หรือหน้า Deployments ของ Vercel) · **ลิงก์ Preview แยกจาก production เว็บจริงไม่เปลี่ยน** | ดูหน้าตา + ทดสอบบนมือถือ |
| รันในเครื่อง | `git fetch && git checkout redesign-public-v3` → `npm install` → ใส่ `.env.local` (Supabase URL + anon key เดิม) → `npm run dev` แล้วเปิด http://localhost:3000 | debug |

> ถ้า Windows รัน `npm run dev` แล้วค้างที่ "Starting..." และมีคำเตือนว่า Next.js เลือก workspace root ผิด (มี `package-lock.json` อยู่ที่โฟลเดอร์ home) ให้ใช้ `npx next dev --webpack` แทน

---

## 2. สรุปสิ่งที่ผู้ชมจะเห็นต่างจากเว็บปัจจุบัน

1. **ธีมใหม่ (แนว A):** พื้นหลังสว่างเกือบขาว ทองเป็นสีเน้น ฟอนต์ Kanit และสีหลักเดิม (น้ำเงินคลอง `#0d3348` + ทอง `#c8963c`)
2. **Hero:** ภาพพื้นหลัง 3 ภาพเปลี่ยนจากภาพ AI เป็นภาพนิ่งจากคลิปวิดีโอของโครงการ
3. **ส่วน "เรื่องราวของพื้นที่":** จัดข้อความเป็น 2 คอลัมน์ (หัวเรื่อง + ตัวเลขสถิติ | เนื้อความ) แล้วตามด้วย **วิดีโอหลักของเว็บจาก YouTube** เต็มความกว้าง
4. **แผนที่:** เลือกชั้นแผนที่ได้ 3 แบบ (สว่าง / มินิมอล / ดาวเทียม) ปุ่มซูมใหญ่ขึ้น มีหน้าจอ "กำลังโหลดแผนที่"
5. **ส่วน 3 คลอง:** หัวแต่ละคลองไม่มีภาพ AI แล้ว มีช่อง **วิดีโอแนะนำอาหารของคลอง (YouTube)** ซึ่งจะแสดงเมื่อใส่ลิงก์ · การ์ดเมนู Signature ขนาดเท่าการ์ดปกติ (เดิมกินเต็มแถว) · ตัวกรองเริ่มที่ "ทั้งหมด"
6. **หน้าต่างรายละเอียดเมนู (popup):** แสดงรูปครบทุกรูปของเมนู (เว็บปัจจุบันแสดงรูปเดียวสำหรับเมนู 36/Signature) · ไม่มีไอคอน · มีข้อมูลเพิ่ม (คุณค่าทางสังคม-วัฒนธรรม, รางวัล/อ้างอิง, ความถี่, ความยากง่าย) · รองรับวิดีโอ YouTube
7. **ส่วนใหม่ "E-book":** ฝังหนังสือ "สำรับ สายน้ำ สามคลอง" ให้พลิกอ่านในหน้า + ปุ่มเปิดเต็มจอ + ลิงก์ "อีบุ๊ก" ในเมนูด้านบน
8. **ไม่แสดงที่อยู่ใด ๆ:** ทั้งที่อยู่ผู้ให้ข้อมูล (การ์ด/popup แสดงแค่ชื่อคลอง) และที่อยู่ท้ายหน้า
9. **ตัดออก:** section "Impact" (ตัวเลขซ้ำกับส่วนเรื่องราว) และป้าย "พิกัดจริงจากการสำรวจ" เหนือแผนที่

---

## 3. รายละเอียดทีละไฟล์

### 3.1 `app/api/public/menus/route.ts` (API ที่หน้า public เรียก)

**เอาออก:** ที่อยู่ผู้ให้ข้อมูล ไม่ถูก select และไม่ถูกส่งออกไปที่ browser อีก

```diff
- informants (full_name, canal_zone, address_full, gps_lat, gps_long),
+ informants (full_name, canal_zone, gps_lat, gps_long),
  ...
- address: inf?.address_full || '',
```

**เพิ่ม:** field สำหรับ popup (ถ้าคอลัมน์ว่างจะได้ค่าว่าง ไม่ error)

```ts
social_value: item.social_value || '',
awards_references: item.awards_references || '',
consumption_freq: item.consumption_freq || [],
complexity: item.complexity || [],
```

- ผู้เรียก API นี้มีแค่ `LandingPage.tsx` (ตรวจด้วยการค้นหา `api/public/menus` ทั้งโปรเจกต์แล้ว) การเอา `address` ออกจึงไม่กระทบหน้าอื่น
- ยังส่ง `gps_lat` / `gps_long` เหมือนเดิมเพื่อวางหมุดบนแผนที่

### 3.2 `app/components/LandingPage.tsx` (โครงหน้า public)

**ค่าคงที่ที่แก้ได้เองโดยไม่ต้องแตะส่วนอื่น** (อยู่ช่วงบนของไฟล์):

```ts
const MAIN_VIDEO_URL = 'https://www.youtube.com/watch?v=aTaPfeCg0LI'   // วิดีโอหลักในส่วนเรื่องราว
const EBOOK_URL = 'https://samrab-samklong.pages.dev/'                  // e-book ที่ฝังในหน้า

const CANALS = [
  { id: 'บางเขน', ..., video: '', ... },       // ใส่ลิงก์ YouTube ของคลองนี้ · ว่าง = ไม่แสดงช่องวิดีโอ
  { id: 'เปรมประชากร', ..., video: '', ... },
  { id: 'ลาดพร้าว', ..., video: '', ... },
]
```

ลิงก์ YouTube ใส่ได้ทุกรูปแบบ (`watch?v=`, `youtu.be/`, `shorts/`, `embed/`) โค้ดจะแปลงเป็นลิงก์ฝังเอง

**ลำดับ section ในหน้า:** Navbar → Hero → เรื่องราว (+ วิดีโอหลัก) → แผนที่ → 3 คลอง → E-book (ใหม่) → ภาคีเครือข่าย → Footer

**จุดที่เปลี่ยนในโค้ด:**

- **Story:** ใช้ `story-grid story-grid--text` (ซ้าย `.bquote` + `.s-stats` / ขวา `.story-body` 3 ย่อหน้า) ตามด้วย `<figure className="story-video">` ที่ฝัง `<iframe src={youTubeEmbedUrl(MAIN_VIDEO_URL)}>`
- **หัวคลอง:** กล่อง `.cphoto` (ภาพ AI) ถูกแทนด้วย

  ```tsx
  {youTubeEmbedUrl(canal.video) && (<figure className="canal-video">…<iframe …/></figure>)}
  ```

  ถ้าไม่มีลิงก์ `canal-top` จะได้ class `no-media` (ข้อความเต็มแนว)
- **การ์ด Signature:** เนื้อหาเหมือนเดิม (ชื่อ, คลอง, เรื่องเล่า, หมวด) แต่ป้าย "Signature" ที่ซ้ำด้านล่างถูกตัด ขนาดคุมด้วย CSS บล็อก 8d
- **ตัวกรองแต่ละคลอง:** ค่าเริ่มต้นเปลี่ยนจาก `'sig'` เป็น `'all'` (`canalFilters` state)
- **E-book:** `<section className="ebook-sec" id="ebook">` มี `<iframe src={EBOOK_URL}>` + ลิงก์เปิดแท็บใหม่ · เพิ่มเมนู `อีบุ๊ก` ในแถบนำทาง
- **ตัดออก:** section Impact, บรรทัดที่อยู่ในคอลัมน์ "ติดต่อโครงการ" ของ footer, field `address` ใน `MenuItem` interface
- `import { MenuDetailPopup, youTubeEmbedUrl } from './MenuDetailPopup'`
- field `image` ใน `CANALS` ไม่ได้ถูกใช้แสดงผลแล้ว (เก็บไว้เผื่อใช้ภายหลัง) ไฟล์ `public/Bangken.png`, `pamepacha.png`, `ladpaw.png` ยังอยู่ ลบได้ถ้าไม่ใช้ที่อื่น

### 3.3 `app/components/MenuDetailPopup.tsx` (หน้าต่างรายละเอียดเมนู)

**รูปครบทุกรูป** (แก้ปัญหาบนเว็บปัจจุบันที่เมนู 36/Signature แสดงรูปเดียว):

```diff
- if (isSigOrRec && menu.thumbnail) return [menu.thumbnail]
- if (isSigOrRec && menu.photos && menu.photos.length > 0) return menu.photos
+ const photos = [menu.thumbnail, ...(menu.photos || [])].filter(Boolean) as string[]
+ const uniquePhotos = Array.from(new Set(photos))
+ if (isSigOrRec && uniquePhotos.length > 0) return uniquePhotos
```

- เมนูที่ไม่ใช่ 36/Signature ยังใช้ภาพแทนตามหมวด (`/menu1-3.png`) เหมือนเดิม
- `useEffect(() => setActivePhoto(0), [menu?.menu_id])` รีเซ็ตรูปกลับเป็นรูปแรกเมื่อเปิดเมนูใหม่ (popup เป็น instance เดียวที่ใช้ซ้ำ)

**ไม่มีไอคอน:** ไม่ import `@iconify/react` แล้ว ปุ่มปิดและปุ่มเลื่อนรูปใช้ตัวอักษร `×` `‹` `›` · หัวข้อแต่ละส่วนเป็นข้อความล้วน

**ช่องข้อมูลสรุป:** `ที่อยู่ / ชุมชน` เปลี่ยนเป็น `คลอง` (`คลอง${menu.canal_zone}`)

**วิดีโอ:** เพิ่มฟังก์ชัน export

```ts
export function youTubeEmbedUrl(url): string | null   // ลิงก์ YouTube → https://www.youtube-nocookie.com/embed/<id> · ไม่ใช่ YouTube → null
```

`VideoBox` ใช้ `<iframe>` เมื่อเป็นลิงก์ YouTube และใช้ `<video>` เหมือนเดิมเมื่อเป็นไฟล์วิดีโอใน Storage · กล่องวิดีโอใน popup ยังแสดงเฉพาะเมนู Signature ที่มี `video_url` / `promo_video_url`

**ส่วนข้อมูลที่เพิ่ม:** คุณค่าทางสังคมและวัฒนธรรม, รางวัล/อ้างอิง, ความถี่, ความยากง่าย (แสดงเมื่อมีข้อมูล) · วัตถุดิบเป็นตาราง · วิธีทำเป็นขั้นตอนมีเลขลำดับ

### 3.4 `app/components/MapView.tsx` (แผนที่)

- ตัวสลับชั้นแผนที่ 3 แบบ (`MAP_STYLES`: bright / positron / Esri ดาวเทียม) ผ่าน `map.setStyle()`
- **สำคัญ:** หลังสลับชั้น หมุดถูกวางใหม่ใน event `style.load`

  ```ts
  map.on('style.load', () => {
      if (!map.getSource('menus')) addLayers()
  })
  ```

  (รุ่นก่อนหน้าใช้ `styledata` + `isStyleLoaded()` ซึ่งพลาดจังหวะ ทำให้หมุดหายหลังสลับชั้น)
- listener คลิก/hover ของหมุดลงทะเบียนครั้งเดียวตอนสร้างแผนที่ (ไม่ซ้อนกันเมื่อสลับชั้นหลายครั้ง)
- ปุ่มซูม +/− ของเราเอง (ตัด `NavigationControl` และ Ctrl+scroll เดิม) · `cooperativeGestures: true` สำหรับมือถือ
- overlay "กำลังโหลดแผนที่…" จนกว่าแผนที่โหลดเสร็จ + `map.resize()` หลังโหลด
- สีหมุดตามคลอง, popup ของหมุด และ legend ยังเป็น logic เดิม

### 3.5 `app/landing.css`

- ตัวแปรสีที่ `:root` (`--cd`, `--go`, `--cr` ฯลฯ) และบล็อก `VARIANT A OVERRIDES` = ธีมแนว A
- บล็อกท้ายไฟล์ที่เพิ่มในรอบนี้ (ค้นด้วยเลขบล็อกได้):

| บล็อก | ใช้กับ |
|---|---|
| `8)` | กรอบวิดีโอหลัก `.story-video` (16:9) |
| `8b)` | ความกว้างวิดีโอหลัก `.story-video-wrap` (สูงสุด 1100px) |
| `8c)` | เลย์เอาต์ข้อความส่วนเรื่องราว `.story-grid--text`, `.story-body` |
| `8d)` | การ์ด Signature ขนาดกะทัดรัด `.fcard-sig` |
| `8e)` | หัวคลองไม่มีสื่อ `.no-media` + กรอบวิดีโอคลอง `.canal-video` |
| `9)` | ส่วน E-book `.ebook-sec`, `.ebook-frame`, `.ebook-btn` |

- ภาพ hero: `.cs1` `.cs2` `.cs3` ชี้ไปที่ `/hero/*.jpg`

### 3.6 `public/hero/` (ไฟล์ใหม่)

| ไฟล์ | ที่มา (ไฟล์วิดีโอโครงการ `intro_plus_9menus.mp4`) | ขนาด |
|---|---|---|
| `hero-canal-bridge.jpg` | วินาทีที่ 5.5 ครอปคำบรรยายด้านล่างออก | 1920×880, ~200 KB |
| `hero-samrab.jpg` | วินาทีที่ 182 | 1920×1080, ~385 KB |
| `hero-canal-walkway.jpg` | วินาทีที่ 38 | 1920×1080, ~250 KB |

---

## 4. วิธีทดสอบ (checklist)

- [ ] `npx tsc --noEmit` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] **API:** เปิด `/api/public/menus` ต้องไม่มี key `address` ในผลลัพธ์ และยังมี `gps_lat` / `gps_long`
- [ ] **Hero:** 3 ภาพสลับได้ กดจุดด้านล่างเปลี่ยนภาพได้ อ่านข้อความได้ทุกภาพ
- [ ] **วิดีโอหลัก:** เล่นได้ในส่วนเรื่องราว เต็มความกว้าง บนมือถือไม่ล้นจอ
- [ ] **แผนที่:** หมุดขึ้นครบ → สลับ มินิมอล → ดาวเทียม → สว่าง แล้ว **หมุดต้องยังอยู่ทุกครั้ง** · คลิกหมุดแล้ว popup ขึ้น กด "ดูรายละเอียด" แล้วเปิดหน้าต่างเมนูได้
- [ ] **3 คลอง:** หัวคลองไม่มีภาพ · การ์ด Signature เรียง 3 ใบต่อแถวบนจอคอม · ใส่ลิงก์ทดสอบใน `CANALS[0].video` แล้ววิดีโอขึ้นข้างข้อความ (ทดสอบเสร็จเอาออก)
- [ ] **Popup:** เมนู Signature/36 แสดงรูปครบ (เช่น แกงส้มปลาช่อนสายบัว 5 รูป) · เปลี่ยนเมนูแล้วกลับไปรูปแรก · ไม่มีไอคอน · ช่อง "คลอง" ไม่มีที่อยู่
- [ ] **E-book:** เล่มโหลดในกรอบและพลิกหน้าได้ · ปุ่ม "เปิดอ่านแบบเต็มจอ" เปิดแท็บใหม่ · เมนู "อีบุ๊ก" เลื่อนมาที่ส่วนนี้
- [ ] **ข้อความทั้งหน้า:** ค้นหาคำว่า "ที่อยู่" และ "รัชดาภิเษก" ต้องไม่พบ
- [ ] **มือถือ (กว้าง ~390px):** ทุก section เรียงเป็นคอลัมน์เดียว ไม่มีการเลื่อนแนวนอน

ผลที่ตรวจแล้วก่อนส่ง: `tsc --noEmit` ผ่าน · API คืน 453 เมนูโดยไม่มี `address` · ภาพหน้าจอ (Playwright) ของ hero ทั้ง 3 ภาพ, ส่วนเรื่องราว, แผนที่หลังสลับชั้น 4 รอบ, การ์ด, popup, e-book, มือถือ 390px ถูกต้อง · `next build --webpack` ผ่าน (31 routes) บนเครื่อง Windows · ขอให้ทีมรัน `npm run build` ซ้ำบนสภาพแวดล้อมของทีมก่อน merge

---

## 5. จุดที่ควรรู้ / ความเสี่ยง

- **iframe ภายนอก 2 แหล่ง:** `www.youtube-nocookie.com` (วิดีโอ) และ `samrab-samklong.pages.dev` (e-book) · ตอนนี้ `next.config.ts` ไม่ได้ตั้ง Content-Security-Policy จึงไม่ติด ถ้าทีมเพิ่ม CSP ภายหลังต้องอนุญาต `frame-src` สองโดเมนนี้
- **คอลัมน์ใหม่ใน API** (`social_value`, `awards_references`, `consumption_freq`, `complexity`) ใช้ `select('*')` จากตาราง `menus` ถ้าคอลัมน์ไม่มีใน production จะได้ค่าว่าง ไม่ error
- **e-book:** ถ้า URL ของ e-book เปลี่ยน แก้ที่ `EBOOK_URL` ที่เดียว
- **ช่องวิดีโอ 3 คลอง** ยังว่างอยู่ รอลิงก์ YouTube จากทีมเนื้อหา

---

## 6. รายการ commit (อ่านทีละก้อนได้ในแท็บ Commits)

| commit | เรื่อง |
|---|---|
| `7bb269b` | ธีมแนว A (งาน redesign 2026-06-28): LandingPage, MapView, MenuDetailPopup, landing.css, API field ใหม่ |
| `d050d06` | ซ่อนที่อยู่ทั้งหมด · popup ไม่มีไอคอน + รูปครบ · วิดีโอหลัก YouTube · ส่วน E-book |
| `a8c6f37` | แก้หมุดแผนที่หายหลังสลับชั้น · ขยายวิดีโอหลักเต็มความกว้าง |
| `f1e3dd4` | ส่วนเรื่องราวแบบไม่มีกล่องรูป · การ์ด Signature กะทัดรัด |
| `4ca39a3` | ช่องวิดีโอ YouTube ต่อคลอง (แทนภาพ AI) · ตัดป้ายเหนือแผนที่ |
| `cae02b5` | ภาพ hero จากคลิปของโครงการ |
| (ล่าสุด) | เอกสารฉบับนี้ |

---

## 7. วิธีย้อนกลับ

- **ก่อน merge:** ไม่ต้องทำอะไร `main` และเว็บ production ไม่เปลี่ยน
- **หลัง merge แล้วต้องการถอนทั้งหมด:** กด **Revert** ที่หน้า PR (GitHub สร้าง PR ย้อนกลับให้) หรือ `git revert -m 1 <merge-commit>`
- **ถอนเฉพาะบางเรื่อง:** `git revert <commit>` ตามตารางหัวข้อ 6 (เช่นถ้าไม่เอาภาพ hero ใหม่ ให้ revert `cae02b5` อย่างเดียว)
