import type { SiteType } from '@/domain'

export interface SiteRow {
  id: string
  name: string
  type: SiteType
  city: string
  country: string
}

// 07 §2.
export const sitesSeed: SiteRow[] = [
  { id: 'site_zgz', name: 'Zaragoza Plant', type: 'factory', city: 'Zaragoza', country: 'ES' },
  { id: 'site_bio', name: 'Bilbao Plant', type: 'factory', city: 'Bilbao', country: 'ES' },
  {
    id: 'site_vlc',
    name: 'Valencia Warehouse',
    type: 'warehouse',
    city: 'Valencia',
    country: 'ES',
  },
  {
    id: 'site_bcn',
    name: 'Barcelona Warehouse',
    type: 'warehouse',
    city: 'Barcelona',
    country: 'ES',
  },
]
