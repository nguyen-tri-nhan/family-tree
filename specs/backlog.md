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
| D2 | Ảnh cá nhân (remote URL) | enhancement-v3.md §5 | 🟢 Thấp | Planned |
| D3 | Multi-root / nhiều dòng họ | enhancement-v3.md §9 | 🟢 Thấp | Deferred |
| D4 | Cross-clan link | enhancement-v3.md §10 | ⚪ Phase 2 | Deferred |
| **App / Legal** | | | | |
| A1 | Điều khoản sử dụng (modal + /#/terms) | terms.md | 🔴 Cao | Planned |
| A2 | Quiz trắc nghiệm xưng hô | quiz.md | 🟡 Vừa | Planned |
| A3 | About page + hash routing | enhancement-v3.md §4 | — | ✅ Done |

---

## Thứ tự làm gợi ý

### Sprint gần nhất
1. **U1 + U2** — collapsed node UX, bug rõ ràng, fix nhanh
2. **A1** — điều khoản, cần trước khi release rộng
3. **U3** — warning 200 người, nhỏ, logic rõ

### Sau khi K1 (nội/ngoại) xong
4. **K2** — Cậu/Dì, phụ thuộc K1
5. **K5** — Ông Cố/Bà Cố, phụ thuộc K1
6. **K3** — vợ/chồng anh em họ, độc lập nhưng tốt nhất sau K1

### Medium-term
7. **K6** — Custom xưng hô, cần data model rõ trước
8. **U4** — Recent files web
9. **A2** — Quiz, fun feature, sau khi kinship ổn định
10. **D1** — Tag Thủy Tổ, nhỏ

### Long-term / Deferred
11. **K4** — họ hàng xa
12. **D2** — Ảnh (cần quyết định storage)
13. **D3** — Multi-root (lớn)
14. **D4** — Cross-clan (Phase 2 cloud)

---

## Ghi chú

- **K1 là blocker** cho K2, K5 — ưu tiên cao nhất trong nhóm Kinship
- **A1** nên hoàn thành trước khi share app cho người dùng ngoài
- **U1/U2** là cùng một vấn đề (collapse) nhưng fix độc lập được
