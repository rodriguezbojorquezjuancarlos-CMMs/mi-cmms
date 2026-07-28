// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function InventarioPage() {
  const [refacciones, setRefacciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("Todas")

  // Estados para el Modal de Nueva Pieza (Keys kept in Spanish for DB)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    numero_parte: "",
    categoria: "Mecánico",
    cantidad: 1,
    stock_minimo: 1,
    costo: 0,
    unidad_medida: "Pza"
  })

  // Métricas del almacén
  const [metricas, setMetricas] = useState({
    totalPiezas: 0,
    valorTotal: 0,
    bajoStock: 0,
    agotado: 0
  })

  // Dictionaries for visual translation without breaking DB inserts/queries
  const categoryMap: Record<string, string> = {
    'Mecánico': 'Mechanical',
    'Eléctrico': 'Electrical',
    'Neumático': 'Pneumatic',
    'Consumible': 'Consumable'
  }

  const uomMap: Record<string, string> = {
    'Pza': 'Pcs',
    'Kg': 'Kg',
    'Lts': 'L',
    'Mts': 'M'
  }

  useEffect(() => {
    cargarInventario()
  }, [])

  async function cargarInventario() {
    setCargando(true)
    const { data } = await supabase
      .from("refacciones")
      .select("*")
      .order("nombre", { ascending: true })

    if (data) {
      setRefacciones(data)
      
      // Calcular métricas
      let totalPzs = 0;
      let valor = 0;
      let bajo = 0;
      let cero = 0;

      data.forEach(item => {
        totalPzs += Number(item.cantidad || 0);
        valor += (Number(item.cantidad || 0) * Number(item.costo || 0));
        
        if (item.cantidad === 0) {
          cero++;
        } else if (item.cantidad <= item.stock_minimo) {
          bajo++;
        }
      });

      setMetricas({ totalPiezas: totalPzs, valorTotal: valor, bajoStock: bajo, agotado: cero })
    }
    setCargando(false)
  }

  async function guardarPieza(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    const { error } = await supabase.from("refacciones").insert([{
      nombre: form.nombre,
      numero_parte: form.numero_parte,
      categoria: form.categoria,
      cantidad: form.cantidad,
      stock_minimo: form.stock_minimo,
      costo: form.costo,
      unidad_medida: form.unidad_medida
    }])

    if (error) {
      alert("Error saving: " + error.message)
    } else {
      setMostrarModal(false)
      setForm({ nombre: "", numero_parte: "", categoria: "Mecánico", cantidad: 1, stock_minimo: 1, costo: 0, unidad_medida: "Pza" })
      cargarInventario()
    }
    setGuardando(false)
  }

  // Filtrado dinámico
  const refaccionesFiltradas = refacciones.filter(ref => {
    const coincideTexto = ref.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || ref.numero_parte?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "Todas" || ref.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria;
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER CORPORATIVO */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Inventory (Spare Parts)</h1>
            <p className="text-slate-400 text-sm mt-1">Spare parts management, consumables, and warehouse control</p>
          </div>
        </div>
        
        <button onClick={() => setMostrarModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Part
        </button>
      </div>

      {/* TIER 1: TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-600/10 border border-blue-500/30 p-5 rounded-2xl relative overflow-hidden">
          <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">Total Parts</p>
          <h3 className="text-3xl font-black text-white">{metricas.totalPiezas}</h3>
        </div>
        <div className="bg-emerald-600/10 border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden">
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">Estimated Value</p>
          <h3 className="text-3xl font-black text-white">${metricas.valorTotal.toLocaleString('en-US')}</h3>
        </div>
        <div className="bg-amber-600/10 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden">
          <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">Low Stock</p>
          <h3 className="text-3xl font-black text-white">{metricas.bajoStock}</h3>
        </div>
        <div className="bg-red-600/10 border border-red-500/30 p-5 rounded-2xl relative overflow-hidden">
          <p className="text-red-400 font-bold text-xs uppercase tracking-widest mb-2">Out of Stock</p>
          <h3 className="text-3xl font-black text-white">{metricas.agotado}</h3>
        </div>
      </div>

      {/* TIER 2: TABLA PRINCIPAL DE INVENTARIO */}
      <div className="bg-[#0B1121] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/30">
          <div className="relative w-full sm:w-96">
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search part number or description..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-700 pl-12 pr-4 py-3 rounded-xl text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
          <select 
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full sm:w-auto bg-[#070B14] border border-slate-700 px-6 py-3 rounded-xl text-slate-200 focus:border-blue-500 outline-none appearance-none cursor-pointer font-bold text-sm"
          >
            {/* The visual values are English, but the internal values remain Spanish for the filter logic */}
            <option value="Todas">All</option>
            <option value="Mecánico">Mechanical</option>
            <option value="Eléctrico">Electrical</option>
            <option value="Neumático">Pneumatic</option>
            <option value="Consumible">Consumable</option>
          </select>
        </div>

        {/* TABLA DE DATOS */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-5">Part Number</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5 text-center">Stock</th>
                <th className="px-6 py-5 text-center">UOM</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {cargando ? (
                <tr><td colSpan={6} className="p-12 text-center text-blue-400 animate-pulse font-bold">Loading inventory...</td></tr>
              ) : refaccionesFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No spare parts found.</td></tr>
              ) : (
                refaccionesFiltradas.map(ref => {
                  let estatusTexto = "In Stock";
                  let colorClase = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                  
                  if (ref.cantidad === 0) {
                    estatusTexto = "Out of Stock";
                    colorClase = "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse";
                  } else if (ref.cantidad <= ref.stock_minimo) {
                    estatusTexto = "Low Stock";
                    colorClase = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  }

                  return (
                    <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 font-mono font-bold text-blue-400">
                        {ref.numero_parte || `SP-${ref.id.toString().substring(0,6).toUpperCase()}`}
                      </td>
                      <td className="px-6 py-5 font-bold text-white max-w-[250px] truncate">{ref.nombre}</td>
                      <td className="px-6 py-5 text-slate-400">{categoryMap[ref.categoria] || ref.categoria || 'General'}</td>
                      <td className="px-6 py-5 text-center font-black text-white text-lg">{ref.cantidad}</td>
                      <td className="px-6 py-5 text-center text-slate-500 text-xs font-bold">{uomMap[ref.unidad_medida] || ref.unidad_medida || 'Pcs'}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${colorClase}`}>
                          {estatusTexto}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVA PIEZA */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-2xl w-full relative my-8">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-black text-white mb-6">Register New Spare Part</h2>
            
            <form onSubmit={guardarPieza} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Part Description</label>
                  <input required autoFocus value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="E.g. SKF 6205 Bearing" className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Part Number</label>
                  <input value={form.numero_parte} onChange={(e) => setForm({...form, numero_parte: e.target.value})} placeholder="E.g. SP-00123" className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none font-mono" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                  <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none cursor-pointer">
                    <option value="Mecánico" className="bg-slate-900">Mechanical</option>
                    <option value="Eléctrico" className="bg-slate-900">Electrical</option>
                    <option value="Neumático" className="bg-slate-900">Pneumatic</option>
                    <option value="Consumible" className="bg-slate-900">Consumable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Initial Quantity (Stock)</label>
                  <input type="number" required min="0" value={form.cantidad} onChange={(e) => setForm({...form, cantidad: parseInt(e.target.value)})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Minimum Stock (Alert)</label>
                  <input type="number" required min="1" value={form.stock_minimo} onChange={(e) => setForm({...form, stock_minimo: parseInt(e.target.value)})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none font-bold" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit Cost ($)</label>
                  <input type="number" step="0.01" value={form.costo} onChange={(e) => setForm({...form, costo: parseFloat(e.target.value)})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit of Measure</label>
                  <select value={form.unidad_medida} onChange={(e) => setForm({...form, unidad_medida: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none cursor-pointer">
                    <option value="Pza" className="bg-slate-900">Pcs (Pieces)</option>
                    <option value="Kg" className="bg-slate-900">Kg (Kilograms)</option>
                    <option value="Lts" className="bg-slate-900">L (Liters)</option>
                    <option value="Mts" className="bg-slate-900">M (Meters)</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={guardando} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 text-lg font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                {guardando ? "Registering in Warehouse..." : "Save Spare Part"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}