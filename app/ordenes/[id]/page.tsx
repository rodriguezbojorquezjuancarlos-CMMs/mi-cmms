// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

export default function DetalleOrdenPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [orden, setOrden] = useState<any>(null)
  const [tareas, setTareas] = useState<any[]>([])
  const [inventario, setInventario] = useState<any[]>([]) 
  const [piezasUsadas, setPiezasUsadas] = useState<{id: string, nombre: string, cantidad: number}[]>([]) 
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [piezaSeleccionada, setPiezaSeleccionada] = useState("")
  const [cantidadUsada, setCantidadUsada] = useState("1")
  const [fotoEvidenciaGlobal, setFotoEvidenciaGlobal] = useState<File | null>(null)
  const [previewUrlGlobal, setPreviewUrlGlobal] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null)

  // NUEVO: Estado para guardar lo que el técnico escribe
  const [accionesTomadas, setAccionesTomadas] = useState("")

  // ESTADOS PARA EL CRONÓMETRO
  const [tiempoVivo, setTiempoVivo] = useState("00:00:00")

  // Visual status mapper
  const statusMap: Record<string, string> = {
    'Abierta': 'Open',
    'Pendiente': 'Pending',
    'En Progreso': 'In Progress',
    'Cerrada': 'Closed'
  }

  useEffect(() => {
    async function cargarDetalle() {
      const { data: dataOrden } = await supabase.from("ordenes_trabajo").select("*, equipos(nombre)").eq("id", id).single()
      if (dataOrden) {
        setOrden(dataOrden)
        if (dataOrden.evidencia_url) setPreviewUrlGlobal(dataOrden.evidencia_url)
        // NUEVO: Si la orden ya estaba cerrada y tenía comentarios, los cargamos
        if (dataOrden.acciones_tomadas) setAccionesTomadas(dataOrden.acciones_tomadas)
      }

      const { data: dataTareas } = await supabase.from("checklist_tareas").select("*").eq("orden_id", id).order("id", { ascending: true })
      if (dataTareas) setTareas(dataTareas)
      
      const { data: dataRefacciones } = await supabase.from("refacciones").select("*").gt("cantidad", 0).order("nombre", { ascending: true })
      if (dataRefacciones) setInventario(dataRefacciones)

      setCargando(false)
    }
    if (id) cargarDetalle()
  }, [id])

  // LÓGICA DEL CRONÓMETRO CON PARCHE DE ZONA HORARIA
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    const parsearHoraSegura = (fechaString: string) => {
      if (!fechaString) return 0;
      let segura = fechaString;
      if (!segura.endsWith('Z') && !segura.includes('+') && segura.length > 10) {
        segura += 'Z';
      }
      let ms = new Date(segura).getTime();
      if (isNaN(ms)) ms = new Date(`1970-01-01T${fechaString}Z`).getTime();
      return isNaN(ms) ? 0 : ms;
    }

    const actualizarReloj = () => {
      if (!orden) return;

      if (orden.estatus === 'Cerrada') {
        if (orden.hora_inicio && orden.hora_fin) {
          const inicio = parsearHoraSegura(orden.hora_inicio);
          const fin = parsearHoraSegura(orden.hora_fin);
          let diff = fin - inicio;
          
          if (diff <= 0) diff = 60000; 
          
          setTiempoVivo(formatearMilisegundos(diff));
        } else {
          setTiempoVivo("00:30:00");
        }
      } else if (orden.estatus === 'En Progreso') {
        if (orden.hora_inicio) {
          const inicio = parsearHoraSegura(orden.hora_inicio);
          const ahora = new Date().getTime();
          let diff = ahora - inicio;
          
          if (diff < 0) diff = 1000; 
          
          setTiempoVivo(formatearMilisegundos(diff));
        } else {
          setTiempoVivo("00:00:00");
        }
      } else {
        setTiempoVivo("00:00:00");
      }
    };

    actualizarReloj(); 
    if (orden?.estatus === 'En Progreso') {
      intervalo = setInterval(actualizarReloj, 1000);
    }

    return () => clearInterval(intervalo);
  }, [orden]);

  const formatearMilisegundos = (ms: number) => {
    if (ms < 0) return "00:00:00";
    const totalSeg = Math.floor(ms / 1000);
    const h = Math.floor(totalSeg / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeg % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeg % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  async function iniciarTrabajo() {
    const horaArranque = new Date().toISOString();
    setOrden({ ...orden, estatus: 'En Progreso', hora_inicio: horaArranque });

    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ estatus: 'En Progreso', hora_inicio: horaArranque })
      .eq("id", id);
    
    if (error) alert("Error starting: " + error.message);
  }

  async function cerrarOrden() {
    const tareasPendientes = tareas.filter(t => !t.completada)
    if (tareasPendientes.length > 0) {
      alert(`⚠️ There are ${tareasPendientes.length} pending tasks in the checklist.`)
      return
    }

    // NUEVO: Validación estricta si no hay checklist
    if (tareas.length === 0 && accionesTomadas.trim() === "") {
      alert("⚠️ You must describe the actions taken to close this work order.");
      // Hacemos scroll suave hacia la caja de texto para que el técnico la vea
      document.getElementById('caja-comentarios')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setGuardando(true)

    let urlEvidenciaGlobal = previewUrlGlobal; 
    if (fotoEvidenciaGlobal) {
      const fileExt = fotoEvidenciaGlobal.name.split('.').pop()
      const fileName = `global-${id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, fotoEvidenciaGlobal)
      if (!uploadError) {
        const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName)
        urlEvidenciaGlobal = data.publicUrl
      }
    }

    for (const pieza of piezasUsadas) {
      const refOriginal = inventario.find(r => r.id === pieza.id);
      if (refOriginal) {
        await supabase.from("refacciones").update({ cantidad: refOriginal.cantidad - pieza.cantidad }).eq("id", pieza.id);
      }
    }

    const horaCierre = new Date().toISOString();
    let horaArranqueSegura = orden.hora_inicio;

    if (!horaArranqueSegura) {
      horaArranqueSegura = new Date(Date.now() - 30 * 60000).toISOString();
    }

    // NUEVO: Mandamos el texto de las acciones tomadas a la base de datos
    const datosActualizar = { 
      estatus: 'Cerrada', 
      evidencia_url: urlEvidenciaGlobal,
      hora_inicio: horaArranqueSegura, 
      hora_fin: horaCierre,
      acciones_tomadas: accionesTomadas 
    };

    const { error } = await supabase.from("ordenes_trabajo").update(datosActualizar).eq("id", id);
    
    if (error) {
      alert("❌ Error closing: " + error.message); 
      setGuardando(false);
    } else {
      router.push("/ordenes") 
    }
  }

  async function toggleTarea(tareaId: string, estadoActual: boolean) {
    if (orden?.estatus !== 'En Progreso') return; 
    const nuevoEstado = !estadoActual;
    setTareas(tareas.map(t => t.id === tareaId ? { ...t, completada: nuevoEstado } : t))
    await supabase.from("checklist_tareas").update({ completada: nuevoEstado }).eq("id", tareaId)
  }

  const manejarSubidaFoto = async (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoFoto(tareaId.toString())
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `evidencias-checklist/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = await supabase.storage.from('evidencias').getPublicUrl(filePath)
      await actualizarTarea(tareaId, 'foto_url', publicUrl)
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("There was an error uploading the photographic evidence.")
    } finally {
      setSubiendoFoto(null)
    }
  }

  const actualizarTarea = async (tareaId: number, campo: string, valor: any) => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, [campo]: valor } : t))
    await supabase.from("checklist_tareas").update({ [campo]: valor }).eq("id", tareaId)
  }

  function agregarPiezaLocal() {
    if (orden?.estatus !== 'En Progreso') return alert("Start work first.");
    if (!piezaSeleccionada || parseInt(cantidadUsada) <= 0) return;
    const ref = inventario.find(r => r.id === piezaSeleccionada);
    if (!ref) return;
    if (parseInt(cantidadUsada) > ref.cantidad) return alert(`Only ${ref.cantidad} units available.`);
    
    const existe = piezasUsadas.find(p => p.id === piezaSeleccionada);
    if (existe) setPiezasUsadas(piezasUsadas.map(p => p.id === piezaSeleccionada ? { ...p, cantidad: p.cantidad + parseInt(cantidadUsada) } : p))
    else setPiezasUsadas([...piezasUsadas, { id: ref.id, nombre: ref.nombre, cantidad: parseInt(cantidadUsada) }])
    setPiezaSeleccionada(""); setCantidadUsada("1");
  }

  function quitarPiezaLocal(idPieza: string) {
    setPiezasUsadas(piezasUsadas.filter(p => p.id !== idPieza));
  }

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Preparing execution console...</div>
  if (!orden) return <div className="p-8 text-red-400 text-center mt-20 font-bold">Work order not found</div>

  const estaCerrada = orden.estatus === 'Cerrada';
  const estaEnProceso = orden.estatus === 'En Progreso';
  const estaAbierta = orden.estatus === 'Abierta' || orden.estatus === 'Pendiente';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/ordenes")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-[#0B1121] px-5 py-2.5 rounded-xl border border-slate-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="font-bold text-sm">Back to Dashboard</span>
        </button>

        {estaCerrada && (
          <button onClick={() => router.push(`/ordenes/${id}/reporte`)} className="flex items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all border border-emerald-500/30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Export PDF
          </button>
        )}
      </div>

      {/* HERO SECTION: DATOS Y CRONÓMETRO */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${estaCerrada ? 'bg-emerald-500' : estaEnProceso ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
        
        <div className="p-8 flex flex-col lg:flex-row gap-8 justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">WO Execution</p>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${estaCerrada ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : estaEnProceso ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                {statusMap[orden.estatus] || orden.estatus}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">{orden.equipos?.nombre || "General"}</h1>
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Instruction / Fault</p>
               <p className="text-slate-200 font-medium text-lg leading-relaxed">{orden.descripcion_falla}</p>
            </div>
          </div>

          {/* PANEL DEL RELOJ */}
          <div className="bg-black/40 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center min-w-[280px]">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Labor Time</p>
            
            <div className="text-5xl font-mono font-black text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {tiempoVivo}
            </div>

            {estaAbierta && (
              <button onClick={iniciarTrabajo} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] py-4 text-lg font-black rounded-xl transition-all flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6V4z" /></svg>
                START WORK
              </button>
            )}
            
            {estaEnProceso && (
              <div className="flex items-center gap-2 text-blue-400 text-sm font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                Active Timer - Recording
              </div>
            )}

            {estaCerrada && (
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Work Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ENVOLTORIO DE DESACTIVACIÓN */}
      <div className={`space-y-6 transition-all duration-500 ${estaAbierta ? 'opacity-40 pointer-events-none grayscale-[50%]' : 'opacity-100'}`}>
        
        {/* CHECKLIST */}
        {tareas.length > 0 && (
          <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-white font-black text-lg mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Execution Steps
            </h3>
            <div className="space-y-3">
              {tareas.map(tarea => (
                <div key={tarea.id} className={`rounded-xl border transition-all ${tarea.completada ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}>
                  <div onClick={() => toggleTarea(tarea.id, tarea.completada)} className={`flex items-center gap-4 p-4 transition-all ${estaCerrada ? 'cursor-default' : 'cursor-pointer'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 flex-shrink-0 transition-all ${tarea.completada ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'}`}>
                      {tarea.completada && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <p className={`font-semibold text-sm md:text-base transition-all ${tarea.completada ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {tarea.tarea}
                    </p>
                  </div>
                  
                  {/* Textarea para comentarios / Foto individual */}
                  <div className={`px-4 pb-4 pl-14 transition-all ${estaCerrada && !tarea.comentario && !tarea.foto_url ? 'hidden' : 'block'}`}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Add note or finding..." 
                          value={tarea.comentario || ''}
                          onChange={(e) => actualizarTarea(tarea.id, 'comentario', e.target.value)}
                          disabled={estaCerrada}
                          className="w-full bg-[#0B1221] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:border-emerald-500 outline-none placeholder-slate-600 disabled:opacity-70"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        {tarea.foto_url ? (
                          <a href={tarea.foto_url} target="_blank" rel="noreferrer" className="h-full px-4 py-2.5 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold">
                            View Photo
                          </a>
                        ) : (
                          <label className={`h-full px-4 py-2.5 flex items-center gap-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors ${estaCerrada ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'}`}>
                            {subiendoFoto === tarea.id.toString() ? 'Uploading...' : '📸 Take Photo'}
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => manejarSubidaFoto(e, tarea.id)} disabled={estaCerrada || subiendoFoto === tarea.id.toString()} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NUEVO: CAJA DE ACCIONES TOMADAS / COMENTARIOS */}
        <div id="caja-comentarios" className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            {tareas.length > 0 ? "Additional Comments (Optional)" : "Actions Taken (Required)"}
          </h3>
          <textarea
            value={accionesTomadas}
            onChange={(e) => setAccionesTomadas(e.target.value)}
            disabled={estaCerrada}
            placeholder={tareas.length > 0 ? "Any extra details about the work done..." : "Describe the actions taken to resolve this work order..."}
            className="w-full bg-[#070B14] border border-slate-700 text-slate-200 rounded-xl p-4 focus:border-blue-500 outline-none resize-none min-h-[120px] disabled:opacity-50"
          ></textarea>
        </div>

        {/* REFACCIONES */}
        {!estaCerrada && (
          <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Spare Parts Used
            </h3>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <select value={piezaSeleccionada} onChange={(e) => setPiezaSeleccionada(e.target.value)} className="flex-1 bg-[#070B14] border border-slate-700 p-4 rounded-xl focus:border-amber-500 outline-none text-slate-200 appearance-none">
                <option value="">Search in warehouse...</option>
                {inventario.map(ref => <option key={ref.id} value={ref.id}>{ref.nombre} (Qty: {ref.cantidad})</option>)}
              </select>
              <div className="flex gap-3">
                <input type="number" min="1" value={cantidadUsada} onChange={(e) => setCantidadUsada(e.target.value)} className="w-24 bg-[#070B14] border border-slate-700 p-4 rounded-xl text-center focus:border-amber-500 outline-none text-slate-200 font-bold" />
                <button type="button" onClick={agregarPiezaLocal} className="bg-amber-500/10 text-amber-500 border border-amber-500/30 px-6 rounded-xl hover:bg-amber-500/20 transition-colors font-black text-xl">+</button>
              </div>
            </div>
            {piezasUsadas.length > 0 && (
              <div className="space-y-2">
                {piezasUsadas.map(pieza => (
                  <div key={pieza.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-300 font-medium text-sm"><span className="text-amber-500 font-bold mr-2">{pieza.cantidad}x</span> {pieza.nombre}</span>
                    <button onClick={() => quitarPiezaLocal(pieza.id)} className="text-red-400 hover:text-red-300 p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVIDENCIA FOTOGRÁFICA */}
        <div className="bg-[#0B1221] border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            General Work Evidence
          </h3>
          {!previewUrlGlobal ? (
            <div className="relative group">
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { if(e.target.files) { setFotoEvidenciaGlobal(e.target.files[0]); setPreviewUrlGlobal(URL.createObjectURL(e.target.files[0])) } }} disabled={estaCerrada} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className={`border-2 border-dashed ${estaCerrada ? 'border-slate-800 bg-slate-900' : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50'} rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all`}>
                <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
                <p className="font-bold text-lg text-blue-400">{estaCerrada ? "No evidence captured" : "Take Photo of Work"}</p>
                {!estaCerrada && <p className="text-xs text-slate-500 mt-2">Tap here to open camera</p>}
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 group">
              <img src={previewUrlGlobal} alt="Global Evidence" className="w-full h-72 object-cover" />
              {!estaCerrada && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => { setFotoEvidenciaGlobal(null); setPreviewUrlGlobal(null) }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 z-20 relative">
                    Discard and Retake
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div> 

      {/* BOTÓN FINAL MAESTRO */}
      {estaEnProceso && (
        <div className="sticky bottom-6 z-40 animate-in slide-in-from-bottom-10 duration-500">
          <button onClick={cerrarOrden} disabled={guardando} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_15px_30px_rgba(16,185,129,0.4)] py-6 text-xl font-black rounded-2xl transition-all disabled:opacity-50 flex justify-center items-center gap-3">
            {guardando ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Syncing closure...
              </span>
            ) : (
              <>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                FINISH AND SIGN ORDER
              </>
            )}
          </button>
        </div>
      )}

    </div>
  )
}