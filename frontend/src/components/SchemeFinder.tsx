import React, { useState } from 'react';
import { SearchCode, HelpCircle, ChevronDown, ChevronUp, CheckCircle, Award, Landmark, Globe } from 'lucide-react';

interface Scheme {
  id: number;
  title: string;
  description: string;
  eligibility: string;
  benefit: string;
  state: string;
}

interface SchemeFinderProps {
  schemes: Scheme[];
}

export const SchemeFinder: React.FC<SchemeFinderProps> = ({ schemes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredSchemes = schemes.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.eligibility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-50 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Landmark size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Indian Government Schemes</h3>
            <p className="text-xs text-gray-400">Personalized programs matching your profile</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search schemes, criteria, benefits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300 w-full sm:w-64"
          />
          <SearchCode size={14} className="absolute left-3 text-gray-400" />
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-semibold">No matching government schemes found.</p>
          <p className="text-xs mt-1">Try modifying your search text or update your profile in the header.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((scheme) => {
            const isExpanded = expandedId === scheme.id;
            return (
              <div 
                key={scheme.id}
                className={`border rounded-2xl p-5 text-left transition-all duration-300 bg-white ${
                  isExpanded 
                    ? 'border-orange-500 shadow-sm shadow-orange-500/5' 
                    : 'border-orange-100/50 hover:border-orange-200'
                }`}
              >
                {/* Upper row: Title & state */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[9px] font-bold bg-orange-100/60 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2.5 inline-block">
                      {scheme.state === 'All' ? 'All India Scheme' : `${scheme.state} State`}
                    </span>
                    <h4 className="text-sm font-bold text-gray-800 leading-snug">{scheme.title}</h4>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(scheme.id)}
                    className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-orange-50 space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle size={10} />
                        Eligibility Criteria
                      </span>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed pl-3.5 border-l-2 border-orange-100">
                        {scheme.eligibility}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Award size={10} />
                        Benefits & Scope
                      </span>
                      <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed pl-3.5 border-l-2 border-orange-200">
                        {scheme.benefit}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
