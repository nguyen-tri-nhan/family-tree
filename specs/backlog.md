# Backlog — Cây Gia Phả

Consolidated backlog. Chi tiết từng mục xem ở file spec tương ứng.

Cập nhật: 2026-06-10

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
| U1 | §7a Highlight path khi collapse (auto-expand) | enhancement-v3.md §7 | 🔴 Cao | Planned |
| U2 | §7b Chọn node collapse qua SearchBar | enhancement-v3.md §7 | 🔴 Cao | Planned |
| U3 | UI warning 200 người (badge + disable) | enhancement-v3.md §8 | 🟡 Vừa | Planned |
| U4 | Recent files trên web (File System Access API) | enhancement-v3.md §6 | 🟡 Vừa | Planned |
| **Data / Tree** | | | | |
| D1 | Tag vai trò: Thủy Tổ, Khai Tổ, Trưởng Bối, Trưởng Họ, Trưởng Tộc | enhancement-v3.md §2 | 🟢 Thấp | Planned |
| D2 | Ảnh cá nhân (remote URL — user tự host) | enhancement-v3.md §5 | 🟢 Thấp | Planned |
| D3 | Multi-root / nhiều dòng họ | enhancement-v3.md §9 | 🟢 Thấp | Deferred |
| D4 | Đa hôn nhân (đa thê + ly hôn/tái hôn) | multi-marriage.md | 🟡 Vừa | Planned |
| **App / Legal** | | | | |
| A1 | Điều khoản sử dụng (modal + /#/terms) | terms.md | 🔴 Cao | Planned |
| A2 | Quiz trắc nghiệm xưng hô | quiz.md | 🟡 Vừa | Planned |
| A3 | About page + hash routing | enhancement-v3.md §4 | — | ✅ Done |
| **☁ Cloud / Phase 2** | | | | |
| C1 | Ảnh cloud — upload + lưu trữ server | enhancement-v3.md §5 (V4+) | ⚪ Cloud | Deferred |
| C2 | Cross-clan link giữa hai file .ftree | enhancement-v3.md §10 | ⚪ Cloud | Deferred |

---

## Thứ tự làm gợi ý

### Sprint gần nhất
1. **U1 + U2** — collapsed node UX, bug rõ ràng, fix nhanh
2. **A1** — điều khoản, cần trước khi release rộng
3. **U3** — warning 200 người, nhỏ, logic rõ

### Medium-term
4. **K6** — Custom xưng hô, cần data model rõ trước
5. **U4** — Recent files web
6. **D1** — Tag Thủy Tổ, nhỏ
7. **D2** — Ảnh remote URL
8. **A2** — Quiz, sau khi kinship ổn định

### Long-term / Deferred
9. **D3** — Multi-root (lớn, cần UX research)

### Cloud / Phase 2 (cần backend)
10. **C1** — Ảnh cloud upload
11. **C2** — Cross-clan link

---

## Ghi chú

- **A1** nên hoàn thành trước khi share app cho người dùng ngoài
- **U1/U2** là cùng một vấn đề (collapse) nhưng fix độc lập được
- **D2** (Ảnh remote URL) không cần cloud — user paste link từ Google Drive / GitHub / Imgur
- **C1/C2** cần cloud infrastructure riêng, không trong scope bản local hiện tại
