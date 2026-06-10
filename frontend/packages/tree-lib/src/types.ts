// ── Ngày tháng ─────────────────────────────────────────────────

export interface LunarDate {
  year: number
  month: number   // 1–12
  day?: number
  leapMonth?: boolean
}

export interface PartialDate {
  // Dương lịch — canonical, dùng để sort/compare
  year: number
  month?: number  // 1–12
  day?: number    // 1–31
  // Âm lịch gốc nếu người dùng nhập âm lịch
  lunar?: LunarDate
  displayCalendar: 'solar' | 'lunar'
}

// ── Tên ────────────────────────────────────────────────────────

export interface PersonName {
  birth?: string      // tên khai sinh (nếu khác displayName)
  nickname?: string   // tên thường gọi / tên tục
  courtesy?: string   // tên tự (字)
  taboo?: string      // tên húy (諱)
  sinograph?: string  // tên chữ Hán, vd "阮文安"
}

// ── Học vấn & Công trạng ───────────────────────────────────────

export type EducationLevel =
  | 'primary' | 'secondary' | 'highschool'
  | 'college' | 'university' | 'postgrad'

export interface Education {
  level: EducationLevel
  institution?: string
  major?: string
  graduationYear?: number
}

export type TitleType =
  | 'giao_su'       // Giáo sư
  | 'pho_giao_su'   // Phó Giáo sư
  | 'tien_si'       // Tiến sĩ
  | 'thac_si'       // Thạc sĩ
  | 'bac_si'        // Bác sĩ
  | 'luat_su'       // Luật sư
  | 'nghe_nhan'     // Nghệ nhân / NSND / NSƯT
  | 'anh_hung'      // Anh hùng LLVT / Lao động
  | 'other'

export interface Title {
  type: TitleType
  label: string       // hiển thị: "GS.TS", "NSND"
  awardedYear?: number
  awardedBy?: string
}

export type OccupationSector =
  | 'government' | 'military' | 'education'
  | 'business' | 'agriculture' | 'other'

export interface Occupation {
  title: string
  organization?: string
  startYear?: number
  endYear?: number    // undefined = hiện tại
  sector?: OccupationSector
}

export type AchievementType = 'award' | 'honor' | 'contribution' | 'milestone' | 'other'

export interface Achievement {
  title: string
  description?: string
  year?: number
  type: AchievementType
}

// ── Vai trò dòng họ ────────────────────────────────────────────

export type ClanRoleType =
  | 'truong_ho'           // Trưởng họ
  | 'truong_chi'          // Trưởng chi
  | 'thu_ky_ho'           // Thư ký họ
  | 'thu_quy_ho'          // Thủ quỹ họ
  | 'nguoi_viet_gia_pha'  // Người chép gia phả
  | 'cu_cao_tuoi'         // Cụ cao tuổi

export interface ClanRole {
  clanId: string
  role: ClanRoleType
  startYear?: number
  endYear?: number
  notes?: string
}

// ── Person ─────────────────────────────────────────────────────

export interface Person {
  id: string            // UUID v4
  displayName: string
  names?: PersonName
  gender: 'male' | 'female' | 'unknown'
  birthDate?: PartialDate
  deathDate?: PartialDate
  birthPlace?: string
  deathPlace?: string
  isAlive: boolean
  bio?: string
  education?: Education[]
  titles?: Title[]
  occupations?: Occupation[]
  achievements?: Achievement[]
  clanRoles?: ClanRole[]
  createdAt: string     // ISO 8601
  updatedAt: string
  notes?: string
}

// ── Family Unit ────────────────────────────────────────────────

export type MarriageStatus = 'married' | 'divorced' | 'widowed' | 'single'
export type MarriageRole   = 'normal' | 'chinh' | 'thu' | 'thiep'

