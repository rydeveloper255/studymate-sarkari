import { getSupabase } from '../supabase';
import { OrganizationInfo, JobSector } from '../../types';
import { DbOrganization } from '../../types/database';
import { mapDbOrgToItem } from './mappers';

// Base organizations directory
export const DEFAULT_ORGANIZATIONS: OrganizationInfo[] = [
  { id: '1', code: 'UPSC', name: 'UPSC', fullName: 'Union Public Service Commission', sector: 'central', websiteUrl: 'https://upsc.gov.in' },
  { id: '2', code: 'SSC', name: 'SSC', fullName: 'Staff Selection Commission', sector: 'central', websiteUrl: 'https://ssc.gov.in' },
  { id: '3', code: 'RRB', name: 'RRB', fullName: 'Railway Recruitment Boards', sector: 'central', websiteUrl: 'https://indianrailways.gov.in' },
  { id: '4', code: 'IBPS', name: 'IBPS', fullName: 'Institute of Banking Personnel Selection', sector: 'central', websiteUrl: 'https://ibps.in' },
  { id: '5', code: 'SBI', name: 'SBI', fullName: 'State Bank of India', sector: 'central', websiteUrl: 'https://sbi.co.in/careers' },
  { id: '6', code: 'INDIAPOST', name: 'India Post', fullName: 'Department of Posts, Ministry of Communications', sector: 'central', websiteUrl: 'https://indiapostgdsonline.gov.in' },
  { id: '7', code: 'BPSC', name: 'BPSC', fullName: 'Bihar Public Service Commission', sector: 'state', stateCode: 'BR', websiteUrl: 'https://bpsc.bih.nic.in' },
  { id: '8', code: 'UPPSC', name: 'UPPSC', fullName: 'Uttar Pradesh Public Service Commission', sector: 'state', stateCode: 'UP', websiteUrl: 'https://uppsc.up.nic.in' },
  { id: '9', code: 'UPSSSC', name: 'UPSSSC', fullName: 'Uttar Pradesh Subordinate Services Selection Commission', sector: 'state', stateCode: 'UP', websiteUrl: 'http://upsssc.gov.in' },
  { id: '10', code: 'MPPSC', name: 'MPPSC', fullName: 'Madhya Pradesh Public Service Commission', sector: 'state', stateCode: 'MP', websiteUrl: 'https://mppsc.mp.gov.in' },
  { id: '11', code: 'MPSC', name: 'MPSC', fullName: 'Maharashtra Public Service Commission', sector: 'state', stateCode: 'MH', websiteUrl: 'https://mpsc.gov.in' },
  { id: '12', code: 'RPSC', name: 'RPSC', fullName: 'Rajasthan Public Service Commission', sector: 'state', stateCode: 'RJ', websiteUrl: 'https://rpsc.rajasthan.gov.in' },
  { id: '13', code: 'TNPSC', name: 'TNPSC', fullName: 'Tamil Nadu Public Service Commission', sector: 'state', stateCode: 'TN', websiteUrl: 'https://tnpsc.gov.in' },
  { id: '14', code: 'WBPSC', name: 'WBPSC', fullName: 'West Bengal Public Service Commission', sector: 'state', stateCode: 'WB', websiteUrl: 'https://psc.wb.gov.in' },
  { id: '15', code: 'DSSSB', name: 'DSSSB', fullName: 'Delhi Subordinate Services Selection Board', sector: 'state', stateCode: 'DL', websiteUrl: 'https://dsssb.delhi.gov.in' },
  { id: '16', code: 'KPSC', name: 'KPSC', fullName: 'Karnataka Public Service Commission', sector: 'state', stateCode: 'KA', websiteUrl: 'https://kpsc.kar.nic.in' },
];

export async function fetchOrganizations(sector?: JobSector): Promise<OrganizationInfo[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('organizations').select('*').order('name', { ascending: true });
      if (sector) {
        query = query.eq('sector', sector);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: DbOrganization) => mapDbOrgToItem(row));
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase organizations query error:', err);
    }
  }

  if (sector) {
    return DEFAULT_ORGANIZATIONS.filter((o) => o.sector === sector);
  }
  return DEFAULT_ORGANIZATIONS;
}
