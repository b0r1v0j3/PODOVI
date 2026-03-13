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

    const emailResults = await Promise.allSettled([
      mailer.sendInquiryEmail(inquiry),
      mailer.sendInquiryConfirmation(inquiry),
    ]);

    const emailFailures = emailResults.filter(result => result.status === 'rejected');

    return NextResponse.json(
      {
        success: true,
        inquiryId: inquiry.id,
        message: emailFailures.length === 0
          ? 'Upit je uspešno poslat'
          : 'Upit je uspešno sačuvan. Potvrda mejlom trenutno nije dostupna.'
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
  return NextResponse.json(
    { error: 'Javno čitanje upita nije podržano.' },
    { status: 403 }
  );
}
