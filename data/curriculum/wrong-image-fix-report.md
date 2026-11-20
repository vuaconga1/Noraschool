# Báo cáo sửa ảnh sai / fallback 📝

> Cập nhật: 2026-11-20

## Nguyên nhân `skin` hiện icon bút chì giấy

UI (`WordVisual`) load `/assets/vocab/approved/{stem}.png`.  
Nếu file **không tồn tại** → `onError` → fallback emoji **📝** (trông giống viết/giấy).

`skin` không có `approved/skin.png` nên bị fallback — **không phải** DB map sang ảnh bút chì.

## Các từ bị lỗi tương tự (đã thiếu `approved/*.png` → cũng hiện 📝)

Trước khi sửa có **57 từ** thiếu file trong `approved/` (cùng lớp lỗi với `skin`).

### Đã copy từ `anh_wewin` → `approved/` (31)

bat, bell-pepper, blanket, can, drive, fall, glass, green-onion, jingle-bell, kangaroo, knees, koala, lobster, mom, neck, police, recycle, rocket, root, roots, sea-horse, shark, shoulders, squid, stem, toes, trash, tulip, water-buffalo, whale, zodiac-rat

### Đã sinh mới + xóa phông → `approved/` (26)

skin, bones, brain, heart, lungs, stomach, beetroot, corn, eggplant, garlic, ginger, eat, drink, santa, snowball, america, canada, china, england, france, india, italy, japan, korea, russia, vietnam

### Bỏ qua alt hỏng

- `anh_wewin/curriculum/from-anschool/skin.jpg` — nội dung sai (không dùng)

## Kết quả sau sửa

| Chỉ số | Giá trị |
| --- | ---: |
| Curriculum unique words | 270 |
| Thiếu `approved/{stem}.png` | **0** |
| DB `imagePath` cập nhật | 57 |

Hard refresh trang game (Ctrl+F5) để thấy ảnh mới.
