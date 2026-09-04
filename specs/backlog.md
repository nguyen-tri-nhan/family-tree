# Backlog — Cây Gia Phả

Consolidated backlog. Chi tiết từng mục xem ở file spec tương ứng.

Cập nhật: 2026-06-23

---

## Trạng thái

| ID | Tên | Spec | Độ ưu tiên | Trạng thái |
|----|-----|------|-----------|------------|
| **Kinship** | | | | |
| K1 | Nội/ngoại + BFS ancestry (§2a) | enhancement-v2.md | — | ✅ Done |
| K2 | Cậu/Dì phía mẹ (§2b) | enhancement-v2.md | — | ✅ Done |
| K3 | Vợ/chồng anh em họ (§2d Case1) | enhancement-v2.md | — | ✅ Done |
| K4 | Họ hàng xa chi tiết (§2d Case2) | enhancement-v2.md | — | ✅ Done |
| K5 | Ông Cố / Bà Cố nội/ngoại | enhancement-v3.md §3 | — | ✅ Done |
| K6 | Custom xưng hô — per-pair + clan-wide rules | enhancement-v3.md §1 | 🟡 Vừa | Planned |
| **UX** | | | | |
| U1 | §7a Highlight path khi collapse (auto-expand) | enhancement-v3.md §7 | 🔴 Cao | ✅ Done |
| U2 | §7b Chọn node collapse qua SearchBar | enhancement-v3.md §7 | 🔴 Cao | ✅ Done |
| U3 | UI warning 200 người (badge + disable) | enhancement-v3.md §8 | 🟡 Vừa | ✅ Done |
| U4 | Recent files trên web (File System Access API) | enhancement-v3.md §6 | 🟡 Vừa | Planned |
| **Data / Tree** | | | | |
| D1 | Tag vai trò: Thủy Tổ, Khai Tổ, Trưởng Bối, Trưởng Họ, Trưởng Tộc | enhancement-v3.md §2 | 🟢 Thấp | Planned |
| D2 | Ảnh cá nhân (remote URL — user tự host) | enhancement-v3.md §5 | 🟢 Thấp | Planned |
| D3 | Multi-root / nhiều dòng họ | enhancement-v3.md §9 | 🟢 Thấp | Deferred |
| D4 | Đa hôn nhân (đa thê + ly hôn/tái hôn) | multi-marriage.md | 🟡 Vừa | ✅ Done (core) |
| **App / Legal** | | | | |
| A1 | Điều khoản sử dụng (modal + /#/terms) | terms.md | 🔴 Cao | ✅ Done |
| A2 | Quiz trắc nghiệm xưng hô | quiz.md | — | ✅ Done |
| A3 | About page + hash routing | enhancement-v3.md §4 | — | ✅ Done |
| **Growth / Onboarding** | | | | |
| G1 | Example gallery — bundle 2-3 sample .ftree để onboard (gia đình cơ bản + đa hôn nhân + quiz-ready) | consideration.md §3 | 🔴 Cao | Planned |
| G2 | Quiz Share Card — generate ảnh PNG điểm số để share lên Zalo/Facebook | consideration.md §4 | 🔴 Cao | Planned |
| G3 | OG tags / link preview — paste share URL vào Zalo hiện thumbnail + tên dòng họ | consideration.md §4 | 🟡 Vừa | Planned |
| G4 | Watermark nhỏ trên PNG export — "caygiaphaapp.com" ở góc | consideration.md §4 | 🟡 Vừa | Planned |
| G5 | Mobile responsive — audit + fix D3 tree trên điện thoại (blocks toàn bộ viral loop) | consideration.md | 🔴 Cao | Planned |
| **Retention** | | | | |
| R1 | Export .ics ngày giỗ/sinh nhật → Google Calendar / Apple Calendar | consideration.md §4 | 🔴 Cao | Planned |
| R2 | "Nhân vật hôm nay" — banner khi mở app có ngày sinh/mất hôm nay trong cây | consideration.md §4 | 🟡 Vừa | Planned |
| R3 | Milestone notification — "đời thứ 5!", "người thứ 100!" in-app | consideration.md §4 | 🟢 Thấp | Planned |
| R4 | Gia phả digest — auto-generate PDF tổng kết định kỳ | consideration.md §4 | 🟢 Thấp | Planned |
| **Sharing / Collaboration** | | | | |
| S1 | "Đề xuất bổ sung" form trong shared URL view — viewer gửi thông tin, keeper merge | consideration.md §2 | 🟡 Vừa | Planned |
| S2 | Export single-file HTML — bản read-only app đầy đủ để gửi qua Zalo/email | consideration.md §2 | 🟡 Vừa | Planned |
| **☁ Cloud / Phase 2** | | | | |
| C1 | Ảnh cloud — upload + lưu trữ server | enhancement-v3.md §5 (V4+) | ⚪ Cloud | Deferred |
| C2 | Cross-clan link giữa hai file .ftree | enhancement-v3.md §10 | ⚪ Cloud | Deferred |
| C3 | Optional cloud sync (E2E encrypted) + invite link cho gia đình | consideration.md §2 | ⚪ Cloud | Deferred |

---

## Thứ tự làm gợi ý

### Sprint gần nhất — Unlock viral loop

1. **G5** — Mobile responsive: fix trước, unblocks mọi share trên Zalo/Facebook
2. **G1** — Example gallery: xóa blank state, người mới thấy value ngay
3. **G2** — Quiz Share Card: tạo viral moment, effort thấp nhất so với impact
4. **R1** — Export .ics ngày giỗ: retention trigger mạnh nhất, không cần server
5. **G4** — Watermark PNG export: 30 phút, marketing miễn phí mỗi lần share ảnh

### Medium-term — Retention + gap với Giapha-OS

6. **R2** — "Nhân vật hôm nay": emotional, low cost
7. **G3** — OG tags / link preview: cần server-side render hoặc meta tags tĩnh
8. **D2** — Ảnh remote URL (avatar): emotional value, Giapha-OS đã có
9. **S1** — Suggestion form: giảm single-holder problem
10. **K6** — Custom xưng hô
11. **U4** — Recent files web
12. **D1** — Tag Thủy Tổ

### Long-term / Deferred

13. **S2** — Single-file HTML export
14. **R3** — Milestone notification
15. **R4** — Gia phả digest PDF
16. **D3** — Multi-root

### Cloud / Phase 2 (cần backend)

17. **C3** — Optional cloud sync + collaboration (E2E encrypted — không clone Supabase)
18. **C1** — Ảnh cloud upload
19. **C2** — Cross-clan link

---

## Ghi chú

- **D4** core đã có trong app — thiếu UX demo/example → **G1** (example gallery) sẽ giải quyết
- **G5** (mobile) là prerequisite: mọi link share đều mở trên điện thoại, nếu UI vỡ thì toàn bộ viral loop chết
- **G2** (quiz share card) không cần server — generate PNG client-side bằng `html-to-image` hoặc Canvas API
- **R1** (.ics export) không cần server — generate file phía client, user import vào Calendar
- **S1** (suggestion form) không cần server — suggestion data encode vào URL hoặc download file JSON
- **C3** (cloud sync) chỉ nên build khi đã có traction đủ lớn — tránh build infrastructure trước khi có user
- **A1** đã hoàn thành trước khi share app cho người dùng ngoài ✅
