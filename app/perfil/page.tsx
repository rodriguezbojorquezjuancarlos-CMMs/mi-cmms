'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Camera, Save, ArrowLeft } from 'lucide-react';

export default function PerfilUsuario() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nuevaFoto, setNuevaFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setNombre(user.user_metadata?.full_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setPreviewUrl(user.user_metadata?.avatar_url || null);
      }
      setCargando(false);
    }
    cargarPerfil();
  }, []);

  const manejarSubidaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNuevaFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let finalAvatarUrl = avatarUrl;

      // Si seleccionó una foto nueva, la subimos al bucket de "evidencias"
      if (nuevaFoto) {
        const fileExt = nuevaFoto.name.split('.').pop();
        const fileName = `avatares/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, nuevaFoto, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName);
        finalAvatarUrl = data.publicUrl;
      }

      // Actualizamos la metadata del usuario en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: nombre,
          avatar_url: finalAvatarUrl
        }
      });

      if (updateError) throw updateError;

      alert("Profile updated successfully!");
      // Recargamos la página para que el Sidebar detecte los cambios
      window.location.reload(); 
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert("Error saving profile: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-emerald-500 font-bold animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#070B14] p-6 text-slate-200 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm">Back</span>
        </button>

        <div className="bg-[#0B1121] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Account Settings</h1>
          <p className="text-slate-400 text-sm mb-8">Update your personal information and profile picture.</p>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Columna de la Foto */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden shadow-lg flex items-center justify-center group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-600" />
                )}
                
                {/* Overlay para cambiar foto */}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={manejarSubidaFoto} />
                </label>
              </div>
              <p className="text-xs text-slate-500 text-center max-w-[150px]">Click the image to upload a new avatar.</p>
            </div>

            {/* Columna de los Datos */}
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="w-full bg-[#070B14] border border-slate-800 text-slate-500 rounded-lg p-3 outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-600 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="e.g. Carlos Rodriguez"
                  className="w-full bg-[#070B14] border border-slate-700 text-white rounded-lg p-3 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={guardarPerfil} 
                  disabled={guardando}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {guardando ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save size={20} />
                  )}
                  {guardando ? 'SAVING CHANGES...' : 'SAVE PROFILE'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}