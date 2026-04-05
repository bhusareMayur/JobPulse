// client/src/components/Layout/Footer.tsx
import { Activity, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-3">
        
        {/* Project Purpose Message */}
        <div className="flex items-center space-x-2 text-gray-600 text-sm sm:text-base text-center bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>
            An educational simulation lab designed to analyze real-world industry trends and empower career readiness.
          </span>
        </div>
        
        {/* Developer Credit */}
        <div className="flex items-center justify-center pt-2">
          <div className="group flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-full text-sm text-slate-600 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
            <Code className="w-4 h-4 text-blue-500 group-hover:rotate-6 transition-transform duration-300" />
            <span>Designed & developed by</span>
            <a 
              href="https://www.linkedin.com/in/mayur-bhusare/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200"
            >
              Mayur Bhusare
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};