// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Receipt, FileText, Download, Building2, CheckCircle2, X, UploadCloud, Tag, AlertTriangle, TrendingUp, ArrowUpRight, Trash2, Plus, Minus } from 'lucide-react';

export default function FinancialDashboard() {
  const [cargando, setCargando] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);
  
  const [facturas, setFacturas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  
  const [nuevaFactura, setNuevaFactura] = useState({ 
    numero_factura: '', 
    proveedor: '', 
    nuevo_proveedor: ''
  });

  // 👇 AHORA CADA ARTÍCULO LLEVA SU UNIDAD DE MEDIDA 👇
  const [articulos, setArticulos] = useState([
    { descripcion: '', cantidad: 1, precio_unitario: '', unidad_medida: 'Pza' }
  ]);

  const inflationAlerts = [
    { item: 'Diamond Saw Blades 350mm', vendor: 'WoodTech', oldPrice: 120, newPrice: 145, increase: 20.8, status: 'critical' },
    { item: 'Carbide Router Bits (10-pack)', vendor: 'Global CNC', oldPrice: 85, newPrice: 92, increase: 8.2, status: 'warning' },
    { item: 'Edgebander Glue (20kg Sack)', vendor: 'WoodTech', oldPrice: 45, newPrice: 48, increase: 6.6, status: 'warning' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const { data: dataProv } = await supabase.from('proveedores').select('*').order('nombre');
    if (dataProv) setProveedores(dataProv);

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

  const abrirModalFactura = () => {
    const folioAutomatico = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    setNuevaFactura({ numero_factura: folioAutomatico, proveedor: '', nuevo_proveedor: '' });
    setArticulos([{ descripcion: '', cantidad: 1, precio_unitario: '', unidad_medida: 'Pza' }]);
    setArchivo(null);
    setModalAbierto(true);
  };

  const agregarFila = () => setArticulos([...articulos, { descripcion: '', cantidad: 1, precio_unitario: '', unidad_medida: 'Pza' }]);
  const removerFila = (index: number) => setArticulos(articulos.filter((_, i) => i !== index));
  
  const actualizarFila = (index: number, campo: string, valor: any) => {
    const nuevosArticulos = [...articulos];
    nuevosArticulos[index][campo] = valor;
    setArticulos(nuevosArticulos);
  };

  const montoTotalCalculado = articulos.reduce((total, art) => total + (Number(art.cantidad) * Number(art.precio_unitario)), 0);

  const actualizarInventarioDesdeFactura = async (articulosFactura: any[]) => {
    try {
      for (const articulo of articulosFactura) {
        const nombreArticulo = articulo.descripcion;
        const cantidadComprada = Number(articulo.cantidad) || 1;
        const precioUnitario = Number(articulo.precio_unitario) || 0;
        const unidadMedida = articulo.unidad_medida || 'Pza'; // 👈 Toma la unidad de medida

        if (!nombreArticulo) continue;

        const { data: refaccionExistente } = await supabase
          .from('refacciones')
          .select('id, cantidad, nombre')
          .ilike('nombre', `%${nombreArticulo}%`)
          .limit(1)
          .maybeSingle();

        if (refaccionExistente) {
          const nuevoStock = Number(refaccionExistente.cantidad) + cantidadComprada;
          const { error: updateError } = await supabase
            .from('refacciones')
            .update({ cantidad: nuevoStock, costo: precioUnitario })
            .eq('id', refaccionExistente.id);
            
          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await supabase
            .from('refacciones')
            .insert([{
              nombre: nombreArticulo,
              numero_parte: `AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
              categoria: 'Consumible',
              cantidad: cantidadComprada,
              stock_minimo: 1,
              costo: precioUnitario,
              unidad_medida: unidadMedida // 👈 La manda directa al inventario
            }]);
            
          if (insertError) throw new Error(insertError.message);
        }
      }
      alert("✅ Stock updated! Exact quantities and UOM have been added to the warehouse.");
    } catch (error: any) {
      console.error("❌ Error updating inventory:", error.message);
      alert(`Warning: Invoice paid, but inventory failed. Reason: ${error.message}`);
    }
  };

  const actualizarEstatus = async (factura: any, nuevoEstatus: string) => {
    try {
      const { error } = await supabase
        .from('facturas')
        .update({ estatus: nuevoEstatus })
        .eq('id', factura.id);

      if (error) throw error;
      
      setFacturas(facturas.map(f => f.id === factura.id ? { ...f, estatus: nuevoEstatus } : f));

      if (nuevoEstatus === 'Paid' && factura.estatus !== 'Paid') {
        let articulosAProcesar = [];
        try {
          articulosAProcesar = JSON.parse(factura.descripcion);
        } catch(e) {
          articulosAProcesar = [{ descripcion: factura.descripcion, cantidad: 1, precio_unitario: factura.monto, unidad_medida: 'Pza' }];
        }
        await actualizarInventarioDesdeFactura(articulosAProcesar);
      }
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    }
  };

  const borrarFactura = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const { error } = await supabase.from('facturas').delete().eq('id', id);
      if (error) throw error;
      setFacturas(facturas.filter(f => f.id !== id));
    } catch (error: any) {
      alert("Error deleting invoice: " + error.message);
    }
  };

  const subirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hayArticulosVacios = articulos.some(a => !a.descripcion || !a.precio_unitario);
    if (!nuevaFactura.proveedor || hayArticulosVacios) {
      return alert("Please fill all vendor and item fields.");
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
        await supabase.from('proveedores').insert([{ nombre: proveedorFinal }]);
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
        descripcion: JSON.stringify(articulos), 
        monto: montoTotalCalculado, 
        estatus: 'Pending', 
        archivo_url: publicUrl
      }]);

      if (errorFact) throw errorFact;

      setModalAbierto(false);
      cargarDatos();

    } catch (error: any) {
      alert("Error uploading invoice: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const renderizarDescripcion = (descTexto: string) => {
    try {
      const arr = JSON.parse(descTexto);
      return arr.map((a: any) => `${a.cantidad}${a.unidad_medida === 'Pza' ? 'x' : a.unidad_medida} ${a.descripcion}`).join(', ');
    } catch(e) {
      return descTexto; 
    }
  };

  const gastoTotal = facturas.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const facturasPendientesArr = facturas.filter(f => f.estatus === 'Pending' || f.estatus === 'Approved');
  const facturasPendientes = facturasPendientesArr.reduce((acc, curr) => acc + Number(curr.monto), 0);
  
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
      
      {modalAbierto && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0b101a] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#121826] sticky top-0 z-10">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Receipt size={18} className="text-blue-400" /> Upload Itemized Invoice
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={subirFactura} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Invoice #</label>
                  <input type="text" readOnly value={nuevaFactura.numero_factura} className="w-full bg-[#121826] border border-slate-800 text-slate-400 rounded-lg p-3 outline-none cursor-not-allowed font-mono font-bold" />
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
              </div>

              {nuevaFactura.proveedor === 'NEW_VENDOR' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">New Vendor Name</label>
                  <input type="text" required value={nuevaFactura.nuevo_proveedor} onChange={e => setNuevaFactura({...nuevaFactura, nuevo_proveedor: e.target.value})} placeholder="Type company name..." className="w-full bg-[#070b14] border border-blue-500/50 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
              )}

              <div className="border border-slate-800 rounded-xl p-4 bg-[#121826]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Tag size={12} /> Line Items</span>
                  <button type="button" onClick={agregarFila} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                    <Plus size={14} /> Add Row
                  </button>
                </label>

                <div className="space-y-3">
                  {articulos.map((articulo, index) => (
                    <div key={index} className="flex gap-2 items-start animate-in slide-in-from-top-1">
                      <div className="flex-1">
                        <input required type="text" placeholder="Part Name / Description" value={articulo.descripcion} onChange={e => actualizarFila(index, 'descripcion', e.target.value)} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm" />
                      </div>
                      <div className="w-20">
                        <input required type="number" min="1" placeholder="Qty" value={articulo.cantidad} onChange={e => actualizarFila(index, 'cantidad', e.target.value)} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm text-center" />
                      </div>
                      
                      {/* 👇 NUEVO SELECTOR DE UNIDAD DE MEDIDA 👇 */}
                      <div className="w-24">
                        <select value={articulo.unidad_medida} onChange={e => actualizarFila(index, 'unidad_medida', e.target.value)} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer">
                          <option value="Pza">Pcs</option>
                          <option value="Kg">Kg</option>
                          <option value="Lts">Lts</option>
                          <option value="Mts">Mts</option>
                        </select>
                      </div>

                      <div className="w-28 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input required type="number" step="0.01" placeholder="0.00" value={articulo.precio_unitario} onChange={e => actualizarFila(index, 'precio_unitario', e.target.value)} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-2.5 pl-6 outline-none focus:border-blue-500 text-sm" />
                      </div>
                      {articulos.length > 1 && (
                        <button type="button" onClick={() => removerFila(index)} className="p-2.5 text-slate-500 hover:text-rose-400 bg-[#070b14] border border-slate-700 rounded-lg hover:border-rose-500/50 transition-colors">
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount:</span>
                  <span className="text-xl font-black text-emerald-400">${montoTotalCalculado.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Attach PDF / Photo</label>
                <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-[#070b14] hover:bg-blue-500/5 transition-all rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer group">
                  <UploadCloud className="text-slate-500 group-hover:text-blue-400 mb-2" size={24} />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">{archivo ? archivo.name : 'Click to browse files'}</span>
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
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 print:text-black">
              Vendor Cost & Expense Tracking
            </h1>
          </div>
          <button onClick={handlePrint} className="print:hidden bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg">
            <Download size={18} /> Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-2"><h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">YTD Total Spend</h3><DollarSign className="text-blue-400 w-5 h-5" /></div>
            <p className="text-3xl font-black text-white">${gastoTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-2"><h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Awaiting Payment</h3><Receipt className="text-amber-400 w-5 h-5" /></div>
            <p className="text-3xl font-black text-white">${facturasPendientes.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-2"><h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Registered Vendors</h3><Building2 className="text-emerald-400 w-5 h-5" /></div>
            <p className="text-3xl font-black text-white">{proveedores.length}</p>
          </div>
          <div className="bg-[#121826] border border-rose-900/30 p-5 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full"></div>
            <div className="flex justify-between items-start mb-2 relative z-10"><h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest">Highest Inflation</h3><AlertTriangle className="text-rose-500 w-5 h-5" /></div>
            <p className="text-xl font-black text-white relative z-10 mt-1">Saw Blades</p>
          </div>
        </div>

        {/* 👇 AQUÍ RESTAURAMOS LA SECCIÓN DE GRÁFICAS DE INFLACIÓN Y PROVEEDORES 👇 */}
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

        {/* TABLA DE INVOICES CON DESCRIPCIÓN DESEMPAQUETADA */}
        <div className="bg-[#121826] border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-slate-300">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0b101a] print:bg-white print:border-slate-300">
            <h2 className="text-white font-bold print:text-black">Invoice History</h2>
            <button onClick={abrirModalFactura} className="print:hidden text-xs bg-slate-800 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors shadow-lg">
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
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right print:hidden">Document & Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {facturas.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No invoices uploaded yet.</td></tr>
                ) : (
                  facturas.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-300">{inv.numero_factura}</td>
                      <td className="p-4 text-slate-300 font-medium">{inv.proveedor}</td>
                      <td className="p-4 text-emerald-400 font-medium max-w-xs truncate" title={renderizarDescripcion(inv.descripcion)}>
                        {renderizarDescripcion(inv.descripcion)}
                      </td>
                      <td className="p-4 text-slate-400">{new Date(inv.fecha_creacion).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</td>
                      <td className="p-4 font-bold text-white">${Number(inv.monto).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      
                      <td className="p-4">
                        <select 
                          value={inv.estatus}
                          onChange={(e) => actualizarEstatus(inv, e.target.value)}
                          className={`px-2 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer appearance-none ${
                            inv.estatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            inv.estatus === 'Approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="Pending" className="bg-slate-900 text-amber-400">PENDING</option>
                          <option value="Approved" className="bg-slate-900 text-blue-400">APPROVED</option>
                          <option value="Paid" className="bg-slate-900 text-emerald-400">PAID</option>
                        </select>
                      </td>

                      <td className="p-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-3">
                          {inv.archivo_url && (
                            <a href={inv.archivo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded border border-blue-500/20">
                              <FileText size={14} /> PDF
                            </a>
                          )}
                          <button onClick={() => borrarFactura(inv.id)} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-colors"><Trash2 size={16} /></button>
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