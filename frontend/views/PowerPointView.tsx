
import React, { useState } from 'react';
import { PILLARS } from '../data';
import { Indicator } from '../types';

interface Slide {
  id: string;
  title: string;
  comments: string;
  pillarId: string;
  indicatorId: string;
  showGraph: boolean;
}

const PowerPointView: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', title: 'Executive Summary', comments: 'Introduction to the quarterly performance results.', pillarId: '', indicatorId: '', showGraph: false }
  ]);
  const [activeSlideId, setActiveSlideId] = useState('1');

  const addSlide = () => {
    const newId = Date.now().toString();
    setSlides([...slides, { id: newId, title: 'New Slide', comments: '', pillarId: '', indicatorId: '', showGraph: false }]);
    setActiveSlideId(newId);
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (activeSlideId === id) setActiveSlideId(newSlides[0].id);
  };

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const selectedPillar = PILLARS.find(p => p.id === activeSlide.pillarId);
  const indicators = selectedPillar ? selectedPillar.outputs.flatMap(o => o.indicators) : [];
  const selectedIndicator = indicators.find(i => i.id === activeSlide.indicatorId);

  return (
    <div className="h-full flex flex-col space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">PPT Draft Builder</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500 font-medium">Prepare your presentation storyboard and data visualizations.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Slide Navigator */}
        <div className="w-full md:w-48 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-4 md:pb-0 shrink-0 custom-scrollbar">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              className={`relative shrink-0 w-32 md:w-full aspect-video rounded-xl border-2 transition-all p-3 text-left flex flex-col justify-between group ${
                activeSlideId === slide.id 
                  ? 'border-blue-500 bg-white shadow-lg ring-4 ring-blue-500/10' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Slide {index + 1}</span>
                {slides.length > 1 && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded-md transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight uppercase tracking-tight">{slide.title || 'Untitled'}</p>
            </button>
          ))}
          <button 
            onClick={addSlide}
            className="shrink-0 w-32 md:w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all space-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Add Slide</span>
          </button>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
            <div className="space-y-4">
              <input 
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
                placeholder="Slide Title..."
                className="w-full text-2xl md:text-3xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 p-0"
              />
              <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presenter Comments</label>
                  <textarea 
                    value={activeSlide.comments}
                    onChange={(e) => updateSlide(activeSlide.id, { comments: e.target.value })}
                    placeholder="Add your speech notes or observations here..."
                    className="w-full min-h-[200px] p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition-all outline-none text-sm font-semibold leading-relaxed shadow-inner placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl space-y-4">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Data Integration</h4>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <select 
                        value={activeSlide.pillarId}
                        onChange={(e) => updateSlide(activeSlide.id, { pillarId: e.target.value, indicatorId: '' })}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-blue-500 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="">-- Choose Pillar --</option>
                        {PILLARS.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div className="relative">
                      <select 
                        value={activeSlide.indicatorId}
                        onChange={(e) => updateSlide(activeSlide.id, { indicatorId: e.target.value })}
                        disabled={!activeSlide.pillarId}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-blue-500 focus:ring-0 appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Indicator --</option>
                        {indicators.map(i => <option key={i.id} value={i.id} className="bg-slate-900">{i.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <button 
                      onClick={() => updateSlide(activeSlide.id, { showGraph: !activeSlide.showGraph })}
                      disabled={!activeSlide.indicatorId}
                      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeSlide.showGraph 
                          ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {activeSlide.showGraph ? 'Remove Graph' : 'Add Graph Visual'}
                    </button>
                  </div>
                </div>

                {/* Graph Preview Area */}
                <div className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all ${
                  activeSlide.showGraph && selectedIndicator ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-transparent'
                }`}>
                  {activeSlide.showGraph && selectedIndicator ? (
                    <div className="w-full h-full flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">Quarterly Progress Graph Preview</p>
                      <div className="flex-1 flex items-end justify-around space-x-2">
                        {[
                          { l: 'Q1', v: selectedIndicator.targets?.q1 },
                          { l: 'Q2', v: selectedIndicator.targets?.q2 },
                          { l: 'Q3', v: selectedIndicator.targets?.q3 },
                          { l: 'Q4', v: selectedIndicator.targets?.q4 },
                        ].map((q, i) => {
                          const val = Number(String(q.v).replace(/[^0-9.]/g, '')) || 0;
                          const height = Math.min(Math.max((val / 20000) * 100, 10), 100);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                              <div 
                                className="w-full bg-blue-600 rounded-t-lg transition-all duration-700 hover:bg-blue-400 shadow-sm"
                                style={{ height: `${height}%` }}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap transition-opacity">
                                  {q.v}
                                </div>
                              </div>
                              <span className="text-[9px] font-black text-slate-400 mt-2">{q.l}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center opacity-30">
                      <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      <p className="text-xs font-bold">No Graph Selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerPointView;
