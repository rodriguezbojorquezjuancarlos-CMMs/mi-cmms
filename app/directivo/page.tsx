// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function DashboardDirectivoPage() {
  const [metricas, setMetricas] = useState({ mttrText: "00h 00m", cumplimiento: 0, valorInventario: 0 })
  const [datosCostos, setDatosCostos] = useState<any[]>([])
  const [datosFallas, setDatosFallas] = useState<any[]>([])
  const [datosCumplimiento, setDatosCumplimiento] = useState<any[]>([])
  const [datosTipos, setDatosTipos] = useState<any[]>([])
  const [datosVolumen, setDatosVolumen] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDashboard() {
      // Cargamos por separado para que si uno falla, no tire todo
      const { data: ordenesData } = await supabase.from("ordenes_trabajo").select("*, equipos(nombre)").order("creado_at", { ascending: false })
      const { data: refaccionesData } = await supabase.from("refacciones").select("cantidad, costo")

      const ordenes = ordenesData || [];
      const refacciones = refaccionesData || [];

      // -- VALOR DE INVENTARIO --
      let valorTotal = 0;
      refacciones.forEach(r => valorTotal += (Number(r.cantidad) * Number(r.costo || 0)));

      // -- CUMPLIMIENTO DE PREVENTIVOS -- (Logic remains in Spanish for DB match)
      const preventivosTotales = ordenes.filter(o => o.tipo_mantenimiento === 'Preventivo').length;
      const preventivosCerrados = ordenes.filter(o => o.tipo_mantenimiento === 'Preventivo' && o.estatus === 'Cerrada').length;
      let porcentajeCumplimiento = 0;
      
      if (preventivosTotales > 0) {
        porcentajeCumplimiento = Math.round((preventivosCerrados / preventivosTotales) * 100);
      }

      setDatosCumplimiento([
        { name: 'Completed', value: preventivosCerrados },
        { name: 'Pending', value: preventivosTotales > 0 ? preventivosTotales - preventivosCerrados : 1 } // 1 avoids exploding chart
      ]);

      // -- RATIO PM VS CM --
      const correctivos = ordenes.filter(o => o.tipo_mantenimiento !== 'Preventivo').length;
      setDatosTipos([
        { name: 'Preventive (PM)', value: preventivosTotales },
        { name: 'Corrective (CM)', value: correctivos > 0 ? correctivos : (preventivosTotales === 0 ? 1 : 0) } 
      ]);

      // -- MTTR, COSTOS Y TOP FALLAS POR MÁQUINA --
      let totalMilisegundos = 0;
      let ordenesValidas = 0;
      const maquinasMap: Record<string, { fallas: number, horasParo: number }> = {};

      ordenes.forEach(o => {
        if (o.estatus === 'Cerrada' && o.hora_inicio && o.hora_fin) {
          const diff = new Date(o.hora_fin).getTime() - new Date(o.hora_inicio).getTime();
          if (diff > 0) { totalMilisegundos += diff; ordenesValidas++; }
          
          if (o.tipo_mantenimiento !== 'Preventivo' && o.equipos?.nombre) {
            const nombre = o.equipos.nombre;
            if (!maquinasMap[nombre]) maquinasMap[nombre] = { fallas: 0, horasParo: 0 };
            maquinasMap[nombre].fallas += 1;
            maquinasMap[nombre].horasParo += (diff / 3600000);
          }
        }
      });

      let mttrFormateado = "00h 00m";
      if (ordenesValidas > 0) {
        const mttrPromedio = totalMilisegundos / ordenesValidas;
        mttrFormateado = `${Math.floor(mttrPromedio / 3600000).toString().padStart(2, '0')}h ${Math.floor((mttrPromedio % 3600000) / 60000).toString().padStart(2, '0')}m`;
      }
      setMetricas({ mttrText: mttrFormateado, cumplimiento: porcentajeCumplimiento, valorInventario: valorTotal })

      // RANKINGS
      let rankingBase = Object.keys(maquinasMap).map(n => ({
        name: n, 
        Failures: maquinasMap[n].fallas, 
        DowntimeCost: Math.round(maquinasMap[n].horasParo * 250) 
      }));

      // Dummy visual if no records exist
      if (rankingBase.length === 0) {
        rankingBase = [{ name: 'No records', Failures: 0, DowntimeCost: 0 }];
      }

      setDatosCostos([...rankingBase].sort((a, b) => b.DowntimeCost - a.DowntimeCost).slice(0, 5));
      setDatosFallas([...rankingBase].sort((a, b) => b.Failures - a.Failures).slice(0, 5));

      // -- TENDENCIA DE VOLUMEN (Últimos 7 Días) --
      // Changed to 'en-US' so days show as Mon, Tue, Wed, etc.
      const ultimos7Dias = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });
      const dataVol = ultimos7Dias.map(dia => ({ name: dia, Corrective: 0, Preventive: 0 }));
      
      ordenes.forEach(o => {
        const diaOrden = new Date(o.creado_at).toLocaleDateString('en-US', { weekday: 'short' });
        const index = dataVol.findIndex(d => d.name === diaOrden);
        if (index !== -1) {
          if (o.tipo_mantenimiento === 'Preventivo') dataVol[index].Preventive += 1;
          else dataVol[index].Corrective += 1;
        }
      });
      setDatosVolumen(dataVol);
      
      setCargando(false)
    }
    cargarDashboard()
  }, [])

  const COLORS_PIE = ['#10b981', '#334155']; 
  const COLORS_TIPO = ['#6366f1', '#ef4444']; 

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1121] border border-slate-700 p-4 rounded-xl shadow-2xl z-50">
          <p className="text-slate-300 font-bold mb-2 uppercase text-xs tracking-widest">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="font-bold text-sm flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (cargando) return <div className="p-8 text-indigo-400 font-bold animate-pulse text-center mt-20 text-xl tracking-widest uppercase">Processing business intelligence...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      
      <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Executive Dashboard</h1>
          <p className="text-slate-400 text-sm">Financial analysis, asset compliance, and failure telemetry</p>
        </div>
      </div>

      {/* TIER 1: MACRO MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900/40 to-[#0B1221] border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden group">
          <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">Operational Efficiency</p>
          <p className="text-slate-500 text-[10px] font-semibold mb-3">MEAN TIME TO REPAIR (MTTR)</p>
          <h3 className="text-4xl lg:text-5xl font-black text-white font-mono">{metricas.mttrText}</h3>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-900/20 to-[#0B1221] border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden group">
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Tied-Up Capital</p>
          <p className="text-slate-500 text-[10px] font-semibold mb-3">TOTAL SPARE PARTS VALUE</p>
          <h3 className="text-4xl lg:text-5xl font-black text-white">${metricas.valorInventario.toLocaleString('en-US')} <span className="text-xl text-emerald-500/50">USD</span></h3>
        </div>

        <div className="bg-gradient-to-br from-slate-800/40 to-[#0B1221] border border-slate-700 p-6 rounded-3xl relative overflow-hidden flex justify-between items-center">
          <div>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest mb-1">Compliance</p>
            <p className="text-slate-500 text-[10px] font-semibold mb-2">PM ROUTINES COMPLETED</p>
            <h3 className="text-4xl lg:text-5xl font-black text-white">{metricas.cumplimiento}%</h3>
          </div>
          <div className="w-24 h-24 lg:w-32 lg:h-32">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={datosCumplimiento} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                   {datosCumplimiento.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TIER 2: DISTRIBUCIÓN Y TENDENCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col justify-center items-center">
          <div className="w-full mb-2">
            <h3 className="text-white font-black text-lg">Work Order Ratio</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Preventive vs Corrective</p>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosTipos} cx="50%" cy="50%" outerRadius={70} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {datosTipos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_TIPO[index % COLORS_TIPO.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <div className="mb-4">
            <h3 className="text-white font-black text-lg">Volume Trend (7 Days)</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Workload entered into the system</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosVolumen} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                <Bar dataKey="Preventive" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} barSize={20} />
                <Bar dataKey="Corrective" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TIER 3: LOS "MALOS ACTORES" (TOP PROBLEMAS Y COSTOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP FALLAS */}
        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <div className="mb-6">
            <h3 className="text-amber-400 font-black text-lg">Top 5: Machines with Most Failures</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Corrective incident volume</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosFallas} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b', opacity: 0.4}} content={<CustomTooltip />} />
                <Bar dataKey="Failures" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20}>
                  {datosFallas.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP COSTOS */}
        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <div className="mb-6">
            <h3 className="text-red-400 font-black text-lg">Top 5: Financial Impact by Downtime</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Simulated downtime at $250 USD / Hour</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosCostos} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(value) => `$${value}`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: '#0B1121', borderColor: '#334155', color: '#fff', borderRadius: '10px' }} formatter={(value) => [`$${value} USD`, 'Estimated Impact']} />
                <Bar dataKey="DowntimeCost" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                  {datosCostos.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}