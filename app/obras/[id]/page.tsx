// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Wallet, Hammer, Pickaxe, Receipt, Download, FileText, Image as ImageIcon, CheckCircle, Plus, X, Camera, Trash2, Pencil, ArrowLeft, MapPin, Settings } from "lucide-react"
import Link from 'next/link'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DetalleObraPage() {
  const params = useParams()
  const proyectoId = params.id

  const [proyecto, setProyecto] = useState<any>(null)
  const [gastos, setGastos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [metricas, setMetricas] = useState({
    total: 0,
    materiales: 0,
    albanil: 0,
    miscelaneas: 0,
    pendientes: 0
  })

  const [mostrarModalGasto, setMostrarModalGasto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<string | null>(null)
  const [nuevoConcepto, setNuevoConcepto] = useState("")
  const [nuevoMonto, setNuevoMonto] = useState("")
  const [nuevaCategoria, setNuevaCategoria] = useState("Materiales")
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null)
  const [guardandoGasto, setGuardandoGasto] = useState(false)

  // Estados para Modal de Editar Proyecto (Incluye Estatus)
  const [mostrarModalProyecto, setMostrarModalProyecto] = useState(false)
  const [editNombre, setEditNombre] = useState("")
  const [editCliente, setEditCliente] = useState("")
  const [editUbicacion, setEditUbicacion] = useState("")
  const [editPresupuesto, setEditPresupuesto] = useState("")
  const [editEstatus, setEditEstatus] = useState("Activo")
  const [guardandoProyecto, setGuardandoProyecto] = useState(false)

  useEffect(() => {
    if (proyectoId) cargarDatosObra()
  }, [proyectoId])

  async function cargarDatosObra() {
    setCargando(true)

    const { data: projData } = await supabase
      .from("proyectos")
      .select("*")
      .eq("id", proyectoId)
      .single()

    if (projData) {
      setProyecto(projData)
      setEditNombre(projData.nombre || "")
      setEditCliente(projData.cliente || "")
      setEditUbicacion(projData.ubicacion || "")
      setEditPresupuesto(projData.presupuesto_estimado?.toString() || "")
      setEditEstatus(projData.estatus || "Activo")
    }

    const { data: gastosData } = await supabase
      .from("gastos_obra")
      .select("*")
      .eq("proyecto_id", proyectoId)
      .order("fecha", { ascending: false })

    if (gastosData) {
      setGastos(gastosData)
      let tot = 0, mat = 0, alb = 0, misc = 0, pend = 0;
      
      gastosData.forEach(g => {
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

  const handleActualizarProyecto = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoProyecto(true)

    try {
      const { error } = await supabase
        .from("proyectos")
        .update({
          nombre: editNombre,
          cliente: editCliente,
          ubicacion: editUbicacion,
          presupuesto_estimado: parseFloat(editPresupuesto) || 0,
          estatus: editEstatus
        })
        .eq("id", proyectoId)

      if (error) throw error
      setMostrarModalProyecto(false)
      cargarDatosObra()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setGuardandoProyecto(false)
    }
  }

  const aprobarGasto = async (id: string) => {
    const { error } = await supabase.from("gastos_obra").update({ estatus: 'Aprobado' }).eq("id", id)
    if (!error) cargarDatosObra()
  }

  const eliminarGasto = async (id: string) => {
    if (!window.confirm("¿Deseas eliminar este gasto?")) return
    const { error } = await supabase.from("gastos_obra").delete().eq("id", id)
    if (!error) cargarDatosObra()
  }

  const abrirModalEditarGasto = (g: any) => {
    setGastoEditando(g.id)
    setNuevoConcepto(g.concepto)
    setNuevoMonto(g.monto.toString())
    setNuevaCategoria(g.categoria)
    setNuevoArchivo(null)
    setMostrarModalGasto(true)
  }

  const abrirModalNuevoGasto = () => {
    setGastoEditando(null)
    setNuevoConcepto("")
    setNuevoMonto("")
    setNuevaCategoria("Materiales")
    setNuevoArchivo(null)
    setMostrarModalGasto(true)
  }

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoConcepto || !nuevoMonto) return
    setGuardandoGasto(true)

    try {
      let evidenciaUrl = null
      if (nuevoArchivo) {
        const nombreArchivo = `${Date.now()}-${nuevoArchivo.name}`
        const { error: uploadError } = await supabase.storage.from("tickets_obra").upload(nombreArchivo, nuevoArchivo)
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from("tickets_obra").getPublicUrl(nombreArchivo)
        evidenciaUrl = publicUrlData.publicUrl
      }

      if (gastoEditando) {
        const datosActualizar: any = { concepto: nuevoConcepto, monto: parseFloat(nuevoMonto), categoria: nuevaCategoria }
        if (evidenciaUrl) datosActualizar.ticket_url = evidenciaUrl
        await supabase.from("gastos_obra").update(datosActualizar).eq("id", gastoEditando)
      } else {
        await supabase.from("gastos_obra").insert([{
          proyecto_id: proyectoId,
          concepto: nuevoConcepto,
          monto: parseFloat(nuevoMonto),
          categoria: nuevaCategoria,
          ticket_url: evidenciaUrl,
          registrado_por: "Rafael Alvarez",
          estatus: "Aprobado"
        }])
      }

      setMostrarModalGasto(false)
      cargarDatosObra()
    } catch (err: any) {
      alert("Error: " + err.message)
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
    XLSX.writeFile(workbook, `Control_${proyecto?.nombre || 'Obra'}.xlsx`)
  }

  const generarPDF = () => {
    const doc = new jsPDF()
    doc.text(`Reporte - ${proyecto?.nombre || 'Obra'}`, 14, 15)
    const datosTabla = gastos.map(g => [
      new Date(g.fecha).toLocaleDateString('es-MX'),
      g.concepto,
      g.categoria,
      g.registrado_por,
      `$${Number(g.monto).toLocaleString('es-MX')}`,
      g.estatus
    ])
    autoTable(doc, { head: [['Fecha', 'Concepto', 'Categoría', 'Registrado por', 'Monto', 'Estatus']], body: datosTabla, startY: 25, theme: 'grid', headStyles: { fillColor: [16, 185, 129] } })
    doc.save(`Control_${proyecto?.nombre || 'Obra'}.pdf`)
  }

  const presupuestoTotal = Number(proyecto?.presupuesto_estimado) || 1
  const porcAlbanil = (metricas.albanil / presupuestoTotal) * 100
  const porcMateriales = (metricas.materiales / presupuestoTotal) * 100
  const porcMisc = (metricas.miscelaneas / presupuestoTotal) * 100

  if (cargando) return <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-emerald-400 font-bold animate-pulse">Cargando Finanzas...</div>

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-4 md:p-8 font-sans pb-24">
      
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <Link href={"/" as any} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-[#0B1221] border border-slate-800 px-4 py-2 rounded-xl">
          <ArrowLeft size={14} /> Volver a Todas las Obras
        </Link>

        <button onClick={() => setMostrarModalProyecto(true)} className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
          <Settings size={14} /> Editar Obra y Presupuesto
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              proyecto?.estatus === 'En Pausa' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              proyecto?.estatus === 'Terminado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {proyecto?.estatus || 'Activo'}
            </span>
            <span className="text-slate-400 text-sm font-bold flex items-center gap-1">
              <MapPin size={14} className="text-emerald-500"/> {proyecto?.ubicacion}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{proyecto?.nombre}</h1>
          <p className="text-slate-400 mt-1">Cliente: <strong className="text-white">{proyecto?.cliente}</strong> | Presupuesto: <strong className="text-emerald-400">${Number(proyecto?.presupuesto_estimado || 0).toLocaleString('es-MX')}</strong></p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={abrirModalNuevoGasto} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold transition-colors">
            <Plus size={18} /> Nuevo Gasto
          </button>
          <button onClick={exportarExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors border border-slate-700">
            <FileText size={18} /> Excel
          </button>
          <button onClick={generarPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-colors">
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
            <h3 className="text-4xl font-black text-white">${metricas.total.toLocaleString('es-MX')}</h3>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Mano de Obra</p>
            <h3 className="text-3xl font-black text-white">${metricas.albanil.toLocaleString('es-MX')}</h3>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">Materiales</p>
            <h3 className="text-3xl font-black text-white">${metricas.materiales.toLocaleString('es-MX')}</h3>
          </div>
          <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-lg">
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">Tickets por Revisar</p>
            <h3 className="text-3xl font-black text-white">{metricas.pendientes} Pendientes</h3>
          </div>
        </div>

        {/* BARRA Y LEYENDA */}
        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Receipt size={18} className="text-slate-400"/> Distribución del Presupuesto</h3>
          <div className="w-full h-4 rounded-full flex overflow-hidden bg-slate-800">
            <div style={{ width: `${Math.min(porcAlbanil, 100)}%` }} className="bg-emerald-500 h-full"></div>
            <div style={{ width: `${Math.min(porcMateriales, 100)}%` }} className="bg-amber-500 h-full"></div>
            <div style={{ width: `${Math.min(porcMisc, 100)}%` }} className="bg-purple-500 h-full"></div>
          </div>
          <div className="flex gap-6 mt-4 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-slate-400">Albañil ({porcAlbanil.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> <span className="text-slate-400">Materiales ({porcMateriales.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> <span className="text-slate-400">Misceláneas ({porcMisc.toFixed(1)}%)</span></div>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30">
            <h2 className="text-lg font-black text-white">Historial de Gastos y Comprobantes</h2>
          </div>
          <div className="overflow-x-auto">
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
                {gastos.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500">No hay gastos registrados aún.</td></tr>
                ) : (
                  gastos.map(g => (
                    <tr key={g.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-5 text-slate-400 font-mono text-xs">{new Date(g.fecha).toLocaleDateString('es-MX')}</td>
                      <td className="px-6 py-5 font-bold text-white">{g.concepto}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${g.categoria === 'Materiales' ? 'bg-amber-500/10 text-amber-400' : g.categoria === 'Albañil' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>{g.categoria}</span>
                      </td>
                      <td className="px-6 py-5 text-slate-400">{g.registrado_por}</td>
                      <td className="px-6 py-5 text-right font-black text-white text-lg">${Number(g.monto).toLocaleString('es-MX')}</td>
                      <td className="px-6 py-5 text-center">
                        {g.ticket_url ? <a href={g.ticket_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs font-bold"><ImageIcon size={14} className="inline mr-1"/>Ver</a> : <span className="text-slate-600 text-xs">Sin Ticket</span>}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {g.estatus === 'Aprobado' ? <span className="text-emerald-500 text-xs font-bold"><CheckCircle size={14} className="inline mr-1"/>Aprobado</span> : <button onClick={() => aprobarGasto(g.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Aprobar</button>}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => abrirModalEditarGasto(g)} className="p-2 text-blue-400 bg-blue-500/10 rounded-lg mr-2"><Pencil size={16} /></button>
                        <button onClick={() => eliminarGasto(g.id)} className="p-2 text-red-400 bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR PROYECTO (CON SELECTOR DE ESTATUS) */}
      {mostrarModalProyecto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setMostrarModalProyecto(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-black text-white mb-6">Editar Datos y Estatus</h2>
            <form onSubmit={handleActualizarProyecto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre</label>
                <input required type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cliente</label>
                <input type="text" value={editCliente} onChange={(e) => setEditCliente(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ubicación</label>
                <input type="text" value={editUbicacion} onChange={(e) => setEditUbicacion(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Presupuesto ($ MXN)</label>
                <input required type="number" step="0.01" value={editPresupuesto} onChange={(e) => setEditPresupuesto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-emerald-400 font-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estatus del Proyecto</label>
                <select value={editEstatus} onChange={(e) => setEditEstatus(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none font-bold text-sm cursor-pointer">
                  <option value="Activo">Activo</option>
                  <option value="En Pausa">En Pausa (Hold)</option>
                  <option value="Terminado">Terminado</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl mt-4">GUARDAR</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GASTO */}
      {mostrarModalGasto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setMostrarModalGasto(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-black text-white mb-6">{gastoEditando ? "Editar Gasto" : "Nuevo Gasto"}</h2>
            <form onSubmit={handleGuardarGasto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Concepto</label>
                <input required type="text" value={nuevoConcepto} onChange={(e) => setNuevoConcepto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monto ($ MXN)</label>
                <input required type="number" step="0.01" value={nuevoMonto} onChange={(e) => setNuevoMonto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 font-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
                <select value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none font-bold">
                  <option value="Materiales">Materiales</option>
                  <option value="Albañil">Mano de Obra</option>
                  <option value="Misceláneas">Misceláneas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ticket (Opcional)</label>
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-[#070B14]">
                  <span className="text-slate-400 text-xs">{nuevoArchivo ? nuevoArchivo.name : "Subir comprobante"}</span>
                  <input type="file" accept="image/*" onChange={(e) => setNuevoArchivo(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl mt-4">GUARDAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}