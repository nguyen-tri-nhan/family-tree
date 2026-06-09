# Quiz — Trắc nghiệm xưng hô

Tính năng mini-game giúp trẻ em học cách xưng hô trong gia đình qua dạng trắc nghiệm, có liên kết trực tiếp với cây gia phả.

---

## Flow người dùng

```
1. Click vào 1 node trên cây (chọn nhân vật người chơi)
2. PersonPanel hiện nút "🎮 Trắc nghiệm"
3. Click → QuizPanel mở (side panel, cây vẫn nhìn thấy)
4. Mỗi câu hỏi:
   - Node được hỏi về được HIGHLIGHT trên cây
   - Hiển thị câu hỏi + 4 đáp án A/B/C/D
   - Chọn đáp án → highlight đúng/sai ngay
5. Sau 5–10 câu: màn hình kết quả (điểm + review)
6. "Chơi lại" hoặc "Đóng"
```

---

## Câu hỏi

### Dạng câu hỏi

```
"{playerName} gọi {targetName} là gì?

  A.  Ông
  B.  Bác
  C.  Chú        ← correct (ví dụ)
  D.  Cậu
```

Tuỳ chọn chiều ngược lại:

```
"{targetName} gọi {playerName} là gì?"
```

### Số câu

Mặc định **8 câu**, có thể config 5 / 8 / 10. Không lặp lại cùng target trong 1 lượt.

---

## Kỹ thuật

### Engine — `quizEngine.ts`

```ts
interface QuizQuestion {
  targetId:      string    // người được hỏi về
  correct:       string    // label đúng (vd: "Chú Hai")
  choices:       string[]  // 4 đáp án đã shuffle
  correctIndex:  number    // index của đáp án đúng trong choices[]
}

interface QuizSession {
  playerId:  string
  questions: QuizQuestion[]
  answers:   (number | null)[]   // null = chưa trả lời
  current:   number              // index câu hiện tại
}
```

#### Sinh câu hỏi (`generateQuiz`)

```ts
function generateQuiz(doc: FtreeDocument, playerId: string, count = 8): QuizSession {
  // 1. Thu thập tất cả persons có quan hệ với playerId (computeKinship != null)
  // 2. Shuffle, lấy `count` người
  // 3. Với mỗi target:
  //    - correct = computeKinship(doc, playerId, targetId).label
  //    - distractors = generateDistractors(doc, playerId, correct, 3)
  //    - choices = shuffle([correct, ...distractors])
}
```

#### Sinh đáp án nhiễu (`generateDistractors`)

Ưu tiên theo thứ tự:
1. **Cùng nhóm thế hệ**: nếu correct là "Chú" → nhiễu từ `['Bác', 'Cô', 'Cậu', 'Dì']`
2. **Từ quan hệ thực tế khác** trong tree: lấy labels của 3 người khác trong tree
3. **Fallback**: random từ pool kinship labels chuẩn

Không dùng đáp án trùng với `correct` (kể cả sau khi strip ordinal).

```ts
const KINSHIP_POOLS: Record<string, string[]> = {
  // Cùng generation +1
  'Bố':   ['Mẹ', 'Bác', 'Chú', 'Cậu'],
  'Mẹ':   ['Bố', 'Bác', 'Cô', 'Dì'],
  'Chú':  ['Bác', 'Cô', 'Cậu', 'Bố'],
  'Cô':   ['Chú', 'Bác', 'Dì', 'Mẹ'],
  'Cậu':  ['Chú', 'Bác', 'Cô', 'Dì'],
  'Dì':   ['Cô', 'Mẹ', 'Bác', 'Cậu'],
  // Generation +2
  'Ông':  ['Bà', 'Cụ', 'Bác'],
  'Bà':   ['Ông', 'Cụ', 'Cô'],
  // Generation -1
  'Con':  ['Cháu', 'Em', 'Anh'],
  'Cháu': ['Con', 'Em', 'Chắt'],
  // Same gen
  'Anh':  ['Em', 'Chị', 'Anh họ'],
  'Chị':  ['Em', 'Anh', 'Chị họ'],
  // ...etc
}
```

