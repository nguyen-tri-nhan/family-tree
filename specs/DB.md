# Database Design — Cây Gia Phả

## Chọn loại DB

| | PostgreSQL | MongoDB | Neo4j |
|---|---|---|---|
| Quan hệ nhiều cấp | Recursive CTE | Khó | Native |
| ACID / toàn vẹn dữ liệu | ✓ | Hạn chế | ✓ |
| Dễ host (free tier) | Supabase / Neon | Atlas | Không |
| Phù hợp quy mô nhỏ | ✓ | ✓ | Overkill |

**Chọn PostgreSQL.** Graph DB (Neo4j) tự nhiên hơn cho traversal nhưng quá nặng cho ứng dụng cá nhân. PostgreSQL với Recursive CTE giải quyết đủ mọi query cần thiết, và dễ host miễn phí trên Supabase hoặc Neon.

---

## Schema

```sql
-- Người trong cây phả hệ
CREATE TABLE persons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  nickname     TEXT,                          -- tên gọi trong gia đình
  gender       TEXT CHECK (gender IN ('male', 'female')),

  -- Ngày sinh (partial: có thể chỉ có năm)
  birth_year   INTEGER,
  birth_month  INTEGER CHECK (birth_month BETWEEN 1 AND 12),
  birth_day    INTEGER CHECK (birth_day   BETWEEN 1 AND 31),
  birth_place  TEXT,

  -- Ngày mất (NULL nếu còn sống)
  death_year   INTEGER,
  death_month  INTEGER CHECK (death_month BETWEEN 1 AND 12),
  death_day    INTEGER CHECK (death_day   BETWEEN 1 AND 31),

  occupation   TEXT,
  bio          TEXT,
  photo_url    TEXT,                          -- URL đến object storage

  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Một cuộc hôn nhân (Family Unit)
CREATE TABLE families (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  husband_id     UUID REFERENCES persons(id) ON DELETE SET NULL,
  wife_id        UUID REFERENCES persons(id) ON DELETE SET NULL,
  marriage_year  INTEGER,

  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),

  -- Phải có ít nhất một bên
  CHECK (husband_id IS NOT NULL OR wife_id IS NOT NULL)
);

-- Con cái thuộc về cuộc hôn nhân nào
CREATE TABLE family_children (
  family_id   UUID REFERENCES families(id)  ON DELETE CASCADE,
  person_id   UUID REFERENCES persons(id)   ON DELETE CASCADE,
  PRIMARY KEY (family_id, person_id)
);
```

### Quan hệ

```
persons  ─┬─ families.husband_id
           └─ families.wife_id

families ─── family_children ─── persons
(cha mẹ)                         (con cái)
```

---

## Indexes

```sql
-- Tìm kiếm theo tên (ILIKE, tiếng Việt)
CREATE INDEX idx_persons_name ON persons USING gin(to_tsvector('simple', name));

-- Tra con cái của một gia đình
CREATE INDEX idx_family_children_family ON family_children(family_id);

-- Tra gia đình mà một người là con
CREATE INDEX idx_family_children_person ON family_children(person_id);

-- Tra gia đình mà một người là cha/mẹ
CREATE INDEX idx_families_husband ON families(husband_id);
CREATE INDEX idx_families_wife    ON families(wife_id);
```

---

## Các query thường dùng

### Cha mẹ của một người
```sql
SELECT p.*
FROM persons p
JOIN families f    ON p.id = f.husband_id OR p.id = f.wife_id
JOIN family_children fc ON fc.family_id = f.id
WHERE fc.person_id = $1;
```

### Con cái của một người
```sql
SELECT p.*
FROM persons p
JOIN family_children fc ON fc.person_id = p.id
JOIN families f         ON fc.family_id = f.id
WHERE f.husband_id = $1 OR f.wife_id = $1;
```

### Anh chị em ruột
```sql
SELECT p.*
FROM persons p
JOIN family_children fc1 ON fc1.person_id = p.id
WHERE fc1.family_id IN (
  SELECT family_id FROM family_children WHERE person_id = $1
)
AND p.id <> $1;
```

### Tất cả tổ tiên (recursive — đi ngược lên)
```sql
WITH RECURSIVE ancestors AS (
  -- base: cha mẹ trực tiếp
  SELECT p.id, p.name, 1 AS depth
  FROM persons p
  JOIN families f    ON p.id = f.husband_id OR p.id = f.wife_id
  JOIN family_children fc ON fc.family_id = f.id
  WHERE fc.person_id = $1

  UNION ALL

  -- đệ quy: cha mẹ của cha mẹ
  SELECT p.id, p.name, a.depth + 1
  FROM persons p
  JOIN families f    ON p.id = f.husband_id OR p.id = f.wife_id
  JOIN family_children fc ON fc.family_id = f.id
  JOIN ancestors a   ON fc.person_id = a.id
)
SELECT * FROM ancestors ORDER BY depth;
```

### Tất cả con cháu (recursive — đi xuống)
```sql
WITH RECURSIVE descendants AS (
  SELECT p.id, p.name, 1 AS depth
  FROM persons p
  JOIN family_children fc ON fc.person_id = p.id
  JOIN families f         ON fc.family_id = f.id
  WHERE f.husband_id = $1 OR f.wife_id = $1

  UNION ALL

  SELECT p.id, p.name, d.depth + 1
  FROM persons p
  JOIN family_children fc ON fc.person_id = p.id
  JOIN families f         ON fc.family_id = f.id
  JOIN descendants d      ON f.husband_id = d.id OR f.wife_id = d.id
)
SELECT * FROM descendants ORDER BY depth;
```

---

## Lưu ảnh

Không lưu binary vào DB. Dùng object storage:

```
[Client] → upload ảnh → [Object Storage] → trả về URL
                                            ↓
                                    lưu URL vào persons.photo_url
```

| Provider | Free tier | Ghi chú |
|----------|-----------|---------|
| Cloudflare R2 | 10 GB / tháng | Không tính phí egress |
| Supabase Storage | 1 GB | Tích hợp sẵn nếu dùng Supabase |
| AWS S3 | 5 GB / 12 tháng | Phổ biến nhất |

---

## Gợi ý host (v1)

| Layer | Lựa chọn | Chi phí |
|-------|----------|---------|
| Database | Supabase (PostgreSQL) | Free 500 MB |
| Backend | Supabase Edge Functions hoặc Next.js API | Free |
| Ảnh | Supabase Storage | Free 1 GB |
| Frontend | Vercel / Netlify | Free |

→ Toàn bộ stack **miễn phí** cho quy mô gia đình (~vài trăm người).
