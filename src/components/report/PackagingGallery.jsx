import React, { useState } from 'react';
import { Layers, Eye, Maximize2 } from 'lucide-react';

export function PackagingGallery({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#68736B] rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10">
        No packaging view images attached to this record.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-[#17231C] flex items-center gap-2">
        <Layers className="w-4 h-4 text-[#123C2A]" />
        Uploaded Packaging Views ({images.length})
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const src = typeof img === 'string' ? img : (img?.imageUrl || img?.url || img?.previewUrl || '');
          const label = typeof img === 'string' ? `View ${idx + 1}` : (img?.label || img?.view || `View ${idx + 1}`);
          return (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden bg-black/5 border border-[#123C2A]/15 shadow-xs aspect-4/3 flex flex-col justify-end p-2 cursor-pointer"
              onClick={() => setSelectedImage(src)}
            >
              <img
                src={src}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="relative z-10 flex items-center justify-between text-white text-[11px] font-bold">
                <span className="truncate">{label}</span>
                <Maximize2 className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Zoom */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-[#FAF9F5] rounded-3xl overflow-hidden p-3 shadow-2xl">
            <img
              src={selectedImage}
              alt="High-resolution packaging view"
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="mt-3 w-full py-2 bg-[#123C2A] text-[#F5F3EA] text-xs font-bold rounded-xl"
            >
              Close Zoom View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
