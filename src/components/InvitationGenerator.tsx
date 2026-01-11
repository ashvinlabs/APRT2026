'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Search, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Voter {
  id: string;
  name: string;
  nik: string;
  address: string;
  invitation_code: string;
}

function InvitationContent() {
  const searchParams = useSearchParams();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('nik') || '');
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchVoters();
    fetchConfig();
  }, []);

  async function fetchConfig() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'election_config').single();
    if (data?.value) setConfig(data.value);
  }

  async function fetchVoters() {
    setLoading(true);
    const { data, error } = await supabase
      .from('voters')
      .select('id, name, nik, address, invitation_code')
      .order('name', { ascending: true });

    if (!error) {
      setVoters(data || []);
    }
    setLoading(false);
  }

  const filteredVoters = voters.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.invitation_code?.toLowerCase().includes(search.toLowerCase()) ||
    v.nik?.toLowerCase().includes(search.toLowerCase()) ||
    v.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const getInvitationDate = () => {
    if (!config?.date) return '...';
    const date = new Date(config.date);
    date.setDate(date.getDate() - 7);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatElectionDate = () => {
    if (!config?.date) return '...';
    return new Date(config.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 no-print-bg">
      {/* Web UI Header */}
      <header className="no-print mb-8 flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cetak <span className="text-primary">Undangan</span></h1>
          <p className="text-slate-500 font-medium mt-1">Generate format A4 (3 per halaman) untuk undangan resmi.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-2xl h-14 px-8 font-black">
            Kembali
          </Button>
          <Button onClick={handlePrint} className="rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <Printer size={20} />
            Cetak {filteredVoters.length} Undangan
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="no-print mb-8">
        <div className="relative flex items-center group">
          <Search className="absolute left-6 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
          <Input
            placeholder="Cari nama atau NIK warga untuk dicetak..."
            className="pl-16 h-18 text-xl font-bold rounded-[1.5rem] border-none bg-white shadow-xl shadow-slate-200/40 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 no-print">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Menyiapkan Data...</p>
        </div>
      ) : (
        <>
          {/* Screen-only Preview List (Modern UI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            {filteredVoters.map((voter) => (
              <div key={voter.id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga Terdaftar</p>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{voter.name}</h3>
                    <p className="text-sm font-mono text-slate-500">{voter.nik || 'No NIK'}</p>
                    <p className="text-xs text-slate-400 italic mt-2">{voter.address || 'Alamat tidak tersedia'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary/20 transition-colors">
                    <QRCodeSVG value={voter.invitation_code} size={64} level="M" />
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tight">
                    {voter.invitation_code}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(voter.nik); setTimeout(window.print, 100); }} className="text-primary font-black hover:bg-primary/5 rounded-xl">
                    Cetak Kertas Ini
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Print-only Formal Layout */}
          <div className="print-area hidden-on-screen">
            {filteredVoters.map((voter) => (
              <div key={voter.id} className="invitation-page-segment">
                <div className="formal-invitation">
                  {/* Header Section */}
                  <div className="text-center mb-4">
                    <p className="text-[9pt] uppercase tracking-widest m-0">Panitia Pemilihan Umum RT 12</p>
                    <h2 className="text-[14pt] font-black my-1 uppercase">UNDANGAN PEMILIHAN KETUA RT 12</h2>
                    <p className="text-[10pt] font-bold m-0 italic">Pelem Kidul, Baturetno, Bantul</p>
                    <div className="mt-1 border-t border-black border-b-2 border-double h-1 shadow-[0_1px_0_0_black]" />
                  </div>

                  {/* Body Section */}
                  <div className="text-[10.5pt] leading-snug flex-1">
                    <p className="mb-2">
                      Dengan hormat, Kami mengundang Bapak/Ibu/Saudara/i untuk memilih ketua RT kita yang akan diadakan pada:
                    </p>

                    <div className="ml-4 mb-3 space-y-0.5">
                      <div className="flex"><span className="w-28 font-bold">Hari / Tanggal</span><span>: {formatElectionDate()}</span></div>
                      <div className="flex"><span className="w-28 font-bold">Tempat</span><span>: {config?.location_detail || config?.location || '...'}</span></div>
                      <div className="flex"><span className="w-28 font-bold">Waktu</span><span>: Jam {config?.start_time || '08:00'} - {config?.end_time || '11:00'} WIB</span></div>
                    </div>

                    <div className="border border-black p-3 flex justify-between items-center bg-white mb-3">
                      <div className="space-y-3">
                        <p className="text-[9.5pt] font-bold underline m-0">Kepada Yth,</p>
                        <div className="space-y-0.5">
                          <div className="flex"><span className="w-14">Nama</span><span className="font-bold">: {voter.name}</span></div>
                          <div className="flex"><span className="w-14">NIK</span><span>: {voter.nik || '-'}</span></div>
                          <div className="flex"><span className="w-14">Alamat</span><span>: <em className="text-[9pt]">{voter.address || '-'}</em></span></div>
                        </div>
                      </div>
                      <div className="text-center pl-3 border-l border-black/10">
                        <QRCodeSVG value={voter.invitation_code} size={100} level="M" />
                        <p className="font-mono text-[8pt] font-bold mt-1 uppercase leading-none">{voter.invitation_code}</p>
                      </div>
                    </div>

                    <p className="text-[9.5pt] text-justify leading-normal italic mb-4">
                      Dimohonkan kepada Bapak/Ibu/Saudara/i sekalian untuk membawa tanda pengenal berupa <strong>KTP</strong> dan juga <strong>undangan ini</strong> untuk dapat di-scan tanda hadirnya dan menerima surat suara.
                    </p>
                  </div>

                  {/* Footer Section */}
                  <div className="flex justify-between items-end mt-auto pt-2 border-t border-black/5">
                    <div className="text-[9.5pt] space-y-0 leading-tight">
                      <p>Demikian disampaikan dengan penuh hormat.</p>
                      <p>Terima kasih.</p>
                    </div>
                    <div className="text-center w-56">
                      <p className="text-[9.5pt]">Yogyakarta, {getInvitationDate()}</p>
                      <p className="text-[9.5pt] mb-14 leading-none">Hormat kami,</p>
                      <p className="text-[10.5pt] font-bold underline m-0 leading-none">Panitia Pemilihan Umum RT 12</p>
                      <p className="text-[9.5pt] m-0 leading-none">Pelem Kidul</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        @media screen {
          .invitation-page-segment { display: none; }
          .hidden-on-screen { display: none; }
          .no-print-bg { background-color: #f8fafc; }
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          
          .invitation-page-segment {
            height: 14.85cm; /* Half of A4 (29.7cm) */
            width: 21cm;
            padding: 1.2cm 2cm;
            box-sizing: border-box;
            border-bottom: 2px dashed #ccc;
            page-break-inside: avoid;
            background: white !important;
            display: block;
          }

          .invitation-page-segment:nth-child(2n) {
            page-break-after: always;
            border-bottom: none;
          }

          .formal-invitation {
            font-family: 'Times New Roman', serif;
            color: black;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvitationGenerator() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Components...</p>
      </div>
    }>
      <InvitationContent />
    </Suspense>
  );
}
