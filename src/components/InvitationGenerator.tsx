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
        <div className="print-area">
          {filteredVoters.map((voter) => (
            <div key={voter.id} className="invitation-page-segment">
              <div className="formal-invitation">
                {/* Header Section */}
                <div className="header-section">
                  <p className="institution">Panitia Pemilihan Umum RT 12</p>
                  <h2 className="main-title">UNDANGAN PEMILIHAN KETUA RT 12</h2>
                  <p className="location-context">Pelem Kidul, Baturetno, Bantul</p>
                  <div className="separator" />
                </div>

                {/* Body Section */}
                <div className="body-section">
                  <p className="opening">
                    Dengan hormat, Kami mengundang Bapak/Ibu/Saudara/i untuk memilih ketua RT kita yang akan diadakan pada:
                  </p>

                  <div className="details-table">
                    <div className="detail-row">
                      <div className="detail-label">Hari / Tanggal</div>
                      <div className="detail-value">: {formatElectionDate()}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Tempat</div>
                      <div className="detail-value">: {config?.location_detail || config?.location || '...'}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Waktu</div>
                      <div className="detail-value">: Jam {config?.start_time || '08:00'} - {config?.end_time || '12:00'} WIB</div>
                    </div>
                  </div>

                  <div className="voter-box">
                    <div className="voter-text">
                      <p className="target-label">Kepada Yth:</p>
                      <p className="voter-name">{voter.name}</p>
                      <p className="voter-nik">{voter.nik || 'NIK tidak terdaftar'}</p>
                      <p className="voter-address">{voter.address || 'Alamat tidak tersedia'}</p>
                    </div>
                    <div className="qr-container">
                      <QRCodeSVG value={voter.invitation_code} size={90} level="M" includeMargin={false} />
                      <p className="qr-code-text">{voter.invitation_code}</p>
                    </div>
                  </div>

                  <p className="instruction">
                    Dimohonkan kepada Bapak/Ibu/Saudara/i sekalian untuk membawa tanda pengenal berupa <strong>KTP</strong> dan juga <strong>undangan ini</strong> untuk dapat di-scan tanda hadirnya dan menerima surat suara.
                  </p>
                </div>

                {/* Footer Section */}
                <div className="footer-section">
                  <div className="closing">
                    <p>Demikian disampaikan dengan penuh hormat. <br /> Terima kasih.</p>
                  </div>
                  <div className="signature">
                    <p className="date-city">Yogyakarta, {getInvitationDate()}</p>
                    <p className="regards">Hormat kami,</p>
                    <div className="committee-box">
                      <p className="committee-name">Panitia Pemilihan Umum RT 12</p>
                      <p className="locality">Pelem Kidul</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @media screen {
          .invitation-page-segment {
            background: white;
            border: 1px solid #e2e8f0;
            margin-bottom: 2rem;
            padding: 1.5cm;
            border-radius: 2rem;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
            max-width: 21cm;
            margin-left: auto;
            margin-right: auto;
          }
          .no-print-bg { background-color: #f8fafc; }
        }

        .formal-invitation {
          font-family: 'Times New Roman', serif;
          color: black;
          line-height: 1.3;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .header-section {
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .institution {
          font-size: 10pt;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .main-title {
          font-size: 15pt;
          font-weight: 900;
          margin: 2px 0;
          line-height: 1.1;
        }

        .location-context {
          font-size: 11pt;
          margin: 0;
          font-weight: bold;
        }

        .separator {
          height: 1px;
          background: black;
          margin-top: 5px;
          border-bottom: 3px double black;
          padding-bottom: 1px;
        }

        .body-section {
          font-size: 11pt;
        }

        .opening {
          margin: 0.5rem 0;
        }

        .details-table {
          margin: 0.5rem 0 0.5rem 1rem;
        }

        .detail-row {
          display: flex;
          margin-bottom: 2px;
        }

        .detail-label {
          width: 100px;
          font-weight: bold;
        }

        .voter-box {
          border: 1.5px solid black;
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fdfdfd;
          margin: 0.5rem 0;
        }

        .target-label {
          font-size: 9pt;
          margin: 0;
          font-weight: bold;
          text-decoration: underline;
        }

        .voter-name {
          font-size: 13pt;
          font-weight: 900;
          margin: 2px 0;
          text-transform: uppercase;
        }

        .voter-nik {
          font-family: monospace;
          font-size: 10pt;
          margin: 0;
        }

        .voter-address {
          font-size: 9pt;
          margin: 0;
          font-style: italic;
        }

        .qr-container {
          text-align: center;
          padding-left: 1rem;
          border-left: 1px dashed #ccc;
        }

        .qr-code-text {
          font-family: monospace;
          font-size: 8pt;
          font-weight: bold;
          margin: 4px 0 0 0;
        }

        .instruction {
          font-size: 9pt;
          text-align: justify;
          line-height: 1.25;
          margin: 0.5rem 0;
        }

        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .closing p {
            margin: 0;
            font-size: 10pt;
        }

        .signature {
          text-align: center;
          width: 200px;
        }

        .signature p {
          margin: 0;
          font-size: 10pt;
        }

        .regards {
          margin-bottom: 1.5rem !important;
        }

        .committee-box {
            margin-top: 2rem;
        }

        .committee-name {
          font-weight: bold;
          text-decoration: underline;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
            background: white !important;
          }

          .invitation-page-segment {
            height: 9.9cm; /* 29.7cm / 3 */
            width: 21cm;
            padding: 0.8cm 1.5cm;
            box-sizing: border-box;
            border-bottom: 1px dashed #bbb;
            page-break-inside: avoid;
            background: white !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .voter-box {
            background: transparent !important;
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
