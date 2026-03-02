import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, ...props }: InputProps) => {
  return (
    <div className="flex flex-col text-left space-y-1 group">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-focus-within:text-[#f29100] transition-colors">
        {label}
      </label>
      <input 
        {...props}
        className="w-full px-4 py-3 bg-[#f0f4f8] border-b-2 border-transparent focus:border-[#f29100] text-gray-800 outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
};