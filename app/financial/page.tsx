// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Receipt, FileText, Download, Building2, CheckCircle2, X, UploadCloud, Tag, AlertTriangle, TrendingUp, ArrowUpRight, Trash2 } from 'lucide-react';

export default function FinancialDashboard() {
  const [cargando, setCargando] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);
  
  // ESTADOS DE DATOS REALES (Supabase)
  const [facturas, setFacturas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  
  // ESTADOS PARA EL MODAL DE SUBIDA
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nuevaFactura, setNuevaFactura] = useState({ 
    numero_factura: '', 
    proveedor: '', 
    nuevo_proveedor: '', 
    monto: '', 
    descripcion: '' 
  });

  // DATOS SIMULADOS (Solo para la vista de Inflación en el PoC)
  const inflationAlerts = [
    { item: 'Diamond Saw Blades 350mm', vendor: 'WoodTech', oldPrice: 120, newPrice: 145, increase: 20.8, status: 'critical' },
    { item: 'Carbide Router Bits (10-pack)', vendor: 'Global CNC', oldPrice: 85, newPrice: 92, increase: 8.2, status: 'warning' },
    { item: 'Edgebander Glue (20kg Sack)', vendor: 'WoodTech', oldPrice: 45, newPrice: 48, increase: 6.6, status: 'warning' },
  ];

  // CARGAR DATOS 100% REALES DE SUPABASE
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    // Cargar Proveedores
    const { data: dataProv } = await supabase.from('proveedores').select('*').order('nombre');
    if (dataProv) setProveedores(dataProv);

    // Cargar Facturas
    const { data: dataFact } = await supabase.from('facturas').select('*').order('fecha_creacion', { ascending: false });
    if (dataFact) setFacturas(dataFact);
    
    setCargando(false);
  }

  const handlePrint = () => {
    setImprimiendo(true);
    setTimeout(() => {
      window.print();
      setImprimiendo(false);
    }, 100);
  };

  // ACTUALIZAR ESTATUS EN VIVO
  const actualizarEstatus = async (id: string, nuevoEstatus: string) => {
    try {
      const { error } = await supabase
        .from('facturas')
        .update({ estatus: nuevoEstatus })
        .eq('id', id);

      if (error) throw error;
      setFacturas(facturas.map(f => f.id === id ? { ...f, estatus: nuevoEstatus } : f));
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    }
  };

  // 👇 NUEVA FUNCIÓN: BORRAR FACTURA 👇
  const borrarFactura = async (id: string) => {
    // Confirmación de seguridad
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('facturas').delete().eq('id', id);
      if (error) throw error;
      
      // Actualizamos la tabla en pantalla quitando la que acabamos de borrar
      setFacturas(facturas.filter(f => f.id !== id));
    } catch (error: any) {
      alert("Error deleting invoice: " + error.message);
    }
  };

  // SUBIR FACTURA A SUPABASE
  const subirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaFactura.numero_factura || !nuevaFactura.proveedor || !nuevaFactura.monto || !nuevaFactura.descripcion) {
      return alert("Please fill all fields.");
    }

    setGuardando(true);
    let proveedorFinal = nuevaFactura.proveedor;

    try {
      if (proveedorFinal === 'NEW_VENDOR') {
        if (!nuevaFactura.nuevo_proveedor) {
          setGuardando(false);
          return alert("Please enter the new vendor's name.");
        }
        proveedorFinal = nuevaFactura.nuevo_proveedor;
        
        const { error: errorProv } = await supabase.from('proveedores').insert([{ nombre: proveedorFinal }]);
        if (errorProv) console.error("Error saving vendor:", errorProv);
      }

      let publicUrl = null;
      if (archivo) {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `facturas/INV-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, archivo);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          publicUrl = data.publicUrl;
        }
      }

      const { error: errorFact } = await supabase.from('facturas').insert([{
        numero_factura: nuevaFactura.numero_factura,
        proveedor: proveedorFinal,
        descripcion: nuevaFactura.descripcion,
        monto: parseFloat(nuevaFactura.monto),
        estatus: 'Pending', 
        archivo_url: publicUrl
      }]);

      if (errorFact) throw errorFact;

      setModalAbierto(false);
      setNuevaFactura({ numero_factura: '', proveedor: '', nuevo_proveedor: '', monto: '', descripcion: '' });
      setArchivo(null);
      cargarDatos();

    } catch (error: any) {
      alert("Error uploading invoice: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // CÁLCULOS MATEMÁTICOS EN VIVO (Con datos reales)
  const gastoTotal = facturas.reduce((acc, curr) => acc + Number(curr.monto), 0);
  
  const facturasPendientesArr = facturas.filter(f => f.estatus === 'Pending' || f.estatus === 'Approved');
  const facturasPendientes = facturasPendientesArr.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const totalPendientes = facturasPendientesArr.length;

  const gastosPorProveedor = facturas.reduce((acc, factura) => {
    acc[factura.proveedor] = (acc[factura.proveedor] || 0) + Number(factura.monto);
    return acc;
  }, {});

  const topVendors = Object.keys(gastosPorProveedor)
    .map(key => ({ name: key, spend: gastosPorProveedor[key] }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5); 

  const gastoMaximo = topVendors.length > 0 ? topVendors[0].spend : 1;

  if (cargando) return <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-blue-500 font-bold animate-pulse">Loading Financial Data...</div>;

  return (
    <div className="min-h-screen bg-[#070b14] p-6 text-slate-200 font-sans print:bg-white print:text-black">
      
      {/* MODAL DE SUBIDA DE FACTURA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0b101a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#121826] sticky top-0 z-10">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Receipt size={18} className="text-blue-400" /> Upload New Invoice
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={subirFactura} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Invoice #</label>
                  <input type="text" required value={nuevaFactura.numero_factura} onChange={e => setNuevaFactura({...nuevaFactura, numero_factura: e.target.value})} placeholder="e.g. INV-9923" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input type="number" step="0.01" required value={nuevaFactura.monto} onChange={e => setNuevaFactura({...nuevaFactura, monto: e.target.value})} placeholder="0.00" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 pl-8 outline-none focus:border-blue-500 transition-colors font-mono" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vendor / Supplier</label>
                <select required value={nuevaFactura.proveedor} onChange={e => setNuevaFactura({...nuevaFactura, proveedor: e.target.value})} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors appearance-none">
                  <option value="">Select Vendor...</option>
                  {proveedores.map(prov => (
                    <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                  ))}
                  <option value="NEW_VENDOR" className="font-bold text-blue-400">+ Add New Vendor...</option>
                </select>
              </div>

              {nuevaFactura.proveedor === 'NEW_VENDOR' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">New Vendor Name</label>
                  <input type="text" required value={nuevaFactura.nuevo_proveedor} onChange={e => setNuevaFactura({...nuevaFactura, nuevo_proveedor: e.target.value})} placeholder="Type company name..." className="w-full bg-[#070b14] border border-blue-500/50 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} /> Items / Description
                </label>
                <textarea required value={nuevaFactura.descripcion} onChange={e => setNuevaFactura({...nuevaFactura, descripcion: e.target.value})} placeholder="What did we buy?" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors resize-none min-h-[80px]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Attach PDF / Photo</label>
                <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-[#070b14] hover:bg-blue-500/5 transition-all rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer group">
                  <UploadCloud className="text-slate-500 group-hover:text-blue-400 mb-2" size={24} />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">{archivo ? archivo.name : 'Click to browse files'}</span>
                  <span className="text-xs text-slate-500">PDF, JPG or PNG (Max 5MB)</span>
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => setArchivo(e.target.files ? e.target.files[0] : null)} />
                </label>
              </div>

              <button type="submit" disabled={guardando} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black tracking-widest py-4 rounded-xl flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all">
                {guardando ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileText size={18} />}
                {guardando ? 'PROCESSING...' : 'UPLOAD INVOICE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end border-b border-slate-800 pb-6 print:border-black">
          <div>
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-medium print:hidden">
              <span className="text-blue-500 font-bold">Management Tools</span>
              <span>›</span>
              <span>Financial Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 print:text-black">
              Vendor Cost & Expense Tracking
            </h1>
          </div>
          <button onClick={handlePrint} className="print:hidden bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg">
            <Download size={18} /> Export Report
          </button>
        </div>

        {/* 4 KPIs PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl print:border-slate-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">YTD Total Spend</h3>
              <DollarSign className="text-blue-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white print:text-black">${gastoTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight size={14} /> Tracking active
            </p>
          </div>
          
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl print:border-slate-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Awaiting Payment</h3>
              <Receipt className="text-amber-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white print:text-black">${facturasPendientes.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{totalPendientes} Invoices pending/approved</p>
          </div>

          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl print:border-slate-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Registered Vendors</h3>
              <Building2 className="text-emerald-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white print:text-black">{proveedores.length}</p>
            <p className="text-xs text-emerald-400 mt-2 font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Active accounts</p>
          </div>

          <div className="bg-[#121826] border border-rose-900/30 p-5 rounded-2xl shadow-xl print:border-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest">Highest Inflation</h3>
              <AlertTriangle className="text-rose-500 w-5 h-5" />
            </div>
            <p className="text-xl font-black text-white leading-tight print:text-black relative z-10 mt-1">Saw Blades</p>
            <p className="text-xs text-rose-400 mt-2 font-black relative z-10">+20.8% Price Hike detected</p>
          </div>
        </div>

        {/* 2 COLUMNAS (PROVEEDORES E INFLACIÓN) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121826] border border-slate-800 rounded-2xl p-6 shadow-xl print:border-slate-300">
            <h2 className="text-white font-bold mb-6 print:text-black">Highest Spend by Vendor</h2>
            {topVendors.length === 0 ? (
              <p className="text-slate-500 text-sm">No expenses registered yet. Upload an invoice to generate analytics.</p>
            ) : (
              <div className="space-y-6">
                {topVendors.map((vendor, i) => {
                  const porcentaje = (vendor.spend / gastoMaximo) * 100;
                  const colores = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-300 print:text-black">{vendor.name}</span>
                        <span className="font-bold text-white print:text-black">${vendor.spend.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="w-full bg-slate-800/50 rounded-full h-3 print:bg-slate-200">
                        <div className={`${colores[i % colores.length]} h-3 rounded-full transition-all duration-1000`} style={{ width: `${porcentaje}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-2xl p-6 shadow-xl print:border-slate-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-bold print:text-black">Consumables Price Watch</h2>
              <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-rose-500/20">Market Alerts</span>
            </div>
            <div className="space-y-4">
              {inflationAlerts.map((alert, i) => (
                <div key={i} className="bg-[#0b101a] border border-slate-800 p-4 rounded-xl flex items-center justify-between print:border-slate-300 print:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-white print:text-black">{alert.item}</p>
                    <p className="text-xs text-slate-500">{alert.vendor}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-xs text-slate-400 line-through">${alert.oldPrice}</span>
                      <span className="text-sm font-black text-rose-400">${alert.newPrice}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded flex items-center gap-1 w-max ml-auto">
                      <TrendingUp size={10} /> +{alert.increase}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABLA DE INVOICES CON BOTÓN DE ELIMINAR */}
        <div className="bg-[#121826] border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-slate-300">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0b101a] print:bg-white print:border-slate-300">
            <h2 className="text-white font-bold print:text-black">Invoice History</h2>
            <button onClick={() => setModalAbierto(true)} className="print:hidden text-xs bg-slate-800 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors shadow-lg">
              + Upload Invoice
            </button>
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#121826] border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500 print:bg-slate-100 print:border-slate-300">
                  <th className="p-4 font-bold">Invoice #</th>
                  <th className="p-4 font-bold">Vendor</th>
                  <th className="p-4 font-bold">Items / Description</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right print:hidden">Document & Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">No invoices uploaded yet. Click "+ Upload Invoice" to add your first expense.</td>
                  </tr>
                ) : (
                  facturas.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors print:border-slate-200">
                      <td className="p-4 font-mono font-bold text-slate-300 print:text-black">{inv.numero_factura}</td>
                      <td className="p-4 text-slate-300 font-medium print:text-black">{inv.proveedor}</td>
                      <td className="p-4 text-white print:text-black max-w-xs truncate" title={inv.descripcion}>{inv.descripcion}</td>
                      <td className="p-4 text-slate-400">{new Date(inv.fecha_creacion).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td className="p-4 font-bold text-white print:text-black">${Number(inv.monto).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      
                      <td className="p-4">
                        <select 
                          value={inv.estatus}
                          onChange={(e) => actualizarEstatus(inv.id, e.target.value)}
                          className={`px-2 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer appearance-none ${
                            inv.estatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            inv.estatus === 'Approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                            inv.estatus === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="Pending" className="bg-slate-900 text-amber-400">PENDING</option>
                          <option value="Approved" className="bg-slate-900 text-blue-400">APPROVED</option>
                          <option value="Paid" className="bg-slate-900 text-emerald-400">PAID</option>
                          <option value="Rejected" className="bg-slate-900 text-rose-400">REJECTED</option>
                        </select>
                      </td>

                      <td className="p-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-3">
                          {inv.archivo_url ? (
                            <a href={inv.archivo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded border border-blue-500/20">
                              <FileText size={14} /> PDF
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mr-1">No File</span>
                          )}
                          
                          <button 
                            onClick={() => borrarFactura(inv.id)}
                            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}