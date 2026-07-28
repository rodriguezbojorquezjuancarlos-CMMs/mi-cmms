"use client"

import React from 'react'

export default function DashboardEjecutivo() {
  return (
    <div className="space-y-6">
      
      {/* HEADER EJECUTIVO */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Operational Management Report</h1>
          <p className="text-slate-400 mt-1">Real-time financial and availability metrics</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-[#0B1121] border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500">
            <option>This Month (July 2026)</option>
            <option>Previous Quarter</option>
            <option>YTD (Year-to-Date)</option>
          </select>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* TARJETAS FINANCIERAS Y DE ALTO IMPACTO (Métricas de dinero y tiempo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Costo de Tiempo Muerto */}
        <div className="bg-[#0B1121] border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Downtime Cost</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">$14,250</h3>
            <span className="text-sm font-bold text-red-400 mb-1 flex items-center">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               +5.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Machine downtime impact (USD)</p>
        </div>

        {/* Disponibilidad Global */}
        <div className="bg-[#0B1121] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Global Availability</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">98.4%</h3>
            <span className="text-sm font-bold text-emerald-400 mb-1 flex items-center">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
               +1.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Above corporate target (95%)</p>
        </div>

        {/* Ahorro por Preventivo */}
        <div className="bg-[#0B1121] border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Preventive Savings</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">$32,400</h3>
            <span className="text-sm font-bold text-emerald-400 mb-1 flex items-center">ROI</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Avoiding catastrophic failures (USD)</p>
        </div>

        {/* Ratio Preventivo / Correctivo */}
        <div className="bg-[#0B1121] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PM vs Corrective Ratio</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">85 / 15</h3>
          </div>
          {/* Barra de progreso visual */}
          <div className="w-full h-2 bg-red-500/30 rounded-full mt-3 flex">
            <div className="h-full bg-emerald-500 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: '85%' }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">World-class optimum: 80/20</p>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Gráfica de Tendencia de Eficiencia OEE */}
        <div className="bg-[#0B1121] border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white tracking-wide">Efficiency Trend (OEE)</h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">Stable</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 border-b border-l border-slate-700/50 pb-2 pl-2 relative">
            {/* Simulación de gráfica de barras corporativa */}
            {[65, 70, 68, 85, 92, 90, 95].map((height, i) => (
              <div key={i} className="w-full group relative flex justify-center">
                {/* Tooltip Hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                  {height}%
                </div>
                <div 
                  style={{ height: `${height}%` }} 
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${height > 80 ? 'bg-gradient-to-t from-emerald-600/20 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-gradient-to-t from-slate-700/50 to-slate-600'}`}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium px-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>

        {/* Top Máquinas que generan gasto */}
        <div className="bg-[#0B1121] border border-slate-800 p-6 rounded-2xl">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white tracking-wide">Top 3 Critical Assets (Expenses)</h3>
            <button className="text-emerald-500 text-sm hover:underline">View details</button>
          </div>
          
          <div className="space-y-5">
            {/* Máquina 1 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-white">5-Axis Machining Center</span>
                <span className="text-red-400 font-mono">$8,500</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[75%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              </div>
            </div>

            {/* Máquina 2 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-white">Precision CNC Lathe</span>
                <span className="text-orange-400 font-mono">$4,200</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[45%] shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
              </div>
            </div>

            {/* Máquina 3 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-white">Main Compressor (Plant 1)</span>
                <span className="text-yellow-400 font-mono">$1,550</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 w-[20%] shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}