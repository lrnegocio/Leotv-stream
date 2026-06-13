
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * API DE BANCO DE DADOS LOCAL v385-S
 * Armazena tudo em 'database.json' na raiz do projeto na VPS.
 */

const DB_PATH = path.join(process.cwd(), 'database.json');

async function getDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    const initialDb = { content: [], users: [], resellers: [], games: [], settings: [], rankings: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
}

async function saveDb(db: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, collection, data } = body;
    let db = await getDb();

    if (!db[collection]) db[collection] = [];

    switch (action) {
      case 'list':
        return NextResponse.json({ data: db[collection] });

      case 'upsert':
        const idx = db[collection].findIndex((item: any) => item.id === data.id);
        if (idx !== -1) db[collection][idx] = { ...db[collection][idx], ...data };
        else db[collection].push(data);
        await saveDb(db);
        return NextResponse.json({ data: true });

      case 'update':
        const uIdx = db[collection].findIndex((item: any) => item.id === data.id);
        if (uIdx !== -1) {
          db[collection][uIdx] = { ...db[collection][uIdx], ...data };
          await saveDb(db);
        }
        return NextResponse.json({ data: true });

      case 'delete':
        db[collection] = db[collection].filter((item: any) => item.id !== data.id);
        await saveDb(db);
        return NextResponse.json({ data: true });

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro no Servidor" }, { status: 500 });
  }
}
