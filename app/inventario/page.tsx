// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function InventarioPage() {
  const [refacciones, setRefacciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("Todas")

  // Estados para el Modal de Nueva/Editar Pieza
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null) // 🟢 NUEVO: Para saber si estamos editando
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    numero_parte: "",
    categoria: "Mecánico",
    cantidad: 1,
    stock_minimo: 1,
    costo: 0,
    unidad_medida: "Pza",
    maquina_asignada: "General" 
  })

  // Estado para el Historial de Transacciones / Auditoría de Kiosco
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [historialConsumos, setHistorialConsumos] = useState<any[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  // Métricas del almacén
  const [metricas, setMetricas] = useState({
    totalPiezas: 0,
    valorTotal: 0,
    bajoStock: 0,
    agotado: 0
  })

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

  async function cargarHistorial() {
    setMostrarHistorial(true)
    setCargandoHistorial(true)
    
    const { data, error } = await supabase
      .from("historial_consumos")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(50)

    if (data) {
      setHistorialConsumos(data)
    }
    setCargandoHistorial(false)
  }

  // 🟢 NUEVO: PREPARAR MODAL PARA NUEVA PIEZA
  const abrirModalNuevo = () => {
    setEditandoId(null)
    setForm({ nombre: "", numero_parte: "", categoria: "Mecánico", cantidad: 1, stock_minimo: 1, costo: 0, unidad_medida: "Pza", maquina_asignada: "General" })
    setMostrarModal(true)
  }

  // 🟢 NUEVO: PREPARAR MODAL PARA EDITAR PIEZA
  const abrirModalEditar = (pieza: any) => {
    setEditandoId(pieza.id)
    setForm({
      nombre: pieza.nombre,
      numero_parte: pieza.numero_parte,
      categoria: pieza.categoria,
      cantidad: pieza.cantidad,
      stock_minimo: pieza.stock_minimo,
      costo: pieza.costo,
      unidad_medida: pieza.unidad_medida,
      maquina_asignada: pieza.maquina_asignada || "General"
    })
    setMostrarModal(true)
  }

  // 🟢 NUEVO: ELIMINAR PIEZA
  const eliminarPieza = async (id: string) => {
    const confirmar = window.confirm("Are you sure you want to delete this part? This action cannot be undone.")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from("refacciones")
        .delete()
        .eq("id", id)

      if (error) throw error
      cargarInventario()
    } catch (err: any) {
      alert("Error deleting part: " + err.message)
    }
  }

  // 🟢 ACTUALIZADO: GUARDAR O ACTUALIZAR PIEZA
  async function guardarPieza(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    try {
      if (editandoId) {
        // ACTUALIZAR EXISTENTE
        const { error } = await supabase.from("refacciones").update({
          nombre: form.nombre,
          numero_parte: form.numero_parte,
          categoria: form.categoria,
          cantidad: form.cantidad,
          stock_minimo: form.stock_minimo,
          costo: form.costo,
          unidad_medida: form.unidad_medida,
          maquina_asignada: form.maquina_asignada
        }).eq("id", editandoId)

        if (error) throw error
      } else {
        // INSERTAR NUEVA
        const { error } = await supabase.from("refacciones").insert([{
          nombre: form.nombre,
          numero_parte: form.numero_parte,
          categoria: form.categoria,
          cantidad: form.cantidad,
          stock_minimo: form.stock_minimo,
          costo: form.costo,
          unidad_medida: form.unidad_medida,
          maquina_asignada: form.maquina_asignada
        }])

        if (error) throw error
      }

      setMostrarModal(false)
      setEditandoId(null)
      setForm({ nombre: "", numero_parte: "", categoria: "Mecánico", cantidad: 1, stock_minimo: 1, costo: 0, unidad_medida: "Pza", maquina_asignada: "General" })
      cargarInventario()
    } catch (error: any) {
      alert("Error saving: " + error.message)
    } finally {
      setGuardando(false)
    }
  }

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
        
        <div className="flex items-center gap-3">
          <button onClick={cargarHistorial} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Usage Log
          </button>

          <button onClick={abrirModalNuevo} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New Part
          </button>
        </div>
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
        
        {/* BARRA DE HERRAMIENTAS */}
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
            <option value="Todas">All Categories</option>
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
                <th className="px-6 py-5">Category / Machine</th>
                <th className="px-6 py-5 text-center">Stock / Min</th>
                <th className="px-6 py-5 text-center">UOM</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {cargando ? (
                <tr><td colSpan={7} className="p-12 text-center text-blue-400 animate-pulse font-bold">Loading inventory...</td></tr>
              ) : refaccionesFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500">No spare parts found.</td></tr>
              ) : (
                refaccionesFiltradas.map(ref => {
                  let estatusTexto = "In Stock";
                  let colorClase = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                  let stockCritico = ref.cantidad <= ref.stock_minimo;
                  
                  if (ref.cantidad === 0) {
                    estatusTexto = "Out of Stock";
                    colorClase = "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse";
                  } else if (stockCritico) {
                    estatusTexto = "Low Stock";
                    colorClase = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  }

                  return (
                    <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 font-mono font-bold text-blue-400">
                        {ref.numero_parte || `SP-${ref.id.toString().substring(0,6).toUpperCase()}`}
                      </td>
                      <td className="px-6 py-5 font-bold text-white max-w-[250px] truncate">{ref.nombre}</td>
                      <td className="px-6 py-5">
                        <p className="text-slate-300">{categoryMap[ref.categoria] || ref.categoria || 'General'}</p>
                        <p className="text-[10px] text-blue-400 font-mono mt-0.5">{ref.maquina_asignada || 'General'}</p>
                      </td>
                      
                      <td className="px-6 py-5 text-center">
                        <span className={`text-lg font-black ${ref.cantidad === 0 ? 'text-red-400' : stockCritico ? 'text-amber-400' : 'text-white'}`}>
                          {ref.cantidad}
                        </span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">
                          (Min: {ref.stock_minimo})
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center text-slate-500 text-xs font-bold">{uomMap[ref.unidad_medida] || ref.unidad_medida || 'Pcs'}</td>
                      
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${colorClase}`}>
                          {estatusTexto}
                        </span>
                      </td>

                      {/* 🟢 NUEVA COLUMNA DE ACCIONES: EDITAR Y ELIMINAR */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditar(ref)} className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit Part">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => eliminarPieza(ref.id)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Part">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: HISTORIAL DE CONSUMOS */}
      {mostrarHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-4xl w-full relative my-8">
            <button onClick={() => setMostrarHistorial(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl font-black text-white mb-2">Shop Floor Usage Log</h2>
            <p className="text-slate-400 text-sm mb-6">Audit trail tracking who retrieved parts and consumables from the kiosk.</p>
            
            <div className="overflow-x-auto max-h-[60vh] custom-scrollbar border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0">
                  <tr>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Part / Tool</th>
                    <th className="p-4 text-center">Qty Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {cargandoHistorial ? (
                    <tr><td colSpan={4} className="p-8 text-center text-blue-400 animate-pulse font-bold">Loading log data...</td></tr>
                  ) : historialConsumos.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No usage records found yet. Try using a part in the kiosk!</td></tr>
                  ) : (
                    historialConsumos.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-4 text-slate-400 font-mono text-xs">{new Date(log.fecha).toLocaleString()}</td>
                        <td className="p-4 font-bold text-white">{log.operador}</td>
                        <td className="p-4 text-blue-400 font-medium">{log.pieza_nombre}</td>
                        <td className="p-4 text-center font-black text-emerald-400">-{log.cantidad}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button onClick={() => setMostrarHistorial(false)} className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-3 font-bold rounded-xl transition-all">
              Close Log
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR O EDITAR PIEZA */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-2xl w-full relative my-8">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {/* 🟢 TÍTULO DINÁMICO */}
            <h2 className="text-2xl font-black text-white mb-6">
              {editandoId ? "Edit Spare Part" : "Register New Spare Part"}
            </h2>
            
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

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Assigned Workstation (Kiosk Filter)</label>
                  <select value={form.maquina_asignada} onChange={(e) => setForm({...form, maquina_asignada: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-blue-500 outline-none cursor-pointer">
                    <option value="General" className="bg-slate-900">General (Available for all machines)</option>
                    <option value="CNC Router #1" className="bg-slate-900">CNC Router #1 (Weeke)</option>
                    <option value="CNC Router #2" className="bg-slate-900">CNC Router #2</option>
                    <option value="CNC Panel Saw" className="bg-slate-900">CNC Panel Saw</option>
                    <option value="Edge Bander" className="bg-slate-900">Edge Bander</option>
                    <option value="CNC Dowell Drill" className="bg-slate-900">CNC Dowell Drill</option>
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
                {guardando ? "Saving..." : (editandoId ? "Update Part" : "Save Spare Part")}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}