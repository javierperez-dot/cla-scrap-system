import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'filled';
}

export const Button = ({ children, variant = 'filled', className, ...props }: ButtonProps) => {
  const baseStyles = "w-full py-4 font-bold rounded-sm transition-all duration-300 uppercase tracking-widest text-xs shadow-sm active:scale-[0.98]";
  const variants = {
    outline: "border-2 border-[#f29100] text-[#f29100] hover:bg-[#f29100] hover:text-white",
    filled: "bg-[#f29100] text-white hover:bg-[#e68a00] border-2 border-[#f29100]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className || ''}`} 
      {...props}
    >
      {children}
    </button>
  );
};