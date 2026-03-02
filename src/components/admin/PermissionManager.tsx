import React from 'react';

interface Asignacion {
  id: string;
  can_create: boolean;
  can_delete: boolean;
  can_nok: boolean;
}

interface Servicio {
  id: string;
  nombre_servicio: string;
  provincia: string;
}

interface PermissionManagerProps {
  servicio: Servicio;
  asignacion: Asignacion | undefined;
  onToggleModulo: (servicioId: string) => void;
  onUpdatePermiso: (asignacionId: string, campo: string, valor: boolean) => void;
}

export const PermissionManager = ({ 
  servicio, 
  asignacion, 
  onToggleModulo, 
  onUpdatePermiso 
}: PermissionManagerProps) => {
  const hasAccess = !!asignacion;

  return (
    <div className={`group border-2 transition-all duration-300 ${hasAccess ? 'border-black bg-white shadow-lg scale-[1.02]' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
      
      {/* HEADER: ACTIVACIÓN DEL CENTRO ESPECÍFICO */}
      <div className={`p-4 border-b flex justify-between items-center transition-colors ${hasAccess ? 'bg-black text-white' : 'bg-gray-100'}`}>
        <div className="overflow-hidden">
          <p className="font-black uppercase italic truncate leading-none text-[11px] tracking-tighter">{servicio.nombre_servicio}</p>
          <p className={`text-[8px] font-bold uppercase mt-1 ${hasAccess ? 'text-[#f29100]' : 'text-gray-400'}`}>{servicio.provincia}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={hasAccess} 
            onChange={() => onToggleModulo(servicio.id)} 
          />
          <div className="w-11 h-5 bg-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-5 after:transition-all peer-checked:bg-[#f29100]"></div>
        </label>
      </div>

      {/* BODY: SERVICIOS DETALLADOS */}
      <div className="p-4 bg-white">
        {hasAccess && asignacion ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center bg-gray-50 p-2 border-l-4 border-black">
              <PermissionCheckbox 
                label="Crear Registro" 
                checked={asignacion.can_create} 
                onChange={(val) => onUpdatePermiso(asignacion.id, 'can_create', val)} 
              />
              <PermissionCheckbox 
                label="Borrar" 
                checked={asignacion.can_delete} 
                hoverColor="group-hover:text-red-600"
                onChange={(val) => onUpdatePermiso(asignacion.id, 'can_delete', val)} 
              />
            </div>

            <div className="bg-[#f29100]/10 p-2 border-l-4 border-[#f29100] flex justify-between items-center">
              <span className="text-[8px] font-black uppercase italic text-[#f29100]">Piezas NOK:</span>
              <PermissionCheckbox 
                label="Habilitar Módulo" 
                checked={asignacion.can_nok} 
                onChange={(val) => onUpdatePermiso(asignacion.id, 'can_nok', val)} 
                hoverColor="group-hover:text-[#f29100]"
              />
            </div>
          </div>
        ) : (
          <div className="h-[76px] flex items-center justify-center">
             <p className="text-[9px] font-black uppercase text-gray-300 italic tracking-[0.3em]">Centro Desactivado</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PermissionCheckbox = ({ label, checked, onChange, hoverColor = "group-hover:text-black" }: { label: string, checked: boolean, onChange: (v: boolean) => void, hoverColor?: string }) => (
  <label className="flex items-center gap-2 cursor-pointer group/item">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
      className="w-4 h-4 accent-black cursor-pointer" 
    />
    <span className={`font-black uppercase text-[9px] italic transition-colors ${checked ? 'text-black' : 'text-gray-400'} ${hoverColor}`}>
      {label}
    </span>
  </label>
);