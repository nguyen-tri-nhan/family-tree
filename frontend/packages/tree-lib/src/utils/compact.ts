import type { FtreeDocument, FamilyUnit, Person, Branch, Clan, PartialDate } from '../types'
import { FTREE_VERSION } from '../types'

// ── PartialDate ───────────────────────────────────────────────────

function encDate(d: PartialDate): Record<string, unknown> {
  const o: Record<string, unknown> = { y: d.year, dc: d.displayCalendar === 'solar' ? 's' : 'l' }
  if (d.month != null) o.m  = d.month
  if (d.day   != null) o.d  = d.day
  if (d.lunar) {
    const l: Record<string, unknown> = { y: d.lunar.year, m: d.lunar.month }
    if (d.lunar.day != null) l.d  = d.lunar.day
    if (d.lunar.leapMonth)   l.lm = 1
    o.l = l
  }
  return o
}

function decDate(o: Record<string, unknown>): PartialDate {
  const pd: PartialDate = { year: o.y as number, displayCalendar: o.dc === 's' ? 'solar' : 'lunar' }
  if (o.m != null) pd.month = o.m as number
  if (o.d != null) pd.day   = o.d as number
  if (o.l) {
    const l = o.l as Record<string, unknown>
    pd.lunar = { year: l.y as number, month: l.m as number }
    if (l.d  != null) pd.lunar.day       = l.d as number
    if (l.lm)         pd.lunar.leapMonth = true
  }
  return pd
}

// ── Clan ──────────────────────────────────────────────────────────

function encClan(c: Clan): Record<string, unknown> {
  const o: Record<string, unknown> = { i: c.id, n: c.name, sn: c.surname }
  if (c.origin)            o.o  = c.origin
  if (c.foundingYear)      o.fy = c.foundingYear
  if (c.motto)             o.mo = c.motto
  if (c.ancestorPersonId)  o.ap = c.ancestorPersonId
  if (c.description)       o.d  = c.description
  if (c.region)            o.r  = c.region === 'north' ? 'n' : 's'
  if (c.currentHeadId)     o.ch = c.currentHeadId
  if (c.ancestralHall)     o.ah = c.ancestralHall
  if (c.generationPoems?.length) o.gp = c.generationPoems
  if (c.headHistory?.length)     o.hh = c.headHistory
  return o
}

function decClan(o: Record<string, unknown>): Clan {
  return {
    id:      o.i  as string,
    name:    o.n  as string,
    surname: o.sn as string,
    ...(o.o  != null && { origin:           o.o  as string }),
    ...(o.fy != null && { foundingYear:     o.fy as number }),
    ...(o.mo != null && { motto:            o.mo as string }),
    ...(o.ap != null && { ancestorPersonId: o.ap as string }),
    ...(o.d  != null && { description:      o.d  as string }),
    ...(o.r  != null && { region:           (o.r === 'n' ? 'north' : 'south') as Clan['region'] }),
    ...(o.ch != null && { currentHeadId:    o.ch as string }),
    ...(o.ah != null && { ancestralHall:    o.ah as Clan['ancestralHall'] }),
    ...(o.gp != null && { generationPoems:  o.gp as string[] }),
    ...(o.hh != null && { headHistory:      o.hh as Clan['headHistory'] }),
  }
}

// ── Person ────────────────────────────────────────────────────────

const G_ENC: Record<string, string>          = { male: 'm', female: 'f', unknown: 'u' }
const G_DEC: Record<string, Person['gender']> = { m: 'male', f: 'female', u: 'unknown' }

function encPerson(p: Person): unknown[] {
  const ex: Record<string, unknown> = { ca: p.createdAt, ua: p.updatedAt }
  if (p.names)               ex.ns = p.names
  if (p.bio)                 ex.bi = p.bio
  if (p.notes)               ex.no = p.notes
  if (p.education?.length)   ex.ed = p.education
  if (p.titles?.length)      ex.ti = p.titles
  if (p.occupations?.length) ex.oc = p.occupations
  if (p.achievements?.length) ex.ac = p.achievements
  if (p.clanRoles?.length)   ex.cr = p.clanRoles

  const arr: unknown[] = [
    p.id, p.displayName, G_ENC[p.gender] ?? 'u', p.isAlive ? 1 : 0,
    p.birthDate  ? encDate(p.birthDate)  : null,
    p.deathDate  ? encDate(p.deathDate)  : null,
    p.birthPlace ?? null,
    p.deathPlace ?? null,
    ex,
  ]
  while (arr.length && arr[arr.length - 1] === null) arr.pop()
  return arr
}

