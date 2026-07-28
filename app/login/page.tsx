// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔴 CANDADO MAESTRO: Limpiamos la memoria en cuanto el usuario pisa esta pantalla
  useEffect(() => {
    sessionStorage.removeItem('saludoKinetix');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError("Invalid corporate credentials. Access denied.")
      setLoading(false)
    } else if (data.session) {
      // 🔴 TRUCO MAESTRO: Forzamos una recarga limpia para que el Splash Screen arranque sí o sí
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* EFECTOS DE LUZ DE FONDO */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full bg-[#0B1121] border border-slate-800 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* LOGO KINETIX PRO EXACTO */}
        <div className="flex flex-col items-center mb-10">
          
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6 transition-transform hover:scale-105 duration-300">
            {/* EL RAYO EXACTO DE LA FOTO */}
            <svg className="w-12 h-12 text-[#070B14]" fill="currentColor" viewBox="0 0 24 24">
               <path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            KINETIX <span className="text-emerald-500 font-medium">Pro</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Corporate Access Portal</p>
          
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              placeholder="user@jbi.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center font-bold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg py-3.5 rounded-xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_10px_25px_rgba(16,185,129,0.4)] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* LEYENDA CORPORATIVA INFERIOR */}
      <div className="absolute bottom-8 flex flex-col items-center text-slate-500 text-sm z-10">
        <p className="font-bold tracking-[0.2em] uppercase mb-1 text-slate-400 text-xs">
          JBI Corporate Operations • Nogales
        </p>
        <p className="text-slate-600 text-xs font-semibold">
          Kinetix Pro CMMS &copy; {new Date().getFullYear()}
        </p>
      </div>

    </div>
  )
}