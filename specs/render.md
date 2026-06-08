# Render Strategy — Xử lý 1000+ Node

## Baseline hiện tại

Stack hiện tại: **D3 hierarchy + SVG DOM**, mỗi node = nhiều SVG element (circle, text, line).

Với cây 3 thế hệ (~20 người) → ổn hoàn toàn. Vấn đề bắt đầu khi số node tăng:

| Số node | SVG DOM elements | Triệu chứng |
|---------|-----------------|-------------|
| < 200   | < 2.000         | Mượt mà     |
| 200–500 | 2.000–5.000     | Zoom/pan bắt đầu giật trên máy yếu |
| 500–1.000 | 5.000–10.000  | Layout tính chậm (~200ms), scroll lag rõ |
| > 1.000 | > 10.000        | Trình duyệt cảnh báo, có thể freeze |

Mỗi `Person` hiện tại sinh ra: 1 `<g>`, 2 `<circle>`, 1–2 `<text>`, 1 hover ring = **~6 element/người**.
Cặp vợ chồng thêm 1 `<line>` marriage. Link T-connection: 1 `<path>`.

---

## Tại sao SVG chậm ở quy mô lớn

1. **DOM mutation cost**: Mỗi lần re-render, D3 traverse và update hàng nghìn DOM node.
2. **Layout reflow**: Trình duyệt tính lại bounding box cho mỗi `<text>` node.
3. **Paint cost**: SVG filter (`drop-shadow`) đặc biệt đắt — nhân lên 1.000 lần.
4. **Event listener overhead**: Mỗi node đang lắng nghe `click` riêng.
5. **Memory**: Chrome giữ full DOM tree + D3 selection object trong RAM.

---

## Chiến lược xử lý theo ngưỡng

### Ngưỡng 1 — Tối ưu SVG (0–500 node) ← làm ngay trong v1

Không cần đổi stack, chỉ cần tối ưu những điểm đắt nhất:

**a) Gộp event listener**
```js
// Thay vì attach riêng mỗi node:
nodeLayer.on('click', (event) => {
  const target = event.target.closest('[data-person-id]')
  if (target) onPersonClick(target.dataset.personId)
})
```
Giảm từ N listener xuống còn 1 (event delegation).

**b) Bỏ drop-shadow filter trên toàn bộ**
```js
// SVG filter đắt hơn CSS box-shadow nhiều lần
// Thay bằng stroke màu nhạt + stroke-width lớn hơn để giả shadow
g.append('circle').attr('r', R + 2).attr('fill', 'none')
  .attr('stroke', 'rgba(0,0,0,0.08)').attr('stroke-width', 4)
```

**c) Tắt text rendering khi zoom out**
```js
svg.call(d3.zoom().on('zoom', (e) => {
  g.attr('transform', e.transform)
  const showText = e.transform.k > 0.5   // ẩn text khi thu nhỏ quá
  g.selectAll('text').style('display', showText ? null : 'none')
}))
```

**d) Cache layout**
```js
// D3 layout chỉ tính 1 lần khi data thay đổi, không tính lại khi zoom/pan
const layout = useMemo(() => {
  const root = d3.hierarchy(data, d => d.children)
  d3.tree().nodeSize([NODE_W, NODE_H])(root)
  return root
}, [data])
```

---

### Ngưỡng 2 — Viewport Culling (500–2.000 node)

**Chỉ render những node nằm trong màn hình** (+ buffer margin).

```
┌─────────────────────────────────────┐
│  Màn hình (viewport)                │
│  ┌───────────────────────────────┐  │
│  │  Render zone (viewport + 20%) │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Visible nodes: RENDER  │  │  │
│  │  └─────────────────────────┘  │  │
│  │  Nodes ngoài zone: SKIP       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
     Nodes ngoài màn hình: không tồn tại trong DOM
```

**Implementation:**