export interface FamilyUnit {
  id: string            // UUID v4
  personId: string      // con ruột (người thuộc dòng họ)
  spouseId?: string     // dâu / rể
  marriageDate?: PartialDate
  divorceDate?: PartialDate
  marriageStatus: MarriageStatus
  marriageRole?:  MarriageRole    // chỉ dùng khi đa thê; default 'normal'
  marriageOrder?: number          // 1-based thứ tự hôn nhân; default 1
  childIds: string[]    // ordered: con cả → con út
  branchId?: string
  generation: number    // đời 1 = cụ tổ
}

// ── Branch / Chi ───────────────────────────────────────────────

export type BranchType = 'main' | 'secondary'

export interface Branch {
  id: string            // UUID v4
  name: string          // "Chi Trưởng"
  shortName?: string    // "Chi I"
  type: BranchType
  order: number         // 1 = chi cả
  ancestorPersonId: string
  clanId: string
  description?: string
  region?: string
}

// ── Clan ───────────────────────────────────────────────────────

export interface ClanHeadRecord {
  personId: string
  startYear: number
  endYear?: number
  reason?: string
}

export interface Clan {
  id: string            // UUID v4
  name: string          // "Họ Nguyễn Văn — Làng Đông Ngạc"
  surname: string
  origin?: string
  foundingYear?: number
  motto?: string
  ancestorPersonId?: string
  ancestralHall?: {
    address: string
    builtYear?: number
  }
  generationPoems?: string[]
  currentHeadId?: string
  headHistory?: ClanHeadRecord[]
  description?: string
  region?: 'north' | 'south'   // dialect for kinship terms: Bắc/Nam
}

// ── FtreeDocument ──────────────────────────────────────────────

export const FTREE_VERSION = '1.0' as const

export interface FtreeDocument {
  version: typeof FTREE_VERSION
  createdAt: string     // ISO 8601
  updatedAt: string
  clan: Clan
  branches: Branch[]
  persons: Person[]
  families: FamilyUnit[]
}

// ── Index maps (runtime only, không lưu vào file) ──────────────

export interface FtreeIndex {
  personMap:            Map<string, Person>
  familyMap:            Map<string, FamilyUnit>
  branchMap:            Map<string, Branch>
  familyByPerson:       Map<string, FamilyUnit>    // personId → primary FamilyUnit (marriageOrder=1)
  familiesByPerson:     Map<string, FamilyUnit[]>  // personId → all FamilyUnits sorted by marriageOrder
  childToParentFamily:  Map<string, FamilyUnit>    // childId  → parent FamilyUnit
  familyBySpouse:       Map<string, FamilyUnit>    // spouseId → first FamilyUnit (primary)
}

export function buildIndex(doc: FtreeDocument): FtreeIndex {
  const childToParentFamily  = new Map<string, FamilyUnit>()
  const familyBySpouse       = new Map<string, FamilyUnit>()
  const familiesByPersonMap  = new Map<string, FamilyUnit[]>()

  for (const f of doc.families) {
    for (const cid of f.childIds) childToParentFamily.set(cid, f)
    if (f.spouseId && !familyBySpouse.has(f.spouseId)) familyBySpouse.set(f.spouseId, f)
    const list = familiesByPersonMap.get(f.personId) ?? []
    list.push(f)
    familiesByPersonMap.set(f.personId, list)
  }

  // Sort each person's families by marriageOrder (default 1)
  familiesByPersonMap.forEach(list =>
    list.sort((a, b) => (a.marriageOrder ?? 1) - (b.marriageOrder ?? 1)),
  )

  // familyByPerson: primary (lowest marriageOrder) family per person
  const familyByPersonMap = new Map<string, FamilyUnit>()
  familiesByPersonMap.forEach((list, pid) => familyByPersonMap.set(pid, list[0]))

  return {
    personMap:           new Map(doc.persons.map(p  => [p.id, p])),
    familyMap:           new Map(doc.families.map(f => [f.id, f])),
    branchMap:           new Map(doc.branches.map(b => [b.id, b])),
    familyByPerson:      familyByPersonMap,
    familiesByPerson:    familiesByPersonMap,
    childToParentFamily,
    familyBySpouse,
  }
}
