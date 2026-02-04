import { useState } from 'react';
import { Play, Eye, FileText, ExternalLink } from 'lucide-react';
import { videos } from '../data';
import { Link } from 'react-router-dom';

export default function Tutorials() {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="serif-font text-5xl text-stone-900">Video Tutorials</h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto font-light">
          Visual guides extracted from our binding articles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <div key={video.id} className="group bg-white rounded-xl overflow-hidden paper-shadow border border-stone-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col">
            <div className="aspect-video w-full relative bg-stone-200">
              {playingVideoId === video.id ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                />
              ) : (
                <button
                  onClick={() => setPlayingVideoId(video.id)}
                  className="w-full h-full relative block cursor-pointer group/video"
                  aria-label={`Play video: ${video.title}`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/30 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center pl-1 group-hover/video:scale-110 transition-transform duration-300 relative z-10 shadow-lg">
                      <Play className="fill-stone-900 text-stone-900" size={24} />
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h3 className="serif-font text-xl text-stone-900 mb-2 font-bold line-clamp-2">
                {video.title}
              </h3>

              <div className="mb-4">
                <Link
                  to={`/articles/${video.articleId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium tracking-wide transition-colors"
                >
                  <FileText size={12} /> From: <span className="underline decoration-stone-300 underline-offset-2">{video.articleTitle}</span>
                </Link>
              </div>

              <div className="mt-auto border-t border-stone-100 pt-4">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-xs text-stone-500 hover:text-stone-800 font-bold uppercase tracking-wider transition-colors"
                >
                  <span className="flex items-center gap-1"><Eye size={12} /> YouTube</span>
                  <span className="flex items-center gap-1">Watch Externally <ExternalLink size={10} /></span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-stone-100 rounded-xl text-center">
        <h2 className="serif-font text-2xl text-stone-800 mb-4">Want to learn more?</h2>
        <p className="text-stone-600 mb-6">Check out our written <a href="/articles" className="underline decoration-stone-400 hover:text-stone-900">Articles & Guides</a> for detailed theory and diagrams.</p>
      </div>
    </div>
  );
}
