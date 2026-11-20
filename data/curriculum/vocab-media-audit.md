# Báo cáo audit từ vựng (DB ↔ media)

> Tạo lúc: 2026-11-20 12:04:08 (UTC)
> Nguồn: Neon `vocab_items` + `vocab_assets`
> Asset dirs: `public/`, `frontend/public/`, `anh_wewin/`, `audio_wewin/`

## Tổng quan

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng vocab_items | 270 |
| File ảnh trên disk (index) | 2098 |
| File audio trên disk (index) | 1283 |
| OK (có ảnh + audio, file tồn tại, mapping khớp) | 211 |
| Thiếu ảnh (path null/rỗng) | 0 |
| Thiếu audio (path null/rỗng) | 59 |
| Thiếu cả ảnh + audio | 0 |
| Chỉ thiếu ảnh | 0 |
| Chỉ thiếu audio | 59 |
| Ảnh trong DB nhưng file không tồn tại | 0 |
| Audio trong DB nhưng file không tồn tại | 0 |
| Mapping ảnh sai (stem file ≠ từ) | 0 |
| Thiếu ảnh nhưng disk có file cùng tên | 0 |
| Thiếu audio nhưng disk có file cùng tên | 0 |

## 1. Mapping ảnh sai (stem file ≠ từ vựng)

_Không có._

## 2. Ảnh trong DB nhưng file không tồn tại

_Không có._

## 3. Audio trong DB nhưng file không tồn tại

_Không có._

## 4. Thiếu cả ảnh + audio

_Không có._

## 5. Chỉ thiếu ảnh

_Không có._

## 6. Chỉ thiếu audio

**Tổng: 59**

| # | Từ | Normalized | Disk candidate | Chủ đề / tuần |
| --- | --- | --- | --- | --- |
| 1 | air | air | — | Environment Protection W3; Environment Protection W4 |
| 2 | angle | angle | — | Self-discovery W4 |
| 3 | ao dai | ao dai | — | Our country - The World W1; Our country - The World W2 |
| 4 | bamboo | bamboo | — | Our country - The World W1; Our country - The World W2 |
| 5 | barbecue | barbecue | — | Our country - The World W3; Our country - The World W4 |
| 6 | be quiet | be quiet | — | New Schoolyear W1 |
| 7 | ben thanh market | ben thanh market | — | Our country - The World W1; Our country - The World W2 |
| 8 | black cat | black cat | — | Self-discovery W4 |
| 9 | boomerang | boomerang | — | Our country - The World W3; Our country - The World W4 |
| 10 | city | city | — | Around the world W3; Around the world W4 |
| 11 | conical hat | conical hat | — | Our country - The World W1; Our country - The World W2 |
| 12 | cowboy | cowboy | — | Self-discovery W4 |
| 13 | custard apple | custard apple | — | Traditional New Year W1; Traditional New Year W2 |
| 14 | daughter | daughter | — | Family W3; Family W4 |
| 15 | driver | driver | — | Career W1; Career W2 |
| 16 | fist bump | fist bump | — | New Schoolyear W1 |
| 17 | go straight | go straight | — | Transportation W3; Transportation W4 |
| 18 | granddaughter | granddaughter | — | Family W3; Family W4 |
| 19 | grandson | grandson | — | Family W3; Family W4 |
| 20 | ha noi | ha noi | — | Our country - The World W1; Our country - The World W2 |
| 21 | hello | hello | — | New Schoolyear W1 |
| 22 | helmet | helmet | — | Transportation W3; Transportation W4 |
| 23 | high five | high five | — | New Schoolyear W1 |
| 24 | husband | husband | — | Family W3; Family W4 |
| 25 | listen | listen | — | Transportation W3; Transportation W4 |
| 26 | listen to your teacher | listen to your teacher | — | New Schoolyear W1 |
| 27 | look | look | — | Transportation W3; Transportation W4 |
| 28 | look at the teacher | look at the teacher | — | New Schoolyear W1 |
| 29 | meat pie | meat pie | — | Our country - The World W3; Our country - The World W4 |
| 30 | mid autumn day | mid autumn day | — | New Schoolyear W4 |
| 31 | no fighting | no fighting | — | New Schoolyear W1 |
| 32 | no running | no running | — | New Schoolyear W1 |
| 33 | palace | palace | — | Around the world W3; Around the world W4 |
| 34 | parents | parents | — | Family W3; Family W4 |
| 35 | pho | pho | — | Our country - The World W1; Our country - The World W2 |
| 36 | pirate | pirate | — | Self-discovery W4 |
| 37 | pumkin | pumkin | — | Self-discovery W4 |
| 38 | pyramid | pyramid | — | Around the world W3; Around the world W4 |
| 39 | raise your hand | raise your hand | — | New Schoolyear W1 |
| 40 | rocket | rocket | — | Transportation W2; Transportation W1 |
| 41 | seed | seed | — | Environment Protection W3; Environment Protection W4 |
| 42 | sidewalk | sidewalk | — | Transportation W3; Transportation W4 |
| 43 | sit nicely | sit nicely | — | New Schoolyear W1 |
| 44 | sled | sled | — | Winter - Christmas W2 |
| 45 | snow | snow | — | Winter - Christmas W2 |
| 46 | snowflake | snowflake | — | Winter - Christmas W2 |
| 47 | son | son | — | Family W3; Family W4 |
| 48 | statue | statue | — | Around the world W3; Around the world W4 |
| 49 | stop | stop | — | Transportation W3; Transportation W4 |
| 50 | superhero | superhero | — | Self-discovery W4 |
| 51 | sydney opera house | sydney opera house | — | Our country - The World W3; Our country - The World W4 |
| 52 | teeth | teeth | — | Self-discovery W3 |
| 53 | temple | temple | — | Around the world W3; Around the world W4 |
| 54 | tet holiday papaya | tet holiday papaya | — | Traditional New Year W2 |
| 55 | turn left | turn left | — | Transportation W3; Transportation W4 |
| 56 | turn right | turn right | — | Transportation W3; Transportation W4 |
| 57 | vegemite | vegemite | — | Our country - The World W3; Our country - The World W4 |
| 58 | wait | wait | — | Transportation W3; Transportation W4 |
| 59 | wife | wife | — | Family W3; Family W4 |

## 7. Có thể rematch ảnh (DB thiếu path nhưng disk có file)

_Không có._

## 8. Có thể rematch audio (DB thiếu path nhưng disk có file)

_Không có._

## Ghi chú phương pháp

- **Thiếu ảnh/audio**: `vocab_assets.image_path` / `audio_path` null hoặc rỗng.
- **File không tồn tại**: path trong DB có giá trị nhưng không tìm thấy dưới `public/`, `frontend/public/`, hoặc path relative repo.
- **Mapping sai**: basename (stem) của file ảnh sau normalize ≠ `normalized` của từ (và không nằm trong alias đã biết).
- Matching ảnh/audio trên disk theo stem = `normalizeWord(basename)` giống `import:curriculum`.
