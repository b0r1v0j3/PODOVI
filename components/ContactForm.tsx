'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ContactForm() {
    const searchParams = useSearchParams();

    // Initial state from URL params
    const initialProduct = searchParams.get('product') || '';
    const initialColor = searchParams.get('color') || '';
    const initialRef = searchParams.get('ref') || '';
    const initialCategory = searchParams.get('category') || '';
    const initialName = searchParams.get('name') || '';

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (initialName) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za: ${initialName}`
            }));
        } else if (initialProduct) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za proizvod: ${initialProduct}`
            }));
        }

        if (initialCategory || initialColor || initialRef) {
            let details = '';
            if (initialCategory) details += `Kategorija: ${initialCategory}\n`;
            if (initialName) details += `Proizvod: ${initialName}\n`;
            if (initialColor) details += `Boja/Dezen: ${initialColor}\n`;
            if (initialRef) details += `Referenca: ${initialRef}\n`;

            if (details) {
                setFormData(prev => ({
                    ...prev,
                    message: `Poštovani,\n\nZainteresovan sam za sledeći proizvod:\n${details}\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`
                }));
            }
        }
    }, [initialProduct, initialCategory, initialColor, initialRef, initialName]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Došlo je do greške prilikom slanja.');
            }

            setStatus('success');
            setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Došlo je do greške. Molimo pokušajte ponovo.');
        }
    };

    if (status === 'success') {
        return (
            <div className="border border-ink-200 p-8 text-center">
                <div className="inline-flex w-16 h-16 items-center justify-center border border-ink-200 text-ink-900 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-normal text-ink-900 mb-2">Hvala na upitu!</h3>
                <p className="text-ink-600 mb-8">
                    Vaša poruka je uspešno poslata. Naš tim će vas kontaktirati u najkraćem mogućem roku.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn-link"
                >
                    Pošalji novi upit
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="fullName" className="label">
                        Ime i prezime <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        required
                        className="input w-full"
                        placeholder="Vaše ime"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="email" className="label">
                        Email adresa <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        required
                        className="input w-full"
                        placeholder="vase.ime@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="phone" className="label">
                        Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        required
                        className="input w-full"
                        placeholder="+381 6..."
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="label">
                        Naslov <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="subject"
                        required
                        className="input w-full"
                        placeholder="Naslov poruke"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="message" className="label">
                    Poruka <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="message"
                    required
                    rows={6}
                    className="input w-full resize-y"
                    placeholder="Napišite vašu poruku ovde..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
            </div>

            {status === 'error' && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-primary w-full md:w-auto min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'submitting' ? 'Slanje...' : 'Pošalji Poruku'}
            </button>
        </form>
    );
}
