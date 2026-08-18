// @ts-nocheck
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Camera, Send, CheckCircle, AlertCircle, HardHat } from "lucide-react"

export default function SubirGastoAlbanil() {
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Materiales")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto || !monto) return
    setCargando(true)

    try {
      let evidenciaUrl = null

      // 1. Si subió una foto del ticket, la guardamos en el Storage de Supabase que creamos antes
      if (archivo) {
        const nombreArchivo = `${Date.now()}-${archivo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("tickets_obra")
          .upload(nombreArchivo, archivo)

        if (uploadError) throw uploadError

        // Obtenemos la URL pública de la foto del ticket
        const { data: publicUrlData } = supabase.storage
          .from("tickets_obra")
          .getPublicUrl(nombreArchivo)

        evidenciaUrl = publicUrlData.publicUrl
      }

      // 2. Insertamos el gasto en la tabla para que a Rafael le aparezca como "Pendiente"
      const { error: insertError } = await supabase
        .from("gastos_tijuana")
        .insert([{
          concepto,
          monto: parseFloat(monto),
          categoria,
          evidencia_url: evidenciaUrl,
          registrado_por: "Maestro Albañil",
          estatus: "Pendiente"
        }])

      if (insertError) throw insertError

      setExito(true)
      setConcepto("")
      setMonto("")
      setArchivo(null)
      setTimeout(() => setExito(false), 4000)

    } catch (err: any) {
      alert("Error al registrar gasto: " + err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-[#0B1221] border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <HardHat size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">Reporte de Gasto - Obra</h1>
          <p className="text-slate-400 text-sm mt-1">Sube tu ticket o nota de compra al sistema de corporativo.</p>
        </div>

        {exito ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle size={48} className="mx-auto" />
            <h3 className="font-bold text-lg">¡Gasto registrado con éxito!</h3>
            <p className="text-xs text-slate-300">Rafael lo revisará y aprobará en su panel financiero.</p>
            <button onClick={() => setExito(false)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">
              Registrar Otro Gasto
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Concepto de la compra / gasto</label>
              <input 
                required
                type="text"
                placeholder="Ej. 10 Sacos de Yeso / Arena" 
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monto ($ MXN)</label>
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0.00" 
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-emerald-500 outline-none font-black text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
              <select 
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-slate-200 focus:border-emerald-500 outline-none cursor-pointer text-sm font-bold"
              >
                <option value="Materiales">Materiales e Insumos</option>
                <option value="Albañil">Mano de Obra / Anticipo</option>
                <option value="Misceláneas">Misceláneas / Viáticos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Foto del Ticket / Factura</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-[#070B14] hover:border-emerald-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                  <Camera size={28} className="mb-2 text-emerald-400" />
                  <p className="text-xs font-bold">{archivo ? archivo.name : "Toma una foto o sube archivo"}</p>
                </div>
                <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-base mt-4"
            >
              {cargando ? "Enviando reporte..." : <><Send size={20} /> ENVIAR TICKET A CORPORATIVO</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}