'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, Camera, Plus, Trash2, FileSignature } from 'lucide-react';

export default function CustomReportGenerator() {
  // ... aquí ya siguen tus estados (useState)
  // Estados para el formulario
  const [title, setTitle] = useState('Solar Panel Preventive Maintenance');
  const [equipment, setEquipment] = useState('Main Roof Array A');
  const [technician, setTechnician] = useState('Carlos Rodriguez');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('4.5 Hours');
  const [description, setDescription] = useState('Complete washing of solar panels to remove dust and bird droppings. Checked wiring connections for any signs of degradation or sulfation. Output efficiency returned to 98%.');
  const [images, setImages] = useState<string[]>([]);
  // 👇 NUEVO: Código para detectar al técnico en curso automáticamente
  useEffect(() => {
    async function getTechName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Busca el nombre completo, si no hay, pone la primera parte de su correo
        const nombreReal = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Técnico';
        setTechnician(nombreReal);
      }
    }
    getTechName();
  }, []);

  // Manejar subida de imágenes (Convierte la imagen a URL temporal para verla)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImagesUrls = filesArray.map(file => URL.createObjectURL(file));
      // Máximo 4 imágenes para que quepan bien en 1 hoja PDF
      setImages(prev => [...prev, ...newImagesUrls].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
      
      {/* 1. BUILDER / FORMULARIO (Se oculta al imprimir) */}
      <div className="print:hidden mb-8 bg-[#0f172a] p-6 rounded-xl shadow-lg border border-slate-800 text-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <FileSignature className="text-[#00d084]" size={24} />
          <h2 className="text-xl font-bold text-white tracking-wide">Custom Field Report Builder</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Activity Title</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solar Panel Preventive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Asset / Location</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Technician(s)</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
              <input 
                type="date" 
                className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">Total Time</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2 Hours"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-1">Detailed Description & Findings</label>
          <textarea 
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        {/* Panel de Fotos */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
          <label className="block text-sm font-medium text-slate-400 mb-3">Photographic Evidence (Max 4)</label>
          <div className="flex gap-4 flex-wrap">
            {images.map((img, index) => (
              <div key={index} className="relative w-32 h-32 rounded-lg border border-slate-700 overflow-hidden group">
                <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {images.length < 4 && (
              <label className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-[#00d084] hover:border-[#00d084] cursor-pointer transition-colors bg-slate-800">
                <Camera size={24} className="mb-2" />
                <span className="text-xs font-semibold uppercase">Add Photo</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handlePrint}
            className="bg-[#00d084] text-slate-900 px-8 py-3 rounded-lg font-bold hover:bg-[#00b370] flex items-center gap-2 transition-colors shadow-lg shadow-[#00d084]/20"
          >
            <Printer size={20} /> Generate PDF Report
          </button>
        </div>
      </div>

      {/* 2. THE OFFICIAL PDF DOCUMENT (Hoja Blanca) */}
      <div className="max-w-4xl mx-auto bg-white p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 print:w-full">
        
        {/* Encabezado Kinetix / JBI */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-[#00d084] rounded-sm"></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">KINETIX <span className="font-light">Pro</span></h1>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">JBI Manufacturing Operations</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase">Field Service Report</h2>
            <p className="text-sm text-slate-500 mt-1">Date: <span className="font-medium text-slate-700">{date}</span></p>
          </div>
        </div>

        {/* Título de la actividad */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">{title || 'Untitled Activity'}</h3>
          <p className="text-slate-500 font-medium mt-1">Location / Asset: <span className="text-slate-800 font-bold">{equipment || 'N/A'}</span></p>
        </div>

        {/* Detalles del técnico */}
        <div className="flex justify-between border-b border-slate-200 pb-4 mb-6">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Executed By</p>
            <p className="text-lg font-bold text-slate-800">{technician || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Time Invested</p>
            <p className="text-lg font-bold text-slate-800">{duration || 'N/A'}</p>
          </div>
        </div>

        {/* Descripción de los trabajos */}
        <div className="mb-8 min-h-[150px]">
          <p className="text-xs text-slate-800 font-bold uppercase tracking-widest mb-3 border-b-2 border-[#00d084] inline-block pb-1">Activity Details & Findings</p>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {description || 'No description provided.'}
          </p>
        </div>

        {/* Evidencia Fotográfica (Se acomoda automático) */}
        {images.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-slate-800 font-bold uppercase tracking-widest mb-3 border-b-2 border-[#00d084] inline-block pb-1">Photographic Evidence</p>
            <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'}`}>
              {images.map((img, index) => (
                <div key={index} className="border-2 border-slate-200 rounded-lg overflow-hidden aspect-[4/3]">
                  <img src={img} alt={`Evidence ${index + 1}`} className="w-full h-full object-contain bg-slate-50" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firmas de Autorización */}
        <div className="mt-16 pt-8 flex justify-around print:break-inside-avoid">
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-12 flex items-end justify-center pb-1">
               {/* Aquí el técnico podría rayar su firma real si se imprime */}
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Technician Signature</p>
            <p className="text-[10px] text-slate-400 mt-1">{technician}</p>
          </div>
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-12"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Manager Approval</p>
            <p className="text-[10px] text-slate-400 mt-1">JBI Management</p>
          </div>
        </div>

      </div>
    </div>
  );
}