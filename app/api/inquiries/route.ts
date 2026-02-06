import { NextRequest, NextResponse } from 'next/server';
import { inquiryRepository } from '@/lib/repositories/inquiry-repository';
import { mailer } from '@/lib/mailer/mailer';
import { Inquiry } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.fullName || !data.phone || !data.email || !data.city || !data.message) {
      return NextResponse.json(
        { error: 'Sva obavezna polja moraju biti popunjena' },
        { status: 400 }
      );
    }

    if (!data.preferredContact || data.preferredContact.length === 0) {
      return NextResponse.json(
        { error: 'Morate izabrati najmanje jedan način kontakta' },
        { status: 400 }
      );
    }

    // Create inquiry object
    const inquiryData: Omit<Inquiry, 'id' | 'createdAt'> = {
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      productUrl: data.productUrl,
      productImage: data.productImage,
      productCategory: data.productCategory,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      quantityM2: data.quantityM2 ? parseFloat(data.quantityM2) : undefined,
      message: data.message,
      preferredContact: data.preferredContact,
      status: 'new',
    };

    // Save to repository
    const inquiry = await inquiryRepository.create(inquiryData);

    // Send emails
    await Promise.all([
      mailer.sendInquiryEmail(inquiry),
      mailer.sendInquiryConfirmation(inquiry),
    ]);

    return NextResponse.json(
      {
        success: true,
        inquiryId: inquiry.id,
        message: 'Upit je uspešno poslat'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Greška pri obradi upita. Molimo pokušajte ponovo.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inquiries = await inquiryRepository.findAll();
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju upita' },
      { status: 500 }
    );
  }
}
