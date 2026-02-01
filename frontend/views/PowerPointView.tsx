import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PILLARS, QUARTERS, INDICATORS } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress } from '../utils/progressUtils';
import { formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';

interface GraphData {
  id: string;
  type: 'indicator' | 'pillar';
  pillarId: string;
  pillarName: string;
  indicatorId?: string;
  indicatorName?: string;
  quarterId: string;
  position: { x: number; y: number };
  data?: { q1: number; q2: number; q3: number; q4: number };
}

interface Slide {
  id: string;
  title: string;
  comments: string;
  hideComments: boolean;
  graphs: GraphData[];
}

interface PresenterInfo {
  name: string;
  email: string;
  title: string;
}

interface PowerPointViewProps {
  entries: MonitoringEntry[];
}

const PowerPointView: React.FC<PowerPointViewProps> = ({ entries }) => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: 'title', title: 'Quarterly Performance Report', comments: '', hideComments: true, graphs: [] },
    { id: '1', title: 'Executive Summary', comments: 'Introduction to the quarterly performance results.', hideComments: false, graphs: [] }
  ]);
  const [activeSlideId, setActiveSlideId] = useState('title');
  const [presenterInfo, setPresenterInfo] = useState<PresenterInfo>({ name: '', email: '', title: '' });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [presentSlideIndex, setPresentSlideIndex] = useState(0);

  // Graph addition modal
  const [showAddGraphModal, setShowAddGraphModal] = useState(false);
  const [graphType, setGraphType] = useState<'indicator' | 'pillar'>('pillar');
  const [selectedPillarId, setSelectedPillarId] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('');
  const [selectedQuarterId, setSelectedQuarterId] = useState('q1');

  // Dragging state
  const [draggingGraph, setDraggingGraph] = useState<string | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Calculate real pillar progress data with proper indicator exclusion
  const pillarProgressData = useMemo(() => {
    const data: Record<string, { q1: number; q2: number; q3: number; q4: number }> = {};

    PILLARS.forEach(pillar => {
      const pillarIndicators = pillar.outputs.flatMap(o => o.indicators || []);
      const qData = { q1: 0, q2: 0, q3: 0, q4: 0 };

      // Step 1: Identify indicators with NO targets in ANY quarter (exclude from all calculations)
      const indicatorsWithNoTargets = pillarIndicators.filter(indicator => {
        return Object.values(indicator.targets).every(t =>
          t === 0 || t === '-' || t === undefined || t === null || t === ''
        );
      });

      QUARTERS.forEach(quarter => {
        // Step 2: Identify indicators to exclude for this specific quarter
        // Q1: exclude if no Q1 target
        // Q2: exclude if no Q1+Q2 targets
        // Q3: exclude if no Q1+Q2+Q3 targets
        // Q4: exclude if no Q1+Q2+Q3+Q4 targets
        const indicatorsToExclude = pillarIndicators.filter(indicator => {
          if (indicatorsWithNoTargets.includes(indicator)) return true;

          const relevantTargets = {
            q1: indicator.targets.q1,
            q2: quarter.id === 'q2' ? indicator.targets.q2 : null,
            q3: quarter.id === 'q3' ? indicator.targets.q3 : null,
            q4: quarter.id === 'q4' ? indicator.targets.q4 : null
          };

          // Check if ALL relevant targets are empty/zero
          return Object.values(relevantTargets).every(t =>
            t === 0 || t === '-' || t === undefined || t === null || t === ''
          );
        });

        // Step 3: Calculate progress only for indicators WITH targets
        const validIndicators = pillarIndicators.filter(ind =>
          !indicatorsToExclude.includes(ind) &&
          !indicatorsWithNoTargets.includes(ind)
        );

        if (validIndicators.length === 0) {
          (qData as any)[quarter.id] = 0;
          return;
        }

        let totalPerf = 0;
        validIndicators.forEach(indicator => {
          const indicatorEntries = entries.filter(e => e.indicatorId === indicator.id);
          if (indicatorEntries.length > 0) {
            const result = calculateQuarterProgress({
              indicator,
              entries: indicatorEntries,
              quarterId: quarter.id,
              monthsInQuarter: quarter.months
            });
            totalPerf += Math.min(result.performance, 100);
          }
        });

        // Step 4: Average only the valid indicators
        (qData as any)[quarter.id] = Math.round(totalPerf / validIndicators.length);
      });

      data[pillar.id] = qData;
    });

    return data;
  }, [entries]);

  // Calculate annual progress with cumulative denominator approach
  const annualProgressData = useMemo(() => {
    const data: Record<string, { q1: number; q2: number; q3: number; q4: number }> = {};

    PILLARS.forEach(pillar => {
      const pillarIndicators = pillar.outputs.flatMap(o => o.indicators || []);
      const annualData = { q1: 0, q2: 0, q3: 0, q4: 0 };

      // Get indicators with NO targets in ANY quarter (exclude from all calculations)
      const indicatorsWithNoTargets = pillarIndicators.filter(indicator => {
        return Object.values(indicator.targets).every(t =>
          t === 0 || t === '-' || t === undefined || t === null || t === ''
        );
      });

      QUARTERS.forEach(quarter => {
        // For annual: cumulative inclusion (expanding denominator)
        // Q1: indicators with Q1 targets only
        // Q2: indicators with Q1 OR Q2 targets (cumulative)
        // Q3: indicators with Q1 OR Q2 OR Q3 targets (cumulative)
        // Q4: indicators with Q1 OR Q2 OR Q3 OR Q4 targets (full cumulative)

        const quarterIndex = QUARTERS.indexOf(quarter);
        const relevantQuarters = ['q1', 'q2', 'q3', 'q4'].slice(0, quarterIndex + 1);

        const cumulativeIndicators = pillarIndicators.filter(indicator => {
          if (indicatorsWithNoTargets.includes(indicator)) return false;

          // Check if indicator has ANY target in the relevant quarters
          return relevantQuarters.some(q =>
            indicator.targets[q] && indicator.targets[q] !== 0 && indicator.targets[q] !== '-'
          );
        });

        if (cumulativeIndicators.length === 0) {
          (annualData as any)[quarter.id] = 0;
          return;
        }

        let totalPerf = 0;
        cumulativeIndicators.forEach(indicator => {
          const indicatorEntries = entries.filter(e => e.indicatorId === indicator.id);
          if (indicatorEntries.length > 0) {
            const result = calculateQuarterProgress({
              indicator,
              entries: indicatorEntries,
              quarterId: quarter.id,
              monthsInQuarter: quarter.months
            });
            totalPerf += Math.min(result.performance, 100);
          }
        });

        // Calculate average of cumulative indicators
        (annualData as any)[quarter.id] = Math.round(totalPerf / cumulativeIndicators.length);
      });

      data[pillar.id] = annualData;
    });

    return data;
  }, [entries]);

  // Calculate indicator progress data
  const getIndicatorData = (indicatorId: string) => {
    const indicator = INDICATORS.find(i => i.id === indicatorId);
    if (!indicator) return { q1: 0, q2: 0, q3: 0, q4: 0 };

    const indicatorEntries = entries.filter(e => e.indicatorId === indicatorId);
    const qData = { q1: 0, q2: 0, q3: 0, q4: 0 };

    QUARTERS.forEach(quarter => {
      const result = calculateQuarterProgress({
        indicator,
        entries: indicatorEntries,
        quarterId: quarter.id,
        monthsInQuarter: quarter.months
      });
      (qData as any)[quarter.id] = Math.min(Math.round(result.performance), 100);
    });

    return qData;
  };

  const addSlide = () => {
    const newId = Date.now().toString();
    setSlides([...slides, { id: newId, title: 'New Slide', comments: '', hideComments: false, graphs: [] }]);
    setActiveSlideId(newId);
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1 || id === 'title') return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (activeSlideId === id) setActiveSlideId(newSlides[0].id);
  };

  const addGraph = () => {
    if (!selectedPillarId) return;

    const pillar = PILLARS.find(p => p.id === selectedPillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === selectedIndicatorId);

    // Get real data
    let graphData: { q1: number; q2: number; q3: number; q4: number };
    if (graphType === 'pillar') {
      graphData = pillarProgressData[selectedPillarId] || { q1: 0, q2: 0, q3: 0, q4: 0 };
    } else {
      graphData = getIndicatorData(selectedIndicatorId);
    }

    const newGraph: GraphData = {
      id: Date.now().toString(),
      type: graphType,
      pillarId: selectedPillarId,
      pillarName: pillar?.name || '',
      indicatorId: graphType === 'indicator' ? selectedIndicatorId : undefined,
      indicatorName: graphType === 'indicator' ? indicator?.name : undefined,
      quarterId: selectedQuarterId,
      position: { x: 50, y: 50 },
      data: graphData
    };

    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (activeSlide) {
      updateSlide(activeSlideId, { graphs: [...activeSlide.graphs, newGraph] });
    }

    setShowAddGraphModal(false);
    setSelectedPillarId('');
    setSelectedIndicatorId('');
  };

  const removeGraph = (graphId: string) => {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (activeSlide) {
      updateSlide(activeSlideId, { graphs: activeSlide.graphs.filter(g => g.id !== graphId) });
    }
  };

  const handleMouseDown = (graphId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingGraph(graphId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingGraph || !slideRef.current) return;

    const rect = slideRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (activeSlide) {
      const updatedGraphs = activeSlide.graphs.map(g =>
        g.id === draggingGraph ? { ...g, position: { x: Math.max(0, Math.min(80, x)), y: Math.max(0, Math.min(80, y)) } } : g
      );
      updateSlide(activeSlideId, { graphs: updatedGraphs });
    }
  };

  const handleMouseUp = () => {
    setDraggingGraph(null);
  };

  // Presentation mode keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresentMode) return;

      if (e.key === 'Escape') {
        setIsPresentMode(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        setPresentSlideIndex(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setPresentSlideIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentMode, slides.length]);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      slides.forEach((slide, index) => {
        if (index > 0) pdf.addPage();

        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        if (slide.id === 'title') {
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, pageHeight * 0.4, pageWidth, 50, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(32);
          pdf.setFont('helvetica', 'bold');
          pdf.text(slide.title, pageWidth / 2, pageHeight * 0.45, { align: 'center' });
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Presented by: ${presenterInfo.name || 'Presenter'}`, pageWidth / 2, pageHeight * 0.55, { align: 'center' });
          if (presenterInfo.email) {
            pdf.setFontSize(12);
            pdf.text(presenterInfo.email, pageWidth / 2, pageHeight * 0.62, { align: 'center' });
          }
          if (presenterInfo.title) {
            pdf.setFontSize(14);
            pdf.text(presenterInfo.title, pageWidth / 2, pageHeight * 0.70, { align: 'center' });
          }
          pdf.setFontSize(10);
          pdf.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, pageHeight * 0.85, { align: 'center' });
        } else {
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, pageWidth, 25, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text(slide.title, 20, 16);
          pdf.setFontSize(10);
          pdf.text(`Slide ${index + 1}`, pageWidth - 30, 16);

          let yPos = 35;
          if (slide.comments && !slide.hideComments) {
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(9);
            pdf.text('PRESENTER NOTES', 25, yPos + 10);
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(10);
            const lines = pdf.splitTextToSize(slide.comments, pageWidth - 50);
            pdf.text(lines.slice(0, 2), 25, yPos + 20);
            yPos += 40;
          }

          slide.graphs.forEach(graph => {
            const gX = 15 + (graph.position.x / 100) * (pageWidth - 100);
            const gY = yPos + (graph.position.y / 100) * (pageHeight - yPos - 30);

            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(gX, gY, 70, 50, 3, 3, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.text(graph.type === 'pillar' ? graph.pillarName : (graph.indicatorName || ''), gX + 5, gY + 10);

            // Draw bar chart with real data
            if (graph.data) {
              const barWidth = 12;
              const maxHeight = 25;
              const startX = gX + 10;
              const baseY = gY + 45;

              ['q1', 'q2', 'q3', 'q4'].forEach((q, i) => {
                const val = (graph.data as any)[q] || 0;
                const barHeight = (val / 100) * maxHeight;
                pdf.setFillColor(59, 130, 246);
                pdf.rect(startX + i * 15, baseY - barHeight, barWidth, barHeight, 'F');
                pdf.setFontSize(6);
                pdf.text(`${val}%`, startX + i * 15 + 2, baseY + 5);
              });
            }
          });
        }
      });

      pdf.save(`Presentation_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
    setIsGeneratingPDF(false);
  };

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const selectedPillar = PILLARS.find(p => p.id === selectedPillarId);
  const indicators = selectedPillar?.outputs.flatMap(o => o.indicators) || [];
  const isTitleSlide = activeSlide.id === 'title';

  // Get max value for scaling bars
  const getBarHeight = (value: number) => {
    return Math.max(5, (value / 100) * 50);
  };

  // Presentation Mode Full Screen
  if (isPresentMode) {
    const currentSlide = slides[presentSlideIndex];
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-6xl aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-12 relative overflow-hidden">
            {currentSlide.id === 'title' ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-5xl font-black text-white mb-6">{currentSlide.title}</h1>
                <div className="w-32 h-1.5 bg-blue-500 rounded-full mb-10"></div>
                <p className="text-2xl text-blue-400 font-bold mb-3">{presenterInfo.name || 'Presenter'}</p>
                <p className="text-lg text-slate-400">{presenterInfo.email}</p>
                <p className="text-xl text-slate-300 mt-3">{presenterInfo.title}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <h2 className="text-4xl font-black text-white mb-6">{currentSlide.title}</h2>
                <div className="w-24 h-1 bg-blue-500 rounded-full mb-8"></div>
                {currentSlide.comments && !currentSlide.hideComments && (
                  <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">{currentSlide.comments}</p>
                  </div>
                )}
                <div className="flex-1 relative">
                  {currentSlide.graphs.map(graph => (
                    <div
                      key={graph.id}
                      className="absolute bg-slate-800 rounded-2xl p-4 border border-slate-700"
                      style={{ left: `${graph.position.x}%`, top: `${graph.position.y}%`, width: '220px' }}
                    >
                      <p className="text-xs text-blue-400 font-bold uppercase mb-2">{graph.type === 'pillar' ? 'Pillar Progress' : 'Indicator'}</p>
                      <p className="text-sm font-semibold text-white mb-4">{graph.type === 'pillar' ? graph.pillarName : graph.indicatorName}</p>
                      <div className="flex items-end justify-around h-24 px-2">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
                          const val = graph.data ? (graph.data as any)[q.toLowerCase()] || 0 : 0;
                          return (
                            <div key={q} className="flex flex-col items-center">
                              <span className="text-xs font-bold text-blue-400 mb-1">{val}%</span>
                              <div
                                className="w-10 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                                style={{ height: `${getBarHeight(val)}px` }}
                              ></div>
                              <span className="text-[10px] text-slate-400 mt-1">{q}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Presentation Controls */}
        <div className="bg-slate-800 p-4 flex items-center justify-center gap-6">
          <button onClick={() => setPresentSlideIndex(prev => Math.max(0, prev - 1))} className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-white font-bold text-lg">{presentSlideIndex + 1} / {slides.length}</span>
          <button onClick={() => setPresentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))} className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => setIsPresentMode(false)} className="ml-8 px-4 py-2 bg-red-600 rounded-xl text-white font-bold hover:bg-red-500">
            Exit (ESC)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Add Graph Modal */}
      {showAddGraphModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add Graph with Real Data</h3>
              <button onClick={() => setShowAddGraphModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Graph Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setGraphType('pillar')} className={`flex-1 py-3 rounded-xl font-bold text-sm ${graphType === 'pillar' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Pillar Progress</button>
                  <button onClick={() => setGraphType('indicator')} className={`flex-1 py-3 rounded-xl font-bold text-sm ${graphType === 'indicator' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Indicator</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pillar</label>
                <select value={selectedPillarId} onChange={e => { setSelectedPillarId(e.target.value); setSelectedIndicatorId(''); }} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-medium">
                  <option value="">-- Select Pillar --</option>
                  {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {graphType === 'indicator' && selectedPillarId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Indicator</label>
                  <select value={selectedIndicatorId} onChange={e => setSelectedIndicatorId(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-medium">
                    <option value="">-- Select Indicator --</option>
                    {indicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              )}

              {/* Preview real data */}
              {selectedPillarId && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Data Preview</p>
                  <div className="flex justify-around">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
                      const data = graphType === 'pillar'
                        ? pillarProgressData[selectedPillarId]
                        : (selectedIndicatorId ? getIndicatorData(selectedIndicatorId) : null);
                      const val = data ? (data as any)[q.toLowerCase()] || 0 : 0;
                      return (
                        <div key={q} className="text-center">
                          <p className="text-lg font-bold text-blue-600">{val}%</p>
                          <p className="text-xs text-slate-400">{q}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button onClick={addGraph} disabled={!selectedPillarId || (graphType === 'indicator' && !selectedIndicatorId)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition">
              Add Graph to Slide
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Prepare PPT</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Build presentations with real data graphs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setPresentSlideIndex(0); setIsPresentMode(true); }} className="px-4 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Present</span>
          </button>
          <button onClick={generatePDF} disabled={isGeneratingPDF} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
            {isGeneratingPDF ? <span className="animate-spin">⏳</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Slide Navigator */}
        <div className="w-48 flex flex-col gap-3 overflow-y-auto pb-4 shrink-0">
          {slides.map((slide, index) => (
            <button key={slide.id} onClick={() => setActiveSlideId(slide.id)} className={`relative w-full aspect-video rounded-xl border-2 p-3 text-left transition-all group ${activeSlideId === slide.id ? 'border-blue-500 bg-white shadow-lg' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase">{slide.id === 'title' ? 'Title' : `Slide ${index}`}</span>
                {slide.id !== 'title' && slides.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeSlide(slide.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-800 line-clamp-2 mt-1">{slide.title || 'Untitled'}</p>
              {slide.graphs.length > 0 && <span className="absolute bottom-2 right-2 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{slide.graphs.length} graph{slide.graphs.length > 1 ? 's' : ''}</span>}
            </button>
          ))}
          <button onClick={addSlide} className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span className="text-[10px] font-black uppercase">Add Slide</span>
          </button>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {isTitleSlide ? (
              <div className="space-y-6">
                <input type="text" value={activeSlide.title} onChange={e => updateSlide(activeSlide.id, { title: e.target.value })} placeholder="Presentation Title..." className="w-full text-3xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 p-0" />
                <div className="h-1 w-20 bg-blue-500 rounded-full"></div>

                <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Presenter Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <input type="text" value={presenterInfo.name} onChange={e => setPresenterInfo({ ...presenterInfo, name: e.target.value })} placeholder="Name" className="bg-slate-800 border-2 border-slate-700 rounded-xl px-4 h-12 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-500" />
                    <input type="email" value={presenterInfo.email} onChange={e => setPresenterInfo({ ...presenterInfo, email: e.target.value })} placeholder="Email" className="bg-slate-800 border-2 border-slate-700 rounded-xl px-4 h-12 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-500" />
                    <input type="text" value={presenterInfo.title} onChange={e => setPresenterInfo({ ...presenterInfo, title: e.target.value })} placeholder="Title/Position" className="bg-slate-800 border-2 border-slate-700 rounded-xl px-4 h-12 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-500" />
                  </div>
                </div>

                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <h2 className="text-4xl font-black text-white mb-4">{activeSlide.title || 'Presentation Title'}</h2>
                  <div className="w-24 h-1 bg-blue-500 rounded-full mb-6"></div>
                  <p className="text-xl text-blue-400 font-bold">{presenterInfo.name || 'Presenter Name'}</p>
                  <p className="text-sm text-slate-400">{presenterInfo.email}</p>
                  <p className="text-lg text-slate-300 mt-2">{presenterInfo.title}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <input type="text" value={activeSlide.title} onChange={e => updateSlide(activeSlide.id, { title: e.target.value })} placeholder="Slide Title..." className="w-full text-3xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 p-0" />
                <div className="h-1 w-20 bg-blue-500 rounded-full"></div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase">Comments</label>
                      <button onClick={() => updateSlide(activeSlide.id, { hideComments: !activeSlide.hideComments })} className={`text-xs font-bold px-3 py-1 rounded-lg ${activeSlide.hideComments ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {activeSlide.hideComments ? 'Hidden' : 'Visible'}
                      </button>
                    </div>
                    <textarea value={activeSlide.comments} onChange={e => updateSlide(activeSlide.id, { comments: e.target.value })} placeholder="Add presenter notes..." className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none text-sm resize-none" />
                  </div>

                  <div className="w-64 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Data Graphs</label>
                    <button onClick={() => setShowAddGraphModal(true)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      Add Graph
                    </button>
                    <p className="text-xs text-slate-400 text-center">Graphs show real data from submissions</p>
                  </div>
                </div>

                {/* Slide Preview with Draggable Graphs */}
                <div ref={slideRef} className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl border-2 border-slate-200 relative overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                  <div className="absolute top-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-slate-800">{activeSlide.title}</h3>
                    {activeSlide.comments && !activeSlide.hideComments && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{activeSlide.comments}</p>
                    )}
                  </div>

                  {activeSlide.graphs.map(graph => (
                    <div
                      key={graph.id}
                      className={`absolute bg-white rounded-xl shadow-lg border-2 p-3 cursor-move transition-shadow ${draggingGraph === graph.id ? 'border-blue-500 shadow-xl' : 'border-slate-200 hover:border-blue-300'}`}
                      style={{ left: `${graph.position.x}%`, top: `${graph.position.y}%`, width: '200px' }}
                      onMouseDown={e => handleMouseDown(graph.id, e)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">{graph.type === 'pillar' ? 'Pillar' : 'Indicator'}</span>
                        <button onClick={() => removeGraph(graph.id)} className="p-1 hover:bg-red-50 rounded text-red-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-2">{graph.type === 'pillar' ? graph.pillarName : graph.indicatorName}</p>
                      <div className="flex items-end justify-around h-14 px-1">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
                          const val = graph.data ? (graph.data as any)[q.toLowerCase()] || 0 : 0;
                          return (
                            <div key={q} className="flex flex-col items-center">
                              <span className="text-[8px] font-bold text-blue-600 mb-0.5">{val}%</span>
                              <div
                                className="w-7 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                                style={{ height: `${Math.max(4, (val / 100) * 30)}px` }}
                              ></div>
                              <span className="text-[8px] text-slate-400 mt-0.5">{q}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {activeSlide.graphs.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <p className="text-sm font-medium">Click "Add Graph" to add real data visualizations</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerPointView;