---

## UI

### QuizPanel

Side panel bên phải (tương tự KinshipDrawer), width ~320px. Cây vẫn hiển thị và scroll được ở phía trái.

```
┌──────────────────────────────┐
│ 🎮 Trắc nghiệm xưng hô  ✕  │
│ An • Câu 3 / 8   ●●●○○○○○  │  ← progress dots
├──────────────────────────────┤
│                              │
│  "An gọi                     │
│   Nguyễn Văn Bình            │  ← targetName (to highlight)
│   là gì?"                    │
│                              │
├──────────────────────────────┤
│  A   Ông                     │  ← after answer: ✓ green / ✗ red
│  B   Chú Hai       ← đúng   │
│  C   Bác                     │
│  D   Cậu                     │
├──────────────────────────────┤
│              [Câu tiếp theo →]│  ← chỉ hiện sau khi chọn
└──────────────────────────────┘
```

**Behaviour:**
- Khi câu hỏi hiển thị: **highlight target** trên cây (màu vàng/cam, khác màu so với kinship highlight)
- Sau khi chọn: đáp án đúng xanh, sai đỏ, không thể đổi lại
- Nút "Câu tiếp theo" chỉ xuất hiện sau khi đã chọn
- Nếu đúng: "+1" animation nhỏ bên cạnh score

### Màn hình kết quả

```
┌──────────────────────────────┐
│ 🎉 Kết quả                   │
│                              │
│     6 / 8  đúng              │
│   ████████░░  75%            │
│                              │
│  Sai:                        │
│  • An gọi Bình là "Chú Hai"  │
│    (bạn chọn: Bác)           │
│  • An gọi Hoa là "Dì Ba"     │
│    (bạn chọn: Cô)            │
│                              │
│  [Chơi lại]  [Đóng]         │
└──────────────────────────────┘
```

---

## Highlight trên cây

Thêm prop `quizHighlightId?: string` vào `FamilyTree` (hoặc tái dùng `highlightPersonId` với màu khác).

Trong App.tsx: khi QuizPanel đang mở và đang ở câu hỏi nào đó, set `highlightPersonId = questions[current].targetId`.

Sau khi trả lời hoặc đóng quiz: clear highlight.

---

## Tích hợp App.tsx

```tsx
// State mới:
const [quizPlayerId, setQuizPlayerId] = useState<string | null>(null)

// PersonPanel: thêm nút
<button onClick={() => { setQuizPlayerId(personId); setSelected(null) }}>
  🎮 Trắc nghiệm
</button>

// Render:
{quizPlayerId && (
  <QuizPanel
    doc={doc}
    playerId={quizPlayerId}
    onHighlight={setHighlight}
    onClose={() => { setQuizPlayerId(null); setHighlight(undefined) }}
  />
)}
```

---

## Mở rộng sau (v2 quiz)

| Idea | Mô tả |
|------|-------|
| Chế độ ngược | X gọi mình là gì? |
| Độ khó | Dễ (highlight + gợi ý), Khó (không highlight) |
| Leaderboard local | Lưu điểm cao nhất vào localStorage per-player |
| Âm thanh | Feedback sound khi đúng/sai (Web Audio API) |
| Hoạt hình | Confetti khi đạt 100% |
| Region toggle | Chọn Bắc/Nam trước khi chơi |

---

## Files cần tạo/sửa

| File | Action |
|------|--------|
| `src/utils/quizEngine.ts` | Tạo mới — sinh quiz, distractor, score |
| `src/components/QuizPanel.tsx` | Tạo mới — UI panel |
| `src/components/PersonPanel.tsx` | Sửa — thêm nút "Trắc nghiệm" |
| `src/App.tsx` | Sửa — state + render QuizPanel |

Không cần route mới — QuizPanel là overlay panel, không phải page riêng.
