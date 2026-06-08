# Demo — Cây Gia Phả 3 Thế Hệ

```mermaid
flowchart TD
    GEN1["Nguyễn Văn An  ×  Trần Thị Bình\n♂ 1930–2005      ♀ 1933–2018"]

    GEN1 --> P1["Nguyễn Văn Cường  ×  Lê Thị Dung\n♂ sinh 1955          ♀ sinh 1959"]
    GEN1 --> P2["Nguyễn Văn Dũng  ×  Phạm Thị Hoa\n♂ sinh 1958         ♀ sinh 1961"]
    GEN1 --> LAN["Nguyễn Thị Lan\n♀ sinh 1962"]

    P1 --> KHOA["Nguyễn Minh Khoa\n♂ sinh 1980"]
    P1 --> MAI["Nguyễn Thị Mai\n♀ sinh 1983"]

    P2 --> TUAN["Nguyễn Anh Tuấn\n♂ sinh 1985"]
    P2 --> HUONG["Nguyễn Thu Hương\n♀ sinh 1988"]

    classDef couple  fill:#fefce8,stroke:#ca8a04,color:#713f12
    classDef male    fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    classDef female  fill:#fce7f3,stroke:#ec4899,color:#831843

    class GEN1,P1,P2 couple
    class KHOA,TUAN male
    class LAN,MAI,HUONG female
```

## Hướng phát triển thực tế

Mermaid không vẽ được đúng kiểu T-connection như cây gia phả truyền thống.
Khi vào phần UI thật, nên dùng thư viện chuyên biệt:

| Thư viện | Ưu điểm |
|----------|---------|
| [`relatives-tree`](https://github.com/nicktindall/relatives-tree) | Layout chuẩn phả hệ, hỗ trợ nhiều quan hệ |
| [`family-chart`](https://github.com/nicktindall/relatives-tree) | Render SVG đẹp, interactive |
| D3.js `tree` layout | Tùy biến cao, cần code nhiều hơn |
