'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Search, Loader2 } from 'lucide-react';

interface Voter {
  id: string;
  name: string;
  nik: string;
  address: string;
  invitation_code: string;
}

export default function InvitationGenerator() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchVoters();
  }, []);

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
    v.invitation_code?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return (
    <div style={{ padding: '2rem' }}>
      <header className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="heading-m">Generator Undangan QR</h1>
          <p style={{ color: 'var(--secondary)' }}>Cetak QR Code untuk setiap warga sebagai tiket masuk TPS.</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} style={{ gap: '0.5rem' }}>
          <Printer size={20} />
          <span>Cetak Semua</span>
        </button>
      </header>

      <div className="card no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: '1rem', color: 'var(--secondary)' }} size={20} />
          <input
            type="text"
            placeholder="Cari warga untuk dicetak..."
            className="text-senior"
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : (
        <div className="print-grid">
          {filteredVoters.map((voter) => (
            <div key={voter.id} className="invitation-card">
              <div className="invitation-header">
                <h3>UNDANGAN PEMILIHAN RT 12</h3>
                <p>Pelem Kidul, Baturetno</p>
              </div>

              <div className="invitation-body">
                <div className="voter-info">
                  <p className="label">Nama Pemilih:</p>
                  <p className="name">{voter.name}</p>
                  <p className="nik">NIK: {voter.nik || '-'}</p>
                  <p className="address">{voter.address}</p>
                </div>

                <div className="qr-box">
                  <QRCodeSVG
                    value={voter.invitation_code}
                    size={100}
                    level="H"
                    includeMargin={false}
                  />
                  <p className="code">{voter.invitation_code}</p>
                </div>
              </div>

              <div className="invitation-footer">
                <p>Bawa undangan ini pada hari pemilihan.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .print-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .invitation-card {
          border: 2px solid #000;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          break-inside: avoid;
        }

        .invitation-header {
          text-align: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5rem;
        }

        .invitation-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
        }

        .invitation-header p {
          margin: 0;
          font-size: 0.75rem;
          color: #666;
        }

        .invitation-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .voter-info .label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .voter-info .name {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0;
        }

        .voter-info .nik {
          font-size: 0.8125rem;
          font-family: monospace;
          margin: 0.125rem 0;
          color: #555;
        }

        .voter-info .address {
          font-size: 0.8125rem;
          color: #444;
          margin: 0;
        }

        .qr-box {
          text-align: center;
        }

        .qr-box .code {
          font-family: monospace;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-weight: bold;
        }

        .invitation-footer {
          text-align: center;
          font-size: 0.7rem;
          font-style: italic;
          color: #888;
          border-top: 1px solid #eee;
          padding-top: 0.5rem;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1cm;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
