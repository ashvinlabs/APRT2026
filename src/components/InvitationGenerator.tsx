'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Search, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser } from './UserContext';
import { logActivity } from '@/lib/logger';

interface Voter {
  id: string;
  name: string;
  address: string;
  invitation_code: string;
}

function InvitationContent() {
  const { hasPermission } = useUser();
  const searchParams = useSearchParams();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('code') || '');
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [printMode, setPrintMode] = useState<'selected' | 'page'>('selected');
  const [itemsPerPage, setItemsPerPage] = useState(24);

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
      .select('id, name, address, invitation_code')
      .order('name', { ascending: true });

    if (!error) {
      setVoters(data || []);
      // Initially select all filtered voters or just all of them
      setSelectedIds(new Set((data || []).map(v => v.id)));
    }
    setLoading(false);
  }

  const filteredVoters = voters.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.invitation_code?.toLowerCase().includes(search.toLowerCase()) ||
    v.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = (mode: 'selected' | 'page') => {
    setPrintMode(mode);
    const count = mode === 'selected' ? selectedIds.size : paginatedVoters.length;
    logActivity('bulk_print_invitations', 'bulk_print_invitations', { count, mode });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Reset to page 1 on search or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVoters = filteredVoters.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVoters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVoters.map(v => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
          <p className="text-slate-500 font-medium mt-1">Generate format A4 (2 per halaman) untuk undangan resmi.</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('bulk_print_invitations') && (
            <Button variant="outline" onClick={toggleSelectAll} className="rounded-2xl h-14 px-8 font-black no-print">
              {selectedIds.size === filteredVoters.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-2xl h-14 px-8 font-black">
            Kembali
          </Button>
          {hasPermission('bulk_print_invitations') && (
            <>
              <Button
                onClick={() => handlePrint('selected')}
                disabled={selectedIds.size === 0}
                className="rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                <Printer size={20} />
                Cetak {selectedIds.size} Terpilih
              </Button>
              <Button
                onClick={() => handlePrint('page')}
                variant="outline"
                className="rounded-2xl h-14 px-8 font-black gap-2 border-primary text-primary hover:bg-primary/5"
              >
                <Printer size={20} />
                Cetak Hal. {currentPage}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <div className="no-print mb-8">
        <div className="relative flex items-center group">
          <Search className="absolute left-6 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
          <Input
            placeholder="Cari nama atau kode undangan untuk dicetak..."
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
            {paginatedVoters.map((voter) => (
              <div
                key={voter.id}
                onClick={() => toggleSelect(voter.id)}
                className={cn(
                  "bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border flex flex-col gap-4 group hover:scale-[1.02] transition-all cursor-pointer relative",
                  selectedIds.has(voter.id) ? "border-primary ring-2 ring-primary/20" : "border-slate-100"
                )}
              >
                {/* Checkbox Overlay */}
                <div className={cn(
                  "absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedIds.has(voter.id) ? "bg-primary border-primary" : "border-slate-200 bg-white"
                )}>
                  {selectedIds.has(voter.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>

                <div className="flex justify-between items-start gap-4 mr-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga Terdaftar</p>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{voter.name}</h3>
                    <p className="text-xs text-slate-400 italic mt-2">{voter.address || 'Alamat tidak tersedia'}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary/20 transition-colors">
                      <QRCodeSVG value={voter.invitation_code} size={64} level="M" />
                    </div>
                    <span className="text-[10px] font-mono font-black text-primary uppercase tracking-tighter">
                      {voter.invitation_code}
                    </span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tight">
                    {voter.invitation_code}
                  </span>
                  {hasPermission('print_invitation') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds(new Set([voter.id]));
                        logActivity('print_invitation', 'print_invitation', { voter_name: voter.name }, voter.id);
                        setTimeout(window.print, 100);
                      }}
                      className="text-primary font-black hover:bg-primary/5 rounded-xl"
                    >
                      Cetak Saja
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {!loading && filteredVoters.length > 0 && (
            <div className="mt-12 mb-20 py-8 border-t border-slate-200 no-print flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <p className="text-slate-500 font-bold text-sm">
                  Menampilkan <span className="text-slate-900">{startIndex + 1}</span> - <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredVoters.length)}</span> dari <span className="text-slate-900">{filteredVoters.length}</span> warga
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Items:</span>
                  {[12, 24, 48, 96].map(num => (
                    <button
                      key={num}
                      onClick={() => setItemsPerPage(num)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-black transition-all",
                        itemsPerPage === num
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="rounded-xl h-10 px-4 font-bold"
                  >
                    Sebelumnya
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={cn("w-10 h-10 rounded-xl font-black", currentPage === pageNum && "shadow-lg shadow-primary/20")}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-slate-300">...</span>;
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="rounded-xl h-10 px-4 font-bold"
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Print-only Formal Layout */}
          <div className="print-area hidden-on-screen">
            {(printMode === 'selected'
              ? filteredVoters.filter(v => selectedIds.has(v.id))
              : paginatedVoters
            ).map((voter) => (
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
                      Dengan hormat, Kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada:
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
                        <div className="detail-value">: Jam {config?.start_time || '08:00'} - selesai</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Acara</div>
                        <div className="detail-value">: <strong>Sarapan Bersama warga memilih Ketua RT 12</strong></div>
                      </div>
                    </div>

                    <div className="voter-box">
                      <div className="voter-text">
                        <p className="target-label">Kepada Yth,</p>
                        <div className="voter-data-grid">
                          <div className="voter-data-row">
                            <span className="v-label">Nama</span>
                            <span className="v-val">: <strong>{voter.name}</strong></span>
                          </div>
                          <div className="voter-data-row">
                            <span className="v-label">ID Reg</span>
                            <span className="v-val">: {voter.invitation_code}</span>
                          </div>
                          <div className="voter-data-row">
                            <span className="v-label">Alamat</span>
                            <span className="v-val">: <em>{voter.address || '-'}</em></span>
                          </div>
                        </div>
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
                      <p>Demikian disampaikan dengan penuh hormat.</p>
                      <p>Terima kasih.</p>
                    </div>
                    <div className="signature">
                      <p className="date-city">Yogyakarta, {getInvitationDate()}</p>
                      <p className="regards">Hormat kami,</p>
                      <div className="committee-box">
                        <p className="committee-name underline font-bold text-black border-none">Panitia Pemilihan Umum RT 12</p>
                        <p className="locality">Pelem Kidul</p>
                      </div>
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
          .invitation-page-segment {
            display: none !important;
          }
          .hidden-on-screen {
            display: none !important;
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
          margin-bottom: 0.4rem;
        }

        .institution {
          font-size: 9pt;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .main-title {
          font-size: 14pt;
          font-weight: 900;
          margin: 1px 0;
          line-height: 1.1;
        }

        .location-context {
          font-size: 10pt;
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
          font-size: 10pt;
        }

        .opening {
          margin: 0.3rem 0;
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
          border: 1px solid black;
          padding: 0.3cm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          margin: 0.4rem 0;
        }

        .target-label {
          font-size: 9pt;
          margin: 0 0 0.3rem 0;
          font-weight: bold;
          text-decoration: underline;
        }

        .voter-data-grid {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .voter-data-row {
            display: flex;
            font-size: 10pt;
        }

        .v-label {
            width: 60px;
        }

        .qr-container {
          text-align: center;
          padding-left: 0.5rem;
        }

        .qr-code-text {
          font-family: monospace;
          font-size: 8pt;
          font-weight: bold;
          margin: 2px 0 0 0;
        }

        .instruction {
          font-size: 8.5pt;
          text-align: justify;
          line-height: 1.2;
          margin: 0.3rem 0;
        }

        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 0.5rem;
        }

        .closing p {
            margin: 0;
            font-size: 10pt;
        }

        .signature {
          text-align: center;
          width: 250px;
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
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: white !important;
          }
          
          .no-print-bg {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: 0 !important;
          }

          .no-print {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .print-area {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .invitation-page-segment {
            height: 14.2cm; /* Even more conservative height to fit 2 per page including browser headers */
            width: 21cm;
            padding: 0.3cm 1.5cm;
            box-sizing: border-box;
            page-break-inside: avoid;
            background: white !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
            border-bottom: 1px dashed #eee; /* Light guide for cutting */
          }

          /* Cut line indicator between invitations */
          .invitation-page-segment:not(:nth-child(2n))::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-bottom: 1px dashed #ccc;
          }

          /* Explicitly force page break after every 2nd item */
          .invitation-page-segment:nth-child(2n) {
            page-break-after: always;
            border-bottom: none;
          }

          .formal-invitation {
            border: 2px solid black;
            padding: 0.6cm 0.8cm;
            height: 13.2cm; /* Fixed height for active content area */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            margin: 0 auto;
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