function decPerson(arr: unknown[]): Person {
  const g  = (i: number) => arr[i] ?? null
  const ex = ((g(8) ?? {}) as Record<string, unknown>)
  return {
    id:          arr[0] as string,
    displayName: arr[1] as string,
    gender:      G_DEC[arr[2] as string] ?? 'unknown',
    isAlive:     arr[3] === 1,
    ...(g(4) != null && { birthDate:  decDate(g(4) as Record<string, unknown>) }),
    ...(g(5) != null && { deathDate:  decDate(g(5) as Record<string, unknown>) }),
    ...(g(6) != null && { birthPlace: g(6) as string }),
    ...(g(7) != null && { deathPlace: g(7) as string }),
    createdAt:   ex.ca as string,
    updatedAt:   ex.ua as string,
    ...(ex.ns != null && { names:        ex.ns as Person['names'] }),
    ...(ex.bi != null && { bio:          ex.bi as string }),
    ...(ex.no != null && { notes:        ex.no as string }),
    ...(ex.ed != null && { education:    ex.ed as Person['education'] }),
    ...(ex.ti != null && { titles:       ex.ti as Person['titles'] }),
    ...(ex.oc != null && { occupations:  ex.oc as Person['occupations'] }),
    ...(ex.ac != null && { achievements: ex.ac as Person['achievements'] }),
    ...(ex.cr != null && { clanRoles:    ex.cr as Person['clanRoles'] }),
  }
}

// ── FamilyUnit ────────────────────────────────────────────────────

const MS_ENC: Record<string, string>                     = { married: 'm', divorced: 'd', widowed: 'w', single: 's' }
const MS_DEC: Record<string, FamilyUnit['marriageStatus']> = { m: 'married', d: 'divorced', w: 'widowed', s: 'single' }

function encFamily(f: FamilyUnit): unknown[] {
  const ex: Record<string, unknown> = {}
  if (f.marriageRole && f.marriageRole !== 'normal') ex.mr = f.marriageRole
  if (f.marriageOrder && f.marriageOrder !== 1)      ex.mo = f.marriageOrder
  if (f.branchId)     ex.bi = f.branchId
  if (f.marriageDate) ex.md = encDate(f.marriageDate)
  if (f.divorceDate)  ex.dd = encDate(f.divorceDate)

  const arr: unknown[] = [
    f.id, f.personId, f.spouseId ?? null, f.childIds, f.generation,
    MS_ENC[f.marriageStatus] ?? 'm',
    Object.keys(ex).length ? ex : null,
  ]
  while (arr.length && arr[arr.length - 1] === null) arr.pop()
  return arr
}

function decFamily(arr: unknown[]): FamilyUnit {
  const g  = (i: number) => arr[i] ?? null
  const ex = ((g(6) ?? {}) as Record<string, unknown>)
  return {
    id:             arr[0] as string,
    personId:       arr[1] as string,
    spouseId:       (arr[2] as string | null | undefined) ?? undefined,
    childIds:       (arr[3] as string[]) ?? [],
    generation:     arr[4] as number,
    marriageStatus: MS_DEC[arr[5] as string] ?? 'married',
    ...(ex.mr != null && { marriageRole:  ex.mr as FamilyUnit['marriageRole'] }),
    ...(ex.mo != null && { marriageOrder: ex.mo as number }),
    ...(ex.bi != null && { branchId:     ex.bi as string }),
    ...(ex.md != null && { marriageDate: decDate(ex.md as Record<string, unknown>) }),
    ...(ex.dd != null && { divorceDate:  decDate(ex.dd as Record<string, unknown>) }),
  }
}

// ── Branch ────────────────────────────────────────────────────────

function encBranch(b: Branch): unknown[] {
  const ex: Record<string, unknown> = {}
  if (b.shortName)   ex.sn = b.shortName
  if (b.description) ex.d  = b.description
  if (b.region)      ex.r  = b.region

  const arr: unknown[] = [
    b.id, b.name, b.ancestorPersonId, b.clanId, b.order,
    b.type === 'main' ? 'm' : 's',
    Object.keys(ex).length ? ex : null,
  ]
  while (arr.length && arr[arr.length - 1] === null) arr.pop()
  return arr
}

function decBranch(arr: unknown[]): Branch {
  const g  = (i: number) => arr[i] ?? null
  const ex = ((g(6) ?? {}) as Record<string, unknown>)
  return {
    id:               arr[0] as string,
    name:             arr[1] as string,
    ancestorPersonId: arr[2] as string,
    clanId:           arr[3] as string,
    order:            arr[4] as number,
    type:             arr[5] === 'm' ? 'main' : 'secondary',
    ...(ex.sn != null && { shortName:   ex.sn as string }),
    ...(ex.d  != null && { description: ex.d  as string }),
    ...(ex.r  != null && { region:      ex.r  as string }),
  }
}

// ── Document ──────────────────────────────────────────────────────

export function compactEncode(doc: FtreeDocument): string {
  const arr: unknown[] = [
    doc.version,
    encClan(doc.clan),
    doc.persons.map(encPerson),
    doc.families.map(encFamily),
    doc.branches.length ? doc.branches.map(encBranch) : null,
    doc.createdAt,
    doc.updatedAt,
  ]
  while (arr.length && arr[arr.length - 1] == null) arr.pop()
  return JSON.stringify(arr)
}

export function compactDecode(json: string): FtreeDocument {
  const arr = JSON.parse(json) as unknown[]
  return {
    version:   FTREE_VERSION,
    clan:      decClan(arr[1] as Record<string, unknown>),
    persons:   (arr[2] as unknown[][]).map(decPerson),
    families:  (arr[3] as unknown[][]).map(decFamily),
    branches:  arr[4] ? (arr[4] as unknown[][]).map(decBranch) : [],
    createdAt: (arr[5] as string | undefined) ?? new Date().toISOString(),
    updatedAt: (arr[6] as string | undefined) ?? new Date().toISOString(),
  }
}
