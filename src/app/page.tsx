import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-cyan-400 mb-4">LeoTV</h1>
        <p className="text-xl text-gray-300 mb-12">Streaming P2P de Conteúdo</p>
        
        <div className="flex gap-6 justify-center">
          <Link href="/admin/login" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-3 rounded-lg transition">
            Admin
          </Link>
          <Link href="/user/login" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition">
            Usuário
          </Link>
        </div>
      </div>
    </div>
  );
}
