import { NextResponse } from 'next/server';
// TEMPORARIAMENTE DESABILITADO - whatsapp-web.js causa problemas no Next.js
// import { initializeWhatsApp, getStatus, logoutWhatsApp } from '@/lib/whatsapp/client';

export async function GET() {
  // Mock status enquanto whatsapp-web.js é incompatível
  const status = {
    status: 'disconnected',
    qrCode: null
  };
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  
  if (body.action === 'init') {
    // initializeWhatsApp(); // Desabilitado temporariamente
    return NextResponse.json({ message: 'Funcionalidade WhatsApp temporariamente desabilitada (incompatível com Next.js Edge)' });
  }

  if (body.action === 'logout') {
    // await logoutWhatsApp(); // Desabilitado temporariamente
    return NextResponse.json({ message: 'Funcionalidade WhatsApp temporariamente desabilitada' });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
