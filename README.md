# Cây Gia Phả

Phần mềm quản lý gia phả tiếng Việt — chạy trên trình duyệt và desktop (Electron). Dữ liệu lưu dưới dạng file `.ftree` (base64 JSON), hoàn toàn local-first, không cần tài khoản.

## Cấu trúc

```
family-tree/
├── Makefile
├── frontend/                  # Monorepo (npm workspaces + Lerna)
│   ├── tree-lib/              # @family-tree/tree-lib — shared logic & components
│   │   └── src/
│   │       ├── types.ts       # Data model: Person, FamilyUnit, Branch, Clan
│   │       ├── document.ts    # Encode/decode .ftree, emptyDocument
│   │       ├── storage.ts     # IStorageAdapter interface + React context
│   │       └── FamilyTree.tsx # D3 tree visualization component
│   ├── web-app/               # @family-tree/web-app — Vite React, deploy web
│   │   └── src/
│   │       ├── adapters/WebAdapter.ts
│   │       └── App.tsx
│   └── electron-app/          # @family-tree/electron-app — desktop (electron-vite)
│       └── src/
│           ├── main/index.ts          # IPC: file:open/save/new, prefs
│           ├── preload/index.ts       # contextBridge → window.api
│           └── renderer/src/
│               ├── adapters/ElectronAdapter.ts
│               └── App.tsx
└── specs/                     # Tài liệu thiết kế
```

## Khởi động nhanh

```bash
# Cài dependencies
make install

# Chạy web app (localhost:5173)
make dev-web

# Chạy Electron desktop
make dev-electron
```

## Build

```bash
make build            # Build tất cả (tree-lib → web + electron)
make build-lib        # Chỉ tree-lib
make build-web        # tree-lib + web-app
make build-electron   # tree-lib + electron-app
```

## Kiểm tra kiểu (TypeScript)

```bash
make typecheck        # Tất cả
make typecheck-web
make typecheck-electron
```

## Định dạng file `.ftree`

File `.ftree` là `base64(JSON.stringify(FtreeDocument))`, hỗ trợ tiếng Việt UTF-8.

```
base64 → JSON → { version, clan, branches, persons, families }
```

Web: lưu bằng cách tải file xuống. Electron: ghi thẳng vào file, atomic write (`.tmp` → rename).

## Giới hạn v1

- Tối đa 200 người (freemium)
- Chưa có ảnh (sẽ thêm ở v2 qua cloud URL)
- Hỗ trợ ngày âm lịch và dương lịch (thư viện `lunar-date-vn`)

## Specs

Xem thư mục [`specs/`](specs/) để biết chi tiết thiết kế:

| File | Nội dung |
|------|----------|
| [plan.md](specs/plan.md) | Kế hoạch tổng thể và tech stack |
| [data.md](specs/data.md) | Data model chi tiết |
| [design.md](specs/design.md) | IStorageAdapter pattern |
| [impl-v1.md](specs/impl-v1.md) | Implementation plan v1 + schema .ftree |
| [render.md](specs/render.md) | Chiến lược render theo số node |
