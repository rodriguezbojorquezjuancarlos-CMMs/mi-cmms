// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Settings, Wrench, CheckCircle, AlertTriangle, ArrowLeft, Plus, Minus, Delete, User } from "lucide-react"

export default function KioskoOperadores() {
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<string | null>(null)
  const [inventario, setInventario] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  
  // Estados para el Modal y NIP
  const [piezaActiva, setPiezaActiva] = useState<any>(null)
  const [cantidadRetirar, setCantidadRetirar] = useState(1)
  const [procesando, setProcesando] = useState(false)
  const [nip, setNip] = useState("")
  const [errorNip, setErrorNip] = useState(false)

  const maquinas = [
    "CNC Router #1 (Weeke)",
    "CNC Router #2",
    "CNC Panel Saw",
    "Edge Bander",
    "CNC Dowell Drill"
  ]

  const cargarInventarioMaquina = async (maquina: string) => {
    setCargando(true)
    setMaquinaSeleccionada(maquina)
    
    const nombreCorto = maquina.split(' (')[0].toLowerCase()

    const { data, error } = await supabase
      .from("refacciones")
      .select("*")
      .gt("cantidad", 0) 
      .order("nombre", { ascending: true })

    if (error) {
      console.error(error)
      setInventario([])
    } else {
      const inventarioFiltrado = (data || []).filter(pieza => {
        const maquinaAsignada = (pieza.maquina_asignada || "").toLowerCase()
        return maquinaAsignada.includes(nombreCorto) || maquinaAsignada.includes("general")
      })
      setInventario(inventarioFiltrado)
    }
    setCargando(false)
  }

  // Teclado Numérico
  const presionarTecla = (num: string) => {
    if (nip.length < 4) {
      setNip(prev => prev + num)
      setErrorNip(false)
    }
  }

  const borrarTecla = () => {
    setNip(prev => prev.slice(0, -1))
    setErrorNip(false)
  }

  // Registrar consumo con validación de NIP
  const registrarConsumo = async () => {
    if (!piezaActiva || cantidadRetirar <= 0 || nip.length !== 4) return
    setProcesando(true)

    try {
      // 1. Verificar si el NIP existe en la tabla "perfiles"
      const { data: operador, error: errorNipDb } = await supabase
        .from("perfiles")
        .select("nombre")
        .eq("nip", nip)
        .maybeSingle()

      if (errorNipDb) throw new Error("Error connecting to operator database.")
      
      if (!operador) {
        setErrorNip(true)
        setNip("")
        setProcesando(false)
        return // Detenemos el proceso si el NIP no existe
      }

      // 2. Si el NIP es correcto, descontamos la pieza
      const nuevoStock = piezaActiva.cantidad - cantidadRetirar
      const { error: errorStock } = await supabase
        .from("refacciones")
        .update({ cantidad: nuevoStock })
        .eq("id", piezaActiva.id)

      if (errorStock) throw errorStock

      // Mensaje de éxito glorioso con el nombre del operador
      alert(`✅ Access Granted!\n\nOperator: ${operador.nombre}\nLogged: ${cantidadRetirar}x ${piezaActiva.nombre}`)
      
      // Limpiamos todo
      setPiezaActiva(null)
      setCantidadRetirar(1)
      setNip("")
      
      // Recargamos inventario
      cargarInventarioMaquina(maquinaSeleccionada!)

    } catch (error: any) {
      alert("❌ Error: " + error.message)
    } finally {
      setProcesando(false)
    }
  }

  if (!maquinaSeleccionada) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12 animate-in slide-in-from-top-10">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(37,99,235,0.3)]">
              <Settings size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Operator Portal</h1>
            <p className="text-slate-400 text-lg">Select your workstation to log parts and consumables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {maquinas.map((maq, i) => (
              <button 
                key={i}
                onClick={() => cargarInventarioMaquina(maq)}
                className="bg-[#121826] border border-slate-800 hover:border-blue-500 hover:bg-blue-900/20 p-8 rounded-3xl transition-all shadow-xl group text-left flex flex-col items-start gap-4"
              >
                <div className="bg-[#0b101a] p-4 rounded-2xl group-hover:bg-blue-600 transition-colors border border-slate-800 group-hover:border-blue-500">
                  <Wrench size={32} className="text-blue-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 group-hover:text-white">{maq}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b14] p-6 text-slate-200">
      
      {/* MODAL DE CONSUMO CON TECLADO NUMÉRICO */}
      {piezaActiva && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-700 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden p-8 animate-in zoom-in-95">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Log Part Usage</h2>
                <p className="text-slate-400 font-medium">{piezaActiva.nombre}</p>
              </div>
              <button onClick={() => {setPiezaActiva(null); setNip(""); setErrorNip(false); setCantidadRetirar(1)}} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-xl font-bold transition-colors">
                Cancel
              </button>
            </div>
            
            {/* Selector de cantidad */}
            <div className="flex items-center justify-between bg-[#0b101a] p-4 rounded-2xl border border-slate-800 mb-6">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Quantity</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setCantidadRetirar(Math.max(1, cantidadRetirar - 1))} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><Minus size={20} /></button>
                <div className="text-3xl font-black text-white w-12 text-center">{cantidadRetirar}</div>
                <button onClick={() => setCantidadRetirar(Math.min(piezaActiva.cantidad, cantidadRetirar + 1))} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><Plus size={20} /></button>
              </div>
            </div>

            <div className="border-t border-slate-800 my-6"></div>

            {/* Ingreso de NIP */}
            <div className="text-center mb-6">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-4">
                <User size={16} /> Enter Operator PIN
              </p>
              
              <div className="flex justify-center gap-3 mb-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition-all ${
                    errorNip ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 
                    nip.length > i ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#0b101a] border border-slate-800 text-transparent'
                  }`}>
                    {nip.length > i ? nip[i] : '•'}
                  </div>
                ))}
              </div>
              {errorNip && <p className="text-rose-400 text-sm font-bold animate-pulse mt-2">Invalid PIN. Try again.</p>}
            </div>

            {/* Teclado numérico Táctil */}
            <div className="grid grid-cols-3 gap-3 mb-8 px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => presionarTecla(num.toString())} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-500 rounded-2xl text-2xl font-black text-white transition-colors">
                  {num}
                </button>
              ))}
              <div className="h-14"></div> {/* Espacio vacío */}
              <button onClick={() => presionarTecla('0')} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-500 rounded-2xl text-2xl font-black text-white transition-colors">
                0
              </button>
              <button onClick={borrarTecla} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-rose-500 rounded-2xl flex items-center justify-center text-white transition-colors">
                <Delete size={24} />
              </button>
            </div>

            {/* Botón Confirmar */}
            <button 
              onClick={registrarConsumo}
              disabled={procesando || nip.length !== 4}
              className="w-full py-5 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] flex justify-center items-center gap-3"
            >
              {procesando ? "Verifying..." : "CONFIRM PART USAGE"}
              {!procesando && nip.length === 4 && <CheckCircle size={24} />}
            </button>
            
          </div>
        </div>
      )}

      {/* HEADER DE MÁQUINA */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between bg-[#121826] p-6 rounded-3xl border border-slate-800 mb-8 shadow-xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMaquinaSeleccionada(null)}
              className="w-14 h-14 bg-[#070b14] rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <ArrowLeft size={24} className="text-slate-400" />
            </button>
            <div>
              <p className="text-blue-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">Active Workstation</p>
              <h1 className="text-3xl font-black text-white">{maquinaSeleccionada}</h1>
            </div>
          </div>
        </div>

        {/* LISTADO DE REFACCIONES */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Wrench size={20} className="text-slate-400" /> Assigned Parts & Tooling
        </h2>

        {cargando ? (
          <div className="text-center py-20 text-slate-500 font-bold text-xl animate-pulse">Loading tooling data...</div>
        ) : inventario.length === 0 ? (
          <div className="bg-[#121826] border border-slate-800 rounded-3xl p-12 text-center">
            <AlertTriangle size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No parts found</h3>
            <p className="text-slate-500">There are no consumables assigned to this machine right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inventario.map(pieza => {
              const stockCritico = pieza.cantidad <= pieza.stock_minimo;
              
              return (
                <div key={pieza.id} className="bg-[#121826] border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between shadow-lg hover:border-slate-600 transition-all">
                  
                  {stockCritico && (
                    <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <AlertTriangle size={12} /> Low Stock
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1 rounded-lg">
                        {pieza.numero_parte || 'N/A'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{pieza.nombre}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">{pieza.categoria}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available</p>
                      <p className={`text-2xl font-black ${stockCritico ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {pieza.cantidad} <span className="text-sm font-bold text-slate-600">{pieza.unidad_medida || 'Pza'}</span>
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setPiezaActiva(pieza)}
                      className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/30 font-bold px-6 py-4 rounded-2xl transition-all shadow-lg"
                    >
                      Use Part
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}