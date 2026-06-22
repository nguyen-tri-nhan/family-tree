import { useNavigate } from 'react-router-dom'

const TERMS_EFFECTIVE_DATE = '22/06/2025'

export function TermsPage() {
  const navigate = useNavigate()

  return (
    <div style={page}>
      <button onClick={() => navigate(-1)} style={backBtn}>← Quay lại</button>

      <div style={container}>
        <h1 style={h1}>Điều khoản sử dụng</h1>
        <p style={effective}>Có hiệu lực từ: {TERMS_EFFECTIVE_DATE}</p>

        <Section title="1. Giới thiệu">
          Cây Gia Phả ("ứng dụng") là phần mềm quản lý và trực quan hoá gia phả
          dành cho cá nhân và gia đình Việt Nam. Bằng cách sử dụng ứng dụng,
          bạn đồng ý với các điều khoản dưới đây.
        </Section>

        <Section title="2. Chấp nhận điều khoản">
          Việc sử dụng ứng dụng đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý
          bị ràng buộc bởi các điều khoản này. Nếu bạn không đồng ý, vui lòng
          ngừng sử dụng ứng dụng.
        </Section>

        <Section title="3. Mô tả dịch vụ và giới hạn freemium">
          Ứng dụng cung cấp các tính năng vẽ cây gia phả, tính toán quan hệ
          xưng hô, và xuất dữ liệu. Phiên bản miễn phí giới hạn tối đa{' '}
          <strong>200 thành viên</strong> mỗi file gia phả. Các tính năng nâng
          cao có thể yêu cầu đăng ký bản trả phí trong tương lai. Tác giả có
          quyền thay đổi giới hạn này với thông báo trước.
        </Section>

        <Section title="4. Sở hữu trí tuệ">
          Ứng dụng Cây Gia Phả, bao gồm toàn bộ mã nguồn, giao diện, thiết kế
          và tài liệu đi kèm, là tài sản trí tuệ độc quyền của{' '}
          <strong>Nguyễn Trí Nhân</strong>. Người dùng không được sao chép, phân
          phối, chỉnh sửa, dịch ngược (reverse engineer), hoặc tạo ra sản phẩm
          phái sinh từ ứng dụng này dưới bất kỳ hình thức nào khi chưa có sự
          cho phép bằng văn bản.
        </Section>

        <Section title="5. Giới hạn trách nhiệm">
          Ứng dụng được cung cấp "nguyên trạng" (as-is). Tác giả không chịu
          trách nhiệm đối với bất kỳ tổn thất nào phát sinh từ việc sử dụng
          ứng dụng, bao gồm nhưng không giới hạn: mất dữ liệu gia phả, lỗi
          phần mềm, hoặc thiệt hại gián tiếp. Người dùng có trách nhiệm tự sao
          lưu dữ liệu của mình.
        </Section>

        <Section title="6. Dữ liệu người dùng">
          Toàn bộ dữ liệu gia phả được lưu trữ cục bộ trên thiết bị của người
          dùng dưới dạng file <code style={code}>.ftree</code>. Ứng dụng không
          thu thập, truyền tải hay lưu trữ dữ liệu cá nhân lên bất kỳ server
          nào.
        </Section>

        <Section title="7. Thay đổi điều khoản">
          Tác giả có quyền cập nhật điều khoản này bất kỳ lúc nào. Khi có thay
          đổi đáng kể, ứng dụng sẽ yêu cầu bạn xác nhận lại vào lần sử dụng
          tiếp theo.
        </Section>

        <Section title="8. Liên hệ">
          Mọi câu hỏi về điều khoản sử dụng, vui lòng liên hệ:{' '}
          <a href="mailto:nguyentrinhan.dev@gmail.com" style={link}>
            nguyentrinhan.dev@gmail.com
          </a>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={section}>
      <h2 style={h2}>{title}</h2>
      <p style={body}>{children}</p>
    </section>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight:     '100vh',
  background:    'var(--t-bg)',
  display:       'flex',
  flexDirection: 'column',
  alignItems:    'center',
  padding:       '48px 16px 64px',
  fontFamily:    'system-ui, sans-serif',
  position:      'relative',
}

const container: React.CSSProperties = {
  width:     '100%',
  maxWidth:  640,
  marginTop: 24,
}

const h1: React.CSSProperties = {
  margin:     '0 0 4px',
  fontSize:   26,
  fontWeight: 900,
  color:      'var(--t-text)',
}

const effective: React.CSSProperties = {
  margin:   '0 0 32px',
  fontSize: 12,
  color:    'var(--t-text-4)',
}

const section: React.CSSProperties = {
  marginBottom: 28,
}

const h2: React.CSSProperties = {
  margin:     '0 0 8px',
  fontSize:   14,
  fontWeight: 700,
  color:      'var(--t-text)',
}

const body: React.CSSProperties = {
  margin:     0,
  fontSize:   14,
  lineHeight: 1.7,
  color:      'var(--t-text-2)',
}

const backBtn: React.CSSProperties = {
  position:     'absolute',
  top:          20,
  left:         20,
  background:   'none',
  border:       'none',
  cursor:       'pointer',
  fontSize:     13,
  fontWeight:   600,
  color:        'var(--t-text-3)',
  padding:      '6px 10px',
  borderRadius: 6,
}

const code: React.CSSProperties = {
  fontFamily:   'monospace',
  fontSize:     13,
  background:   'var(--t-surface)',
  padding:      '1px 5px',
  borderRadius: 4,
}

const link: React.CSSProperties = {
  color:          'var(--t-accent, #4f46e5)',
  textDecoration: 'none',
}
