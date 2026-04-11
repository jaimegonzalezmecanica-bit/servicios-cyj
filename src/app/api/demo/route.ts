import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const demoSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  condominio: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = demoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const submission = await db.demoSubmission.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        condominio: result.data.condominio || null,
        message: result.data.message || null,
      },
    });

    return NextResponse.json(
      { message: 'Solicitud enviada correctamente - Servicios Integrales CyJ', id: submission.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
