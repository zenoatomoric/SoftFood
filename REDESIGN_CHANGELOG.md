---
date: 2026-06-29
status: "ready-for-team"
version: v1.0.0
project: "2025_SoftPower_Food_CRU"
project_id: "FREE-SOFT-CRU"
author: "Codex"
domain: "Freelance"
onedrive_path: "OneDrive/05_Freelance/2025_SoftPower_Food_CRU_Active/SoftFood_v3_final_2026-06-28/"
---

# รายการแก้ไขสำหรับนำเข้าโค้ดหลัก - FREE-SOFT-CRU

> Path: `05_Freelance/2025_SoftPower_Food_CRU_Active/SoftFood_v3_final_2026-06-28/`
> Domain: Freelance | Project: FREE-SOFT-CRU | Purpose: รายการให้ทีมย้ายโค้ดเข้า main

**Soft Power อาหารไทยริมคลอง CRU - Public Page Redesign แนว A**

เอกสารนี้สรุปจาก status, AGENT_CHANNEL, HANDOFF และไฟล์ในสำเนา final ที่ส่งทีมแล้ว จุดประสงค์คือให้ทีมเอารายการนี้ไปเทียบและย้ายเข้าโค้ดหลักโดยไม่ต้องย้อนอ่านบทสนทนาเดิมทั้งหมด

## 1. ขอบเขตงาน
- ขอบเขตคือปรับหน้า public ของเว็บ Soft Power อาหารไทยริมคลองเท่านั้น
- ไม่แตะระบบหลังบ้าน, Supabase schema, auth, permission, dashboard workflow หรือ logic การบันทึกข้อมูล
- เวอร์ชันส่งทีมอยู่ที่ SoftFood_v3_final_2026-06-28 และเป็นสำเนา clean ที่ตัด node_modules, .next และไฟล์ชั่วคราวออกแล้ว
- ทีมควรย้ายเฉพาะไฟล์/ส่วนที่ระบุด้านล่างเข้าโค้ดหลัก แล้วทดสอบด้วย Supabase env จริง

## 2. ไฟล์หลักที่ต้องนำไปเทียบ/ย้าย
- app/components/LandingPage.tsx - โครงหน้า public, Story video, การตัด Impact, interface field ใหม่
- app/components/MapView.tsx - UI/UX แผนที่, style switcher, loading overlay, resize, listener fix
- app/components/MenuDetailPopup.tsx - popup รายละเอียดเมนู, media pair, field เพิ่ม, activePhoto reset
- app/api/public/menus/route.ts - ส่ง video_url, promo_video_url และ field รายละเอียดใหม่ให้หน้า public
- app/landing.css - theme แนว A, story-photo, partners grid, popup/map/section styling
- public/Bangken.png, public/ladpaw.png, public/pamepacha.png และโลโก้ภาคีใน public - asset ที่หน้า public ใช้แสดงจริง
- HANDOFF.md - ใช้เป็นคำอธิบายวิธีรัน/ทดสอบในสำเนาส่งทีม ไม่จำเป็นต้อง merge เข้า product

## 3. รายการแก้ไขหน้า LandingPage.tsx
- ปรับหน้า public ให้เป็นดีไซน์แนว A: พื้นหลังสว่างเกือบขาว, ทองเป็น accent, spacing โปร่งขึ้น, ลดความรู้สึกเป็น template/AI
- เพิ่ม field ใน MenuItem interface ให้รองรับ social_value, awards_references, consumption_freq, complexity, video_url และ promo_video_url
- เปลี่ยน Story 'วิถีริมคลอง' จาก diagram/ผังสายน้ำ เป็นรูปคลองจริงผ่าน story-photo โดยใช้ภาพ fallback เช่น /Bangken.png
- เพิ่มระบบเลือกเมนูที่มีวิดีโอแนะนำ แล้วสุ่มเล่นวิดีโอใน Story section
- เพิ่ม state storyVidIdx และ storyMuted เพื่อควบคุมวิดีโอ/เสียงใน Story
- ตั้ง STORY_VIDEO_MS = 12000 เพื่อสุ่มเปลี่ยนคลิปทุก 12 วินาที โดยพยายามไม่สุ่มซ้ำตัวเดิมติดกัน
- ตั้ง video เป็น autoPlay, muted, playsInline, loop และมี poster จาก thumbnail เพื่อให้ browser autoplay ได้
- เพิ่มปุ่ม mute/unmute สำหรับวิดีโอ Story เพราะ autoplay ต้องเริ่มแบบ muted ตามข้อจำกัด browser
- เพิ่ม fallback เมื่อไม่มีข้อมูลวิดีโอหรือไม่มี Supabase env ให้แสดงรูปคลองแทน เพื่อไม่ให้ section ว่าง
- ตัด section Impact ออก เพราะตัวเลข/สถิติซ้ำกับ Story หลายจุดและทำให้หน้าเหมือน AI filler
- แก้ type error เดิมจาก branch theme === 'dk' ที่ไม่เกิดจริงในแนว A ให้เหลือค่าที่ใช้งานจริง
- ทำให้ filter เริ่มที่ 'ทั้งหมด' เพื่อลดปัญหาเปิดหน้าแล้วเจอข้อความไม่พบรายการเพราะ Signature = 0
- ปรับเนื้อหาให้แสดงทันที ไม่พึ่ง reveal animation จนเกิดพื้นที่ว่างยาวตอนโหลดหรือกระโดด anchor
- เพิ่ม/คง aria-label ในปุ่มสำคัญเพื่อแก้ P1 accessibility ของหน้า public