```js
function getViewportBounds(transform) {
  const { x, y, k } = transform
  return {
    left:   (-x) / k,
    top:    (-y) / k,
    right:  (-x + window.innerWidth)  / k,
    bottom: (-y + window.innerHeight) / k,
  }
}

function isNodeVisible(node, bounds, margin = 200) {
  return (
    node.x + margin > bounds.left   &&
    node.x - margin < bounds.right  &&
    node.y + margin > bounds.top    &&
    node.y - margin < bounds.bottom
  )
}

// Trong zoom handler:
svg.call(d3.zoom().on('zoom', (e) => {
  g.attr('transform', e.transform)
  const bounds = getViewportBounds(e.transform)

  // Ẩn/hiện node thay vì add/remove DOM (add/remove đắt hơn)
  nodeLayer.selectAll('.family-node')
    .style('display', d => isNodeVisible(d, bounds) ? null : 'none')
}))
```

**Lưu ý**: Ẩn bằng `display:none` nhanh hơn remove DOM. Remove DOM chỉ cần thiết nếu RAM là vấn đề (> 5.000 node).

---

### Ngưỡng 3 — Canvas Rendering (2.000–10.000 node)

Thoát khỏi SVG DOM hoàn toàn, vẽ trực tiếp lên `<canvas>`.

**Tại sao Canvas nhanh hơn:**
- Không có DOM — chỉ là pixel buffer
- GPU-accelerated compositing
- Re-draw toàn bộ canvas mỗi frame thay vì update từng DOM node

**Kiến trúc Canvas:**

```
┌─────────────────────────────────────┐
│  Canvas Layer Stack                  │
│  ┌─────────────────────────────────┐ │
│  │  Layer 3: Labels (text)         │ │  ← redraw khi zoom thay đổi
│  │  Layer 2: Nodes (circles)       │ │  ← redraw khi pan/zoom
│  │  Layer 1: Links (paths)         │ │  ← redraw khi data thay đổi
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Dùng nhiều `<canvas>` chồng lên nhau — mỗi layer có tần suất update khác nhau.

**Render loop:**

```js
function renderCanvas(ctx, nodes, links, transform) {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.translate(transform.x, transform.y)
  ctx.scale(transform.k, transform.k)

  // 1. Links trước (dưới nodes)
  links.forEach(({ source, target }) => {
    drawTConnection(ctx, source, target)
  })

  // 2. Nodes
  nodes.forEach(node => {
    if (!isNodeVisible(node, viewportBounds)) return  // culling
    drawPersonCanvas(ctx, node)
  })

  ctx.restore()
}

function drawPersonCanvas(ctx, node) {
  const { x, y } = node
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.fillStyle = node.data.person.gender === 'f' ? '#fdf2f8' : '#eff6ff'
  ctx.fill()
  ctx.strokeStyle = '#1e1b4b'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Text chỉ render khi zoom đủ lớn
  if (transform.k > 0.4) {
    ctx.font = 'bold 11px system-ui'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1e1b4b'
    ctx.fillText(node.data.person.name, x, y + R + 16)
  }
}
```

**Hit detection trên Canvas** (không có sẵn như DOM events):

```js
// Dùng QuadTree để tìm node tại vị trí click
import { quadtree } from 'd3-quadtree'

const qt = quadtree()
  .x(d => d.x)
  .y(d => d.y)
  .addAll(nodes)

canvas.addEventListener('click', (e) => {
  const [mx, my] = transform.invert([e.offsetX, e.offsetY])
  const nearest = qt.find(mx, my, R * 2)  // tìm node trong vòng R*2 px
  if (nearest) onPersonClick(nearest.data.person)
})
```

---

### Ngưỡng 4 — Lazy Loading + Collapse (mọi quy mô)

Chiến lược bổ sung — **không render tất cả cùng lúc**, chỉ mở nhánh khi người dùng click.

```
[Ông tổ] ─── [Chi I] ─── [+12 người] ← collapsed
          └── [Chi II] ─── [Con cả]
                              └── [+5 người] ← collapsed
```

**State collapsed:**

```typescript
// Trong component state
const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

