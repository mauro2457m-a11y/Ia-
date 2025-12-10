import React from 'react';

interface BookCoverProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  loading?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({ title, subtitle, imageUrl, loading }) => {
  return (
    <div className={`relative w-full max-w-md aspect-[3/4] rounded-r-lg rounded-l-sm shadow-2xl overflow-hidden transition-all duration-500 ${loading ? 'animate-pulse bg-slate-700' : 'bg-slate-800'}`}>
      {/* Binding/Spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/20 to-transparent z-20 mix-blend-overlay"></div>
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/10 z-20"></div>

      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Book Cover" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-50" />
      )}

      {/* Overlay for text legibility if needed, but usually we want the art to shine. 
          We add a subtle gradient at the bottom for the title. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 flex flex-col justify-end p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide uppercase drop-shadow-md mb-2 leading-tight">
          {title}
        </h1>
        <p className="text-lg text-indigo-200 font-medium drop-shadow-sm">
          {subtitle}
        </p>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Desenhando Capa...</span>
          </div>
        </div>
      )}
    </div>
  );
};
