import { galleryImages } from '../data';

export default function Gallery() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="serif-font text-5xl text-stone-900">Binding Gallery</h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto font-light">
          A collection of beautiful bindings to inspire your next project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {galleryImages.map((img, idx) => (
          <div key={idx} className="group bg-white p-3 pb-6 rounded-sm paper-shadow hover:shadow-lg transition-all duration-300">
            <div className="w-full aspect-square mb-4 relative overflow-hidden bg-stone-100">
              <img
                src={img.image}
                alt={img.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 mix-blend-multiply" />
            </div>
            <p className="serif-font text-center text-stone-800 text-lg italic leading-tight px-4 min-h-[3rem] flex items-center justify-center">
              "{img.caption}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