## 4. รายการแก้ไข MapView.tsx
- เพิ่มตัวเลือกชั้นแผนที่ 3 แบบ: สว่าง, มินิมอล/positron, ดาวเทียม/Esri
- ใช้ map.setStyle() เมื่อผู้ใช้เปลี่ยนชั้นแผนที่ และ re-add layers/markers หลัง styledata
- เพิ่ม guard isStyleLoaded() และ didMountStyle ref เพื่อลดการ setStyle ซ้ำตอน mount
- ย้าย listener click, mouseenter, mouseleave ออกจาก addLayers() ไป register ครั้งเดียวใน init effect เพื่อกัน listener สะสมเมื่อสลับ style
- เพิ่ม cooperativeGestures: true เพื่อลดปัญหาซูมแผนที่ชนกับการเลื่อนหน้าบน touch device
- เพิ่มปุ่ม zoom +/- ขนาดใหญ่ขึ้นเพื่อให้ใช้งานง่ายบนมือถือ
- เพิ่ม state mapLoaded และ loading overlay 'กำลังโหลดแผนที่...' เพื่อลดภาพจอว่างระหว่าง map init
- เรียก map.resize() หลัง map load เพื่อกัน canvas เพี้ยนเมื่อแผนที่อยู่ใน section ที่มี animation/layout transition
- ลดความมนของกรอบแผนที่เหลือประมาณ 10px ตาม mockup แนว A
- ยังคง logic เดิมของหมุด สีคลอง popup legend และไม่แสดงตัวเลขจำนวนบนหมุดตาม scope เดิม
- ยังไม่เปลี่ยน default basemap จาก bright เป็น positron เพราะ Athen ขอพักไว้รอทดสอบจริง

## 5. รายการแก้ไข MenuDetailPopup.tsx
- ปรับ popup ให้กว้างขึ้น อ่านง่ายขึ้น และวาง header/ชื่อเมนูชัดขึ้น
- ย้าย media รูป + วิดีโอขึ้นด้านบนสุดของ popup เป็นคู่เด่น ไม่ซ่อนไว้ด้านล่าง
- เพิ่ม import/useEffect และ reset activePhoto เป็น 0 เมื่อเปลี่ยนเมนูด้วย menu?.menu_id เพื่อกัน popup reuse แล้วรูปค้างจากเมนูก่อนหน้า
- เพิ่ม field optional ใน interface/render: social_value, awards_references, consumption_freq, complexity
- normalize ค่า string/array สำหรับ tag หรือ field ที่ข้อมูลเก่าอาจมีรูปแบบต่างกัน เพื่อไม่ให้ popup ล้ม
- เปลี่ยนวัตถุดิบเป็นตารางตาม mockup เพื่ออ่านและเทียบง่ายขึ้น
- เพิ่ม meta grid เช่น ผู้ให้ข้อมูล, ที่อยู่/ชุมชน, ปริมาณ, รสชาติ, วิธีปรุง และการสืบทอด
- เพิ่มส่วนประวัติ, เคล็ดลับ, วิธีทำเป็น steps, โภชนาการ, คุณค่าทางสังคม-วัฒนธรรม, รางวัล/อ้างอิง, tags และ gallery
- ปรับ typography body ประมาณ 16-16.5px และ line-height สูงขึ้นเพื่อให้อ่านง่ายขึ้น
- ไม่แตะ data hook, Supabase, fetch logic หรือ video gate ฝั่ง MenuDetailClient.tsx

## 6. รายการแก้ไข app/api/public/menus/route.ts
- ส่ง video_url และ promo_video_url ออกมากับ public menu API เพื่อให้ LandingPage ใช้วิดีโอใน Story ได้
- ส่ง field รายละเอียดเพิ่ม เช่น social_value, awards_references, consumption_freq และ complexity ให้ popup แสดงข้อมูลครบ
- การเปลี่ยนแปลงเป็นการเพิ่ม output field สำหรับหน้า public ไม่ใช่การเปลี่ยน schema หรือ logic การบันทึกข้อมูล
- ทีม main ต้องตรวจว่าชื่อ column/field ใน production Supabase ตรงกับที่ route ใช้อยู่

