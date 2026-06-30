'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// Vrste poda koje korisnik može da izabere u čeklistu (vodi ga ka upitu).
const FLOOR_CATEGORIES = ['Vinil', 'LVT', 'Parket', 'Linoleum', 'Tepih', 'Sport'];

function buildCategorySubject(categories: string[]): string {
    if (!categories.length) return '';
    return `Upit: ${categories.join(', ')}`;
}

function buildCategoryMessage(categories: string[]): string {
    if (!categories.length) return '';
    return `Poštovani,\n\nZainteresovan sam za sledeće vrste podova: ${categories.join(', ')}.\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`;
}

export default function ContactForm() {
    const searchParams = useSearchParams();

    // Initial state from URL params
    const initialProduct = searchParams.get('product') || '';
    const initialColor = searchParams.get('color') || '';
    const initialRef = searchParams.get('ref') || '';
    const initialCategory = searchParams.get('category') || '';
    const initialName = searchParams.get('name') || '';
    const initialKonfigurator = searchParams.get('konfigurator') || '';
    const initialUzorak = searchParams.get('uzorak') || '';
    const initialBoja = searchParams.get('boja') || '';
    const initialGradacija = searchParams.get('gradacija') || '';
    const initialObrada = searchParams.get('obrada') || '';
    const initialSifra = searchParams.get('sifra') || '';

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        categories: [] as string[],
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const successHeadingRef = useRef<HTMLHeadingElement>(null);

    // Da li je korisnik RUČNO dirao naslov/poruku — ako jeste, auto-popuna ih ne menja.
    // (Pre-fill iz URL-a ih takođe obeleži kao "dirnuto".) Ref-ovi se postavljaju samo
    // van setState updater-a, pa je updater čist (bezbedno uz React StrictMode dupli poziv).
    const subjectTouched = useRef(false);
    const messageTouched = useRef(false);

    // Premesti fokus na naslov potvrde kada se forma uspešno pošalje
    useEffect(() => {
        if (status === 'success') {
            successHeadingRef.current?.focus();
        }
    }, [status]);

    useEffect(() => {
        if (initialName) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za: ${initialName}`
            }));
            subjectTouched.current = true;
        } else if (initialProduct) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za proizvod: ${initialProduct}`
            }));
            subjectTouched.current = true;
        }

        if (initialKonfigurator === 'essence' && initialUzorak) {
            const lines =
                `Uzorak: ${initialUzorak}\n` +
                `Boja: ${initialBoja}\n` +
                `Gradacija: ${initialGradacija}\n` +
                `Obrada: ${initialObrada}\n` +
                (initialSifra ? `Šifra: ${initialSifra}\n` : '');
            setFormData(prev => ({
                ...prev,
                message: `Poštovani,\n\nŽeleo bih ponudu za parket po meri (Essence Premium) sa sledećom konfiguracijom:\n${lines}\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`,
            }));
            messageTouched.current = true;
            return;
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
                messageTouched.current = true;
            }
        }
    }, [initialProduct, initialCategory, initialColor, initialRef, initialName, initialKonfigurator, initialUzorak, initialBoja, initialGradacija, initialObrada, initialSifra]);

    const toggleCategory = (category: string) => {
        setFormData(prev => {
            const nextCategories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];

            const next = { ...prev, categories: nextCategories };

            // Auto-popuni naslov i poruku SAMO ako ih korisnik (ili pre-fill) nije već dirao.
            // Updater čita ref-ove ali ih ne menja → čist je i bezbedan uz StrictMode.
            if (!subjectTouched.current) {
                next.subject = buildCategorySubject(nextCategories);
            }
            if (!messageTouched.current) {
                next.message = buildCategoryMessage(nextCategories);
            }

            return next;
        });
    };

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
            setFormData({ fullName: '', email: '', phone: '', subject: '', message: '', categories: [] });
            subjectTouched.current = false;
            messageTouched.current = false;
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Došlo je do greške. Molimo pokušajte ponovo.');
        }
    };

    if (status === 'success') {
        return (
            <div role="status" className="border border-ink-200 p-8 text-center">
                {/* transitions.dev "success check" — fade + rotate + blur + bob + stroke-draw */}
                <span
                    className="t-success-check inline-flex w-16 h-16 items-center justify-center border border-ink-200 text-ink-900 mx-auto mb-4"
                    data-state="in"
                    aria-hidden="true"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </span>
                <h3 ref={successHeadingRef} tabIndex={-1} className="text-2xl font-normal text-ink-900 mb-2">Hvala na upitu!</h3>
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
            {/* Izbor vrste poda — vodi korisnika i auto-sastavlja naslov + poruku */}
            <fieldset>
                <legend className="label mb-1">Koja vrsta poda vas zanima?</legend>
                <p className="mb-4 text-[13px] text-ink-500">
                    Izaberite jednu ili više — naslov i poruku popunjavamo umesto vas (možete ih izmeniti).
                </p>
                <div className="border-t border-ink-200">
                    {FLOOR_CATEGORIES.map((category) => {
                        const active = formData.categories.includes(category);
                        return (
                            <button
                                type="button"
                                key={category}
                                onClick={() => toggleCategory(category)}
                                aria-pressed={active}
                                className="flex w-full items-center gap-3 border-b border-ink-200 py-3 text-left transition-colors hover:bg-paper"
                            >
                                <span
                                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border transition-colors duration-200 ${active
                                        ? 'border-ink-900 bg-ink-900 text-white'
                                        : 'border-ink-400 text-transparent'
                                        }`}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        className={`h-3.5 w-3.5 transition-transform duration-200 ${active ? 'scale-100' : 'scale-50'}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className={`text-[15px] ${active ? 'font-medium text-ink-900' : 'text-ink-700'}`}>
                                    {category}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </fieldset>

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
                        onChange={e => { subjectTouched.current = true; setFormData({ ...formData, subject: e.target.value }); }}
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
                    onChange={e => { messageTouched.current = true; setFormData({ ...formData, message: e.target.value }); }}
                ></textarea>
            </div>

            {status === 'error' && (
                <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
