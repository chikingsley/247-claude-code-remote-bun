import { db, machines } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allMachines = await db.select().from(machines);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Claude Remote Control</h1>

      <section className="mb-8">
        <h2 className="text-xl mb-4">Machines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMachines.length === 0 ? (
            <p className="text-gray-400">
              No machines registered yet. Start an agent to register.
            </p>
          ) : (
            allMachines.map((machine) => (
              <Link
                key={machine.id}
                href={`/terminal/${machine.id}`}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      machine.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium">{machine.name}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{machine.tunnelUrl}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
