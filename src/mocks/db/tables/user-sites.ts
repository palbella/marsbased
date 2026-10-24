export interface UserSiteRow {
  id: string
  userId: string
  siteId: string
}

// 07 §2: perimeter of each `ops_agent`; the `ops_manager` sees every site (BR-PM-01).
export const userSitesSeed: UserSiteRow[] = [
  { id: 'usi_001', userId: 'usr_010', siteId: 'site_zgz' },
  { id: 'usi_002', userId: 'usr_010', siteId: 'site_vlc' },
  { id: 'usi_003', userId: 'usr_011', siteId: 'site_bio' },
  { id: 'usi_004', userId: 'usr_011', siteId: 'site_bcn' },
]