// Khi build hierarchy, filter children của node bị collapse
const root = d3.hierarchy(data, d => {
  if (collapsed.has(d.id)) return []   // không render con
  return d.children
})
```

**Indicator số con bị ẩn:**

```js
// Vẽ badge "+12" ở dưới node bị collapse
if (collapsed.has(node.data.id) && node.data.children?.length) {
  const count = countDescendants(node.data)
  g.append('circle').attr('cy', R + 8).attr('r', 12).attr('fill', '#6366f1')
  g.append('text').attr('y', R + 13).attr('text-anchor', 'middle')
    .attr('fill', '#fff').attr('font-size', '10px')
    .text(`+${count}`)
}
```

**Chiến lược collapse mặc định khi load:**
- Nếu cây > 200 node: auto-collapse tất cả chi con, chỉ hiện 3 đời gần nhất với root
- User click để mở từng nhánh

---

### Ngưỡng 5 — Web Worker (layout computation)

D3 `tree()` layout tính toán position cho mọi node — đồng bộ, block main thread.

Với 5.000+ node, layout computation có thể mất 500ms–2s, làm UI freeze.

```
Main Thread                    Worker Thread
    │                               │
    │── postMessage(data) ─────────>│
    │                               │ d3.hierarchy()
    │                               │ d3.tree()(root)
    │<─ postMessage(positions) ─────│
    │                               │
    │ render(positions)             │
```

```js
// worker.js
import * as d3 from 'd3'

self.onmessage = ({ data }) => {
  const root = d3.hierarchy(data, d => d.children)
  d3.tree().nodeSize([250, 200])(root)

  // Serialize chỉ positions, không serialize toàn bộ object
  const positions = []
  root.each(node => {
    positions.push({ id: node.data.id, x: node.x, y: node.y, depth: node.depth })
  })

  self.postMessage(positions)
}
```

---

## Quyết định kỹ thuật theo từng giai đoạn

```
Phase         Node range    Stack             Effort
──────────────────────────────────────────────────────
v1 (now)      0–300         SVG + D3          đang có
v1 optimized  0–500         SVG + culling      1–2 ngày
v2            500–2.000     SVG + culling      
                            + collapse        3–5 ngày
v2.5          2.000–5.000   Canvas + culling  
                            + collapse        1–2 tuần
v3            > 5.000       Canvas + Worker   
                            + virtual scroll  3–4 tuần
```

**Gợi ý cho v1**: Implement ngay **collapse/expand branches** vì nó:
- Giải quyết cả UX (cây dễ đọc hơn) lẫn performance (ít DOM hơn)
- Không cần đổi stack
- Dòng họ Việt Nam 99% trường hợp < 500 người → SVG + collapse là đủ

---

## Metric để biết cần nâng cấp

Theo dõi trong DevTools Performance tab:

| Metric | Ngưỡng tốt | Cần tối ưu |
|--------|-----------|------------|
| Layout computation (D3) | < 50ms | > 100ms |
| First render | < 500ms | > 1s |
| Pan/zoom FPS | > 50fps | < 30fps |
| RAM usage | < 100MB | > 300MB |
| DOM node count | < 5.000 | > 15.000 |

Cách đo nhanh:
```js
console.time('layout')
d3.tree().nodeSize([NODE_W, NODE_H])(root)
console.timeEnd('layout')

console.log('DOM nodes:', document.querySelectorAll('svg *').length)
```

---

## Đặc thù của dòng họ Việt Nam

Cây gia phả Việt khác cây tổ chức hay mind-map ở chỗ:

1. **Rất rộng, không sâu**: Dòng họ 5 đời × 3 con/cặp = 3⁵ = 243 node lá — cây **rất rộng** hơn là sâu
2. **Không cân bằng**: Chi trưởng thường đông hơn chi thứ nhiều lần
3. **Nhiều node lá không có con**: Người chưa lập gia đình, người mất sớm → chiếm ~40% node
4. **Ít update**: Gia phả không thay đổi theo thời gian thực — không cần reactive re-render liên tục

→ Chiến lược **collapse theo chi** phù hợp nhất: mặc định hiện chi đang xem, các chi khác collapsed.
