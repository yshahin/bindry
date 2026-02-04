import { BookOpen, Tag } from 'lucide-react';
import { articles } from '../data';
import { Link } from 'react-router-dom';

export default function Articles() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="animate-fade-in space-y-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="serif-font text-5xl text-stone-900">Journal & Notes</h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto font-light">
            Documentation of techniques, paper types, and binding theories for the modern craftsperson.
          </p>
        </div>

        <div className="grid gap-8">
          {articles.map((article) => (
            <Link
              to={`/articles/${article.id}`}
              key={article.id}
              className="group bg-white rounded-xl overflow-hidden paper-shadow border border-stone-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col md:flex-row cursor-pointer"
            >
              <div className="h-48 md:h-auto md:w-64 relative flex items-center justify-center bg-stone-100">
                <img
                  src={article.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs font-bold text-stone-400 mb-3 uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-stone-600">
                    <Tag size={12} /> {article.category}
                  </span>
                  <span>•</span>
                  <span>{article.date}</span>
                </div>

                <h2 className="serif-font text-3xl text-stone-800 mb-3 group-hover:text-stone-600 transition-colors">
                  {article.title}
                </h2>

                <p className="text-stone-600 mb-6 leading-relaxed">
                  {article.excerpt}
                </p>

                <div className="flex items-center text-stone-500 text-sm font-medium mt-auto">
                  Read Article <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
