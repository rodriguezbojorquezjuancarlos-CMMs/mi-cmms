// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Wallet, Hammer, Pickaxe, Receipt, Download, FileText, Image as ImageIcon, CheckCircle, Clock, Plus, X, Camera, Trash2, Pencil } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DashboardTijuana() {
  const [gastos, setGastos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Métricas calculadas
  const [metricas, setMetricas] = useState({
    total: 0,
    materiales: 0,
    albanil: 0,
    miscelaneas: 0,
    pendientes: 0
  })

  // Estados para la ventana Modal de Nuevo/Editar Gasto
  const [mostrarModal, setMostrarModal] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<string | null>(null) // Para saber si editamos
  const [nuevoConcepto, setNuevoConcepto] = useState("")
  const [nuevoMonto, setNuevoMonto] = useState("")
  const [nuevaCategoria, setNuevaCategoria] = useState("Materiales")
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null)
  const [guardandoGasto, setGuardandoGasto] = useState(false)

  useEffect(() => {
    cargarGastos()
  }, [])

  async function cargarGastos() {
    setCargando(true)
    const { data, error } = await supabase
      .from("gastos_tijuana")
      .select("*")
      .order("fecha", { ascending: false })

    if (data) {
      setGastos(data)
      
      let tot = 0, mat = 0, alb = 0, misc = 0, pend = 0;
      
      data.forEach(g => {
        const monto = Number(g.monto)
        tot += monto
        if (g.categoria === 'Materiales') mat += monto
        if (g.categoria === 'Albañil') alb += monto
        if (g.categoria === 'Misceláneas') misc += monto
        if (g.estatus === 'Pendiente') pend++
      })

      setMetricas({ total: tot, materiales: mat, albanil: alb, miscelaneas: misc, pendientes: pend })
    }
    setCargando(false)
  }

  const aprobarGasto = async (id: string) => {
    const { error } = await supabase
      .from("gastos_tijuana")
      .update({ estatus: 'Aprobado' })
      .eq("id", id)
      
    if (!error) cargarGastos()
  }

  // --- NUEVA FUNCIÓN: ELIMINAR GASTO ---
  const eliminarGasto = async (id: string) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from("gastos_tijuana")
        .delete()
        .eq("id", id)

      if (error) throw error
      cargarGastos()
    } catch (err: any) {
      alert("Error al eliminar el gasto: " + err.message)
    }
  }

  // --- PREPARAR MODAL PARA EDITAR ---
  const abrirModalEditar = (gasto: any) => {
    setGastoEditando(gasto.id)
    setNuevoConcepto(gasto.concepto)
    setNuevoMonto(gasto.monto.toString())
    setNuevaCategoria(gasto.categoria)
    setNuevoArchivo(null)
    setMostrarModal(true)
  }

  // --- PREPARAR MODAL PARA NUEVO GASTO ---
  const abrirModalNuevo = () => {
    setGastoEditando(null)
    setNuevoConcepto("")
    setNuevoMonto("")
    setNuevaCategoria("Materiales")
    setNuevoArchivo(null)
    setMostrarModal(true)
  }

  // --- GUARDAR O ACTUALIZAR GASTO ---
  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoConcepto || !nuevoMonto) return
    setGuardandoGasto(true)

    try {
      let evidenciaUrl = null

      // Si subió un archivo nuevo
      if (nuevoArchivo) {
        const nombreArchivo = `${Date.now()}-${nuevoArchivo.name}`
        const { error: uploadError } = await supabase.storage
          .from("tickets_obra")
          .upload(nombreArchivo, nuevoArchivo)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from("tickets_obra")
          .getPublicUrl(nombreArchivo)

        evidenciaUrl = publicUrlData.publicUrl
      }

      if (gastoEditando) {
        // ACTUALIZAR GASTO EXISTENTE
        const datosActualizar: any = {
          concepto: nuevoConcepto,
          monto: parseFloat(nuevoMonto),
          categoria: nuevaCategoria,
        }
        if (evidenciaUrl) datosActualizar.evidencia_url = evidenciaUrl // Solo actualiza foto si se subió una nueva

        const { error: updateError } = await supabase
          .from("gastos_tijuana")
          .update(datosActualizar)
          .eq("id", gastoEditando)

        if (updateError) throw updateError
      } else {
        // INSERTAR NUEVO GASTO
        const { error: insertError } = await supabase
          .from("gastos_tijuana")
          .insert([{
            concepto: nuevoConcepto,
            monto: parseFloat(nuevoMonto),
            categoria: nuevaCategoria,
            evidencia_url: evidenciaUrl,
            registrado_por: "Rafael Alvarez",
            estatus: "Aprobado" 
          }])

        if (insertError) throw insertError
      }

      setMostrarModal(false)
      cargarGastos() 

    } catch (err: any) {
      alert("Error al guardar: " + err.message)
    } finally {
      setGuardandoGasto(false)
    }
  }

  const exportarExcel = () => {
    const datosTabla = gastos.map(g => ({
      Fecha: new Date(g.fecha).toLocaleDateString('es-MX'),
      Concepto: g.concepto,
      Categoría: g.categoria,
      'Registrado por': g.registrado_por,
      'Monto ($)': Number(g.monto),
      Estatus: g.estatus
    }))
    const worksheet = XLSX.utils.json_to_sheet(datosTabla)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Obra")
    XLSX.writeFile(workbook, "Control_Financiero_Tijuana.xlsx")
  }

  const generarPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte Financiero - Obra Tijuana", 14, 15)
    
    const datosTabla = gastos.map(g => [
      new Date(g.fecha).toLocaleDateString('es-MX'),
      g.concepto,
      g.categoria,
      g.registrado_por,
      `$${Number(g.monto).toLocaleString('es-MX')}`,
      g.estatus
    ])

    autoTable(doc, {
      head: [['Fecha', 'Concepto', 'Categoría', 'Registrado por', 'Monto', 'Estatus']],
      body: datosTabla,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } 
    })
    
    doc.save("Control_Financiero_Tijuana.pdf")
  }

  const porcMateriales = metricas.total > 0 ? (metricas.materiales / metricas.total) * 100 : 0
  const porcAlbanil = metricas.total > 0 ? (metricas.albanil / metricas.total) * 100 : 0
  const porcMisc = metricas.total > 0 ? (metricas.miscelaneas / metricas.total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-4 md:p-8 font-sans pb-24">
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Proyecto Activo
            </span>
            <span className="text-slate-500 text-sm font-bold">Tijuana, B.C.</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Control Financiero</h1>
          <p className="text-slate-400 mt-1">Supervisión de gastos, facturas y flujo de capital.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={abrirModalNuevo} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Plus size={18} /> Nuevo Gasto
          </button>
          <button onClick={exportarExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors border border-slate-700">
            <FileText size={18} /> Exportar Excel
          </button>
          <button onClick={generarPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Download size={18} /> Generar PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={64} /></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
            <h3 className="text-4xl font-black text-white">${metricas.total.toLocaleString('es-MX')}</h3>
          </div>
          
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:opacity-20 transition-opacity"><Hammer size={64} /></div>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Mano de Obra (Albañil)</p>
            <h3 className="text-3xl font-black text-white">${metricas.albanil.toLocaleString('es-MX')}</h3>
          </div>

          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-500 group-hover:opacity-20 transition-opacity"><Pickaxe size={64} /></div>
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">Materiales e Insumos</p>
            <h3 className="text-3xl font-black text-white">${metricas.materiales.toLocaleString('es-MX')}</h3>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">Tickets por Revisar</p>
            <h3 className="text-3xl font-black text-white flex items-center gap-3">
              {metricas.pendientes} <span className="text-sm font-medium text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">Pendientes</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Receipt size={18} className="text-slate-400"/> Distribución del Presupuesto</h3>
          <div className="w-full h-4 rounded-full flex overflow-hidden bg-slate-800">
            <div style={{ width: `${porcAlbanil}%` }} className="bg-emerald-500 h-full"></div>
            <div style={{ width: `${porcMateriales}%` }} className="bg-amber-500 h-full"></div>
            <div style={{ width: `${porcMisc}%` }} className="bg-purple-500 h-full"></div>
          </div>
          <div className="flex gap-6 mt-4 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-slate-400">Albañil ({porcAlbanil.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> <span className="text-slate-400">Materiales ({porcMateriales.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> <span className="text-slate-400">Misceláneas ({porcMisc.toFixed(1)}%)</span></div>
          </div>
        </div>

        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
            <h2 className="text-lg font-black text-white">Historial de Gastos y Comprobantes</h2>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5">Concepto</th>
                  <th className="px-6 py-5">Categoría</th>
                  <th className="px-6 py-5">Registrado por</th>
                  <th className="px-6 py-5 text-right">Monto</th>
                  <th className="px-6 py-5 text-center">Ticket</th>
                  <th className="px-6 py-5 text-center">Estatus</th>
                  <th className="px-6 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {cargando ? (
                  <tr><td colSpan={8} className="p-12 text-center text-blue-400 animate-pulse font-bold">Cargando registros financieros...</td></tr>
                ) : gastos.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500">No hay gastos registrados aún.</td></tr>
                ) : (
                  gastos.map(g => (
                    <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5 text-slate-400 font-mono text-xs">{new Date(g.fecha).toLocaleDateString('es-MX')}</td>
                      <td className="px-6 py-5 font-bold text-white">{g.concepto}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest 
                          ${g.categoria === 'Materiales' ? 'bg-amber-500/10 text-amber-400' : 
                            g.categoria === 'Albañil' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {g.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-400">{g.registrado_por}</td>
                      <td className="px-6 py-5 text-right font-black text-white text-lg">${Number(g.monto).toLocaleString('es-MX')}</td>
                      
                      <td className="px-6 py-5 text-center">
                        {g.evidencia_url ? (
                          <a href={g.evidencia_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors">
                            <ImageIcon size={14} /> Ver
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs font-bold uppercase">Sin Ticket</span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {g.estatus === 'Aprobado' ? (
                          <span className="inline-flex items-center justify-center gap-1 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                            <CheckCircle size={14} /> Aprobado
                          </span>
                        ) : (
                          <button onClick={() => aprobarGasto(g.id)} className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors w-full shadow-lg">
                            <Clock size={14} /> Aprobar
                          </button>
                        )}
                      </td>

                      {/* COLUMNA DE ACCIONES: EDITAR Y ELIMINAR */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditar(g)} className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => eliminarGasto(g.id)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title="Eliminar">
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

      {/* VENTANA MODAL REUTILIZADA PARA NUEVO / EDITAR GASTO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-black text-white mb-6">
              {gastoEditando ? "Editar Gasto" : "Registrar Nuevo Gasto"}
            </h2>
            
            <form onSubmit={handleGuardarGasto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Concepto de la compra</label>
                <input required type="text" placeholder="Ej. Anticipo albañilería" value={nuevoConcepto} onChange={(e) => setNuevoConcepto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monto ($ MXN)</label>
                <input required type="number" step="0.01" placeholder="0.00" value={nuevoMonto} onChange={(e) => setNuevoMonto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none font-black text-lg" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
                <select value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none cursor-pointer text-sm font-bold">
                  <option value="Materiales">Materiales e Insumos</option>
                  <option value="Albañil">Mano de Obra / Anticipo</option>
                  <option value="Misceláneas">Misceláneas / Viáticos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  {gastoEditando ? "Reemplazar Ticket (Opcional)" : "Ticket (Opcional)"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-[#070B14] hover:border-emerald-500 transition-colors">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Camera size={20} className="mb-1 text-emerald-400" />
                    <p className="text-[10px] font-bold">{nuevoArchivo ? nuevoArchivo.name : "Subir archivo"}</p>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setNuevoArchivo(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

              <button type="submit" disabled={guardandoGasto} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all mt-6 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                {guardandoGasto ? "Guardando..." : (gastoEditando ? "ACTUALIZAR GASTO" : "GUARDAR GASTO")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}