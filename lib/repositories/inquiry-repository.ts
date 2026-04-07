import { Inquiry } from '@/types';
import { normalizeInquiryStatus } from '@/lib/crm/inquiry-status';
import { getServerSupabase, hasSupabaseAnonConfig, supabase } from '@/lib/supabase/client';

export interface UpdateInquiryLeadData {
  status?: Inquiry['status'];
  nextContactDate?: string | null;
  notes?: string;
}

export interface IInquiryRepository {
  create(inquiry: Omit<Inquiry, 'id' | 'createdAt'>): Promise<Inquiry>;
  findById(id: string): Promise<Inquiry | null>;
  findAll(): Promise<Inquiry[]>;
  updateStatus(id: string, status: Inquiry['status']): Promise<Inquiry>;
  updateLead(id: string, data: UpdateInquiryLeadData): Promise<Inquiry>;
}

// =========================================
// Transform DB row → Inquiry interface
// =========================================
function toInquiry(row: any): Inquiry {
  return {
    id: row.id,
    productId: row.product_id || '',
    productName: row.product_name || '',
    productSku: row.product_sku || '',
    productUrl: row.product_url || '',
    productImage: row.product_image || undefined,
    productCategory: row.product_category || undefined,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    quantityM2: row.quantity_m2 ? parseFloat(row.quantity_m2) : undefined,
    message: row.message,
    preferredContact: row.preferred_contact || [],
    status: normalizeInquiryStatus(row.status),
    nextContactDate: row.next_contact_date || undefined,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
  };
}

function getInquiryClient(preferServiceRole = false) {
  if (preferServiceRole) {
    try {
      return getServerSupabase();
    } catch {
      // Fall back to anon client in local/dev setups where service role is not configured.
    }
  }

  return supabase;
}

// =========================================
// Supabase implementation
// =========================================
export class SupabaseInquiryRepository implements IInquiryRepository {
  async create(data: Omit<Inquiry, 'id' | 'createdAt'>): Promise<Inquiry> {
    const client = getInquiryClient(true);
    const row = {
      product_id: data.productId,
      product_name: data.productName,
      product_sku: data.productSku,
      product_url: data.productUrl,
      product_image: data.productImage || null,
      product_category: data.productCategory || null,
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      quantity_m2: data.quantityM2 || null,
      message: data.message,
      preferred_contact: data.preferredContact,
      status: data.status || 'new',
      next_contact_date: data.nextContactDate || null,
      notes: data.notes || '',
    };

    const { data: inserted, error } = await client
      .from('inquiries')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('SupabaseInquiryRepository.create error:', error.message);
      throw new Error(`Failed to create inquiry: ${error.message}`);
    }

    console.log('✅ Nova upit sačuvan u Supabase:', inserted.id);
    return toInquiry(inserted);
  }

  async findById(id: string): Promise<Inquiry | null> {
    const client = getInquiryClient(true);
    const { data, error } = await client
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toInquiry(data);
  }

  async findAll(): Promise<Inquiry[]> {
    const client = getInquiryClient(true);
    const { data, error } = await client
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseInquiryRepository.findAll error:', error.message);
      return [];
    }
    return ((data as any[]) || []).map((row: any) => toInquiry(row));
  }

  async updateStatus(id: string, status: Inquiry['status']): Promise<Inquiry> {
    return this.updateLead(id, { status });
  }

  async updateLead(id: string, updates: UpdateInquiryLeadData): Promise<Inquiry> {
    const client = getInquiryClient(true);
    const row: Record<string, any> = {};

    if (updates.status !== undefined) {
      row.status = updates.status;
    }

    if (updates.nextContactDate !== undefined) {
      row.next_contact_date = updates.nextContactDate || null;
    }

    if (updates.notes !== undefined) {
      row.notes = updates.notes;
    }

    const { data: updatedInquiry, error } = await client
      .from('inquiries')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedInquiry) {
      throw new Error(`Upit sa ID ${id} nije pronađen ili ažuriranje nije uspelo`);
    }
    return toInquiry(updatedInquiry);
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockInquiryRepository implements IInquiryRepository {
  private inquiries: Inquiry[] = [];

  async create(data: Omit<Inquiry, 'id' | 'createdAt'>): Promise<Inquiry> {
    const inquiry: Inquiry = {
      ...data,
      id: `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.inquiries.push(inquiry);
    console.log('✅ Nova upit sačuvan:', inquiry);
    return inquiry;
  }

  async findById(id: string): Promise<Inquiry | null> {
    return this.inquiries.find(i => i.id === id) || null;
  }

  async findAll(): Promise<Inquiry[]> {
    return this.inquiries;
  }

  async updateStatus(id: string, status: Inquiry['status']): Promise<Inquiry> {
    return this.updateLead(id, { status });
  }

  async updateLead(id: string, updates: UpdateInquiryLeadData): Promise<Inquiry> {
    const inquiry = await this.findById(id);
    if (!inquiry) {
      throw new Error(`Upit sa ID ${id} nije pronađen`);
    }

    if (updates.status !== undefined) {
      inquiry.status = updates.status;
    }

    if (updates.nextContactDate !== undefined) {
      inquiry.nextContactDate = updates.nextContactDate || undefined;
    }

    if (updates.notes !== undefined) {
      inquiry.notes = updates.notes || undefined;
    }

    return inquiry;
  }
}

// Switch: use Supabase by default, set USE_MOCK=true to use mock data
const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !hasSupabaseAnonConfig();
export const inquiryRepository = USE_MOCK
  ? new MockInquiryRepository()
  : new SupabaseInquiryRepository();