## 7. รายการแก้ไข app/landing.css
- เพิ่ม/ปรับ theme แนว A ใน block VARIANT A OVERRIDES: สว่างขึ้น, ทองน้อยลง, พื้นหลัง --cr ปรับเป็น #fcfcfa
- เพิ่ม style สำหรับ story-photo: รูปคลองจริง aspect 4/5 พร้อม caption overlay และ gradient ด้านล่าง
- ลบ/เลิกใช้ cdiag diagram ใน DOM แล้วแทนด้วยรูปจริง แม้ CSS cdiag บางส่วนอาจยังเหลือเป็น dead style ไม่กระทบหน้า
- ปรับ partners section ให้กระชับ: p-grid เป็น 5 คอลัมน์ 2 แถว, max-width แคบลง, gap เล็กลง
- ปรับ pcard ให้เตี้ยลง padding ลดลง โลโก้เล็กลง และชื่อขนาดประมาณ 11px เพื่อให้ภาคีไม่เด่นเกินเนื้อหา
- ปรับสีพื้นทั้งหน้าให้เหลืองจางลง เหลือ warm tint เล็กน้อย
- เพิ่ม/ปรับ style สำหรับ popup, Story video mute button, map controls และ responsive behavior ตามแนว A

## 8. Asset ที่เกี่ยวข้อง
- ใช้ภาพคลองจริงใน public เช่น Bangken.png, ladpaw.png, pamepacha.png เพื่อแทน graphic diagram ที่ดูประดิษฐ์เกินไป
- ใช้โลโก้ภาคีใน public สำหรับ section ภาคีเครือข่าย เช่น CRU/คณะ/หน่วยงานวัฒนธรรม/อบจ./สำนักงานเขต/วัดทางหลวง
- ถ้า merge เฉพาะ code แต่ไม่ย้าย asset หน้า public จะมีรูป/โลโก้หายหรือ fallback ไม่ครบ

## 9. สิ่งที่ห้ามแตะตอน merge
- ห้ามแก้ Supabase schema จากงานชุดนี้
- ห้ามเปลี่ยน auth/session/permission/dashboard logic
- ห้ามแก้ workflow ฟอร์มบันทึกข้อมูลหรือ video gate ใน MenuDetailClient.tsx เว้นแต่ทีมตรวจพบ bug แยกต่างหาก
- ห้าม merge node_modules, .next, tsbuildinfo, ไฟล์ diagnostic/tmp/console.log
- อย่าเปลี่ยน default basemap เป็น positron จนกว่าจะทดสอบ production + Supabase env และ Athen ตัดสินใจ

## 10. วิธีทดสอบหลังย้ายเข้า main
- ติดตั้ง dependency ด้วย npm install ใน repo main
- เตรียม .env.local ของ Supabase ให้ครบก่อนดูข้อมูลจริง
- รัน npx tsc --noEmit ต้องผ่าน
- รัน npm run build ต้องผ่าน
- รัน npm start แล้วเปิดหน้า public ตรวจ performance/ภาพจริงแบบ production ไม่ใช้ dev mode เป็นเกณฑ์ความเร็ว
- ตรวจ Story video: มีข้อมูลวิดีโอแล้วสุ่มเล่น, เปลี่ยนคลิปทุก 12 วินาที, mute/unmute ได้, ไม่มีข้อมูลแล้ว fallback เป็นรูปคลอง
- ตรวจ popup: เปลี่ยนเมนูแล้วรูป active กลับรูปแรก, รูป+วิดีโออยู่ด้านบน, field ใหม่แสดงเมื่อมีข้อมูลและไม่ล้มเมื่อไม่มี
- ตรวจแผนที่: โหลดแล้วไม่จอขาว, สลับ style ได้, marker/popup ยังอยู่, listener ไม่ทำงานซ้ำหลังสลับ style หลายครั้ง
- ตรวจ responsive มือถือ: menu/filter/map controls/touch zoom ใช้งานได้และไม่มีข้อความล้น
- รัน npm run lint ได้ แต่คาดว่าอาจยังมี lint debt เดิมของโปรเจกต์; ไม่ควรนับเป็น regression ถ้า build/typecheck ผ่านและ error ตรงกับของเดิม

## 11. สถานะ verify ที่มีอยู่แล้ว
- ในสำเนา v2 ที่เป็นต้นทางแก้ไข เคยรัน npx tsc --noEmit ผ่าน
- เคยรัน npm run build ผ่าน และ build ได้ 28 routes
- สำเนา v3 final เป็น clean copy ที่ตัด node_modules/.next ออก แต่ source สำคัญ byte-identical กับชุดที่ verify แล้วตามบันทึก status
- lint มี error/warning เดิมของ codebase เช่น scripts require, any ใน utils/types, unescaped quote, img ไม่ใช่ regression จากงาน redesign และ Next 16 ไม่ block build จาก lint ชุดนี้

## 12. งานที่พักไว้
- ยังไม่เปลี่ยน default basemap จาก bright เป็น positron/minimal
- ยังไม่ได้ฟันธงเรื่องความเร็วแผนที่จนกว่าจะทดสอบ production + Supabase env จริง
- หากทีมต้องการความเร็ว/หน้าสะอาดขึ้น อาจพิจารณาให้ positron เป็น default ในรอบถัดไป
