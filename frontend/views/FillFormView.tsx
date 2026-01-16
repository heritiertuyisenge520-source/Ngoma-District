import React, { useState, useMemo } from 'react';
import SummaryCard from '../components/SummaryCard';
import { PILLARS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { API_ENDPOINTS, getSubmissionUrl } from '../config/api';

interface FillFormViewProps {
  entries: MonitoringEntry[];
  onAddEntry: (entry: MonitoringEntry) => void;
  onClear: () => void;
  initialEntry?: MonitoringEntry | null;
  onCancelEdit?: () => void;
  userEmail?: string;
  userRole?: string;
}

const FillFormView: React.FC<FillFormViewProps> = ({ entries, onAddEntry, onClear, initialEntry, onCancelEdit, userEmail, userRole }) => {
  const [pillarName, setPillarName] = useState('');
  const [indicatorId, setIndicatorId] = useState('');
  const [quarterId, setQuarterId] = useState('');
  const [month, setMonth] = useState('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [achievementValue, setAchievementValue] = useState<string>('');
  const [comments, setComments] = useState('');

  // Effect to handle editing mode
  React.useEffect(() => {
    if (initialEntry) {
      setPillarName(initialEntry.pillarName || initialEntry.pillarId);
      setIndicatorId(initialEntry.indicatorId);
      setQuarterId(initialEntry.quarterId);
      setMonth(initialEntry.month);
      setAchievementValue(initialEntry.value.toString());
      setComments(initialEntry.comments || '');

      // Handle sub-values if they exist and convert numbers to strings
      if (initialEntry.subValues) {
        const subs: Record<string, string> = {};
        Object.entries(initialEntry.subValues).forEach(([k, v]) => {
          subs[k] = v.toString();
        });
        setSubValues(subs);
      }
    }
  }, [initialEntry]);

  // Hierarchy Stats
  const stats = useMemo(() => {
    const pillarsCount = PILLARS.length;
    const outputsCount = PILLARS.reduce((acc, p) => acc + p.outputs.length, 0);
    const indicatorsCount = PILLARS.reduce((acc, p) => acc + p.outputs.flatMap(o => o.indicators).length, 0);
    return { pillarsCount, outputsCount, indicatorsCount };
  }, []);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.name === pillarName), [pillarName]);

  const indicators = useMemo(() => {
    if (!selectedPillar) return [];
    return selectedPillar.outputs.flatMap(o => o.indicators).map(indicator => ({
      id: indicator.id,
      name: indicator.name,
      isDual: indicator.isDual
    }));
  }, [selectedPillar]);

  const selectedIndicator = useMemo(() =>
    indicators.find(i => i.id === indicatorId),
    [indicators, indicatorId]
  );

  // Simple quarter and month data
  const QUARTERS = [
    { id: 'q1', name: 'Quarter 1', months: ['July', 'August', 'September'] },
    { id: 'q2', name: 'Quarter 2', months: ['October', 'November', 'December'] },
    { id: 'q3', name: 'Quarter 3', months: ['January', 'February', 'March'] },
    { id: 'q4', name: 'Quarter 4', months: ['April', 'May', 'June'] }
  ];

  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === quarterId), [quarterId]);
  const months = useMemo(() => selectedQuarter?.months || [], [selectedQuarter]);

  const [subValues, setSubValues] = useState<Record<string, string>>({});

  const handleSubValueChange = (label: string, value: string) => {
    setSubValues(prev => ({
      ...prev,
      [label]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarName || !indicatorId || !quarterId || !month) {
      alert("Please fill all required fields");
      return;
    }

    // Validation for dual indicators can be enhanced here if needed
    if (!selectedIndicator?.isDual && achievementValue === '') {
      return;
    }

    let finalValue = achievementValue !== '' ? Number(achievementValue) : 0;

    // Convert subValues to numbers for storage/payload
    const numericSubValues: Record<string, number> = {};
    Object.keys(subValues).forEach(key => {
      numericSubValues[key] = subValues[key] !== '' ? Number(subValues[key]) : 0;
    });

    // Auto-calculate percentage if using the 2-step input
    if (selectedIndicator?.measurementType === 'percentage' &&
      subValues['target_pop'] !== undefined &&
      subValues['achieved_pop'] !== undefined) {
      finalValue = (numericSubValues['achieved_pop'] / numericSubValues['target_pop']) * 100;
    }

    const payload = {
      pillarId: pillarName,
      pillarName: pillarName,
      indicatorId,
      indicatorName: selectedIndicator?.name || '',
      quarterId,
      month,
      value: finalValue,
      targetValue: targetValue ? Number(targetValue) : 0,
      subValues: selectedIndicator?.isDual || selectedIndicator?.measurementType === 'percentage' ? numericSubValues : undefined,
      comments,
      submittedBy: userEmail,
      timestamp: new Date().toISOString()
    };

    const isEditing = !!(initialEntry as any)?._id;
    const url = isEditing
      ? getSubmissionUrl((initialEntry as any)._id)
      : API_ENDPOINTS.SUBMISSIONS;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedData = await response.json();
        alert("you submitted your response in database");

        // Also update local list if needed, or just clear form
        onAddEntry({
          ...payload,
          _id: (savedData as any)._id || (initialEntry as any)?._id,
          outputId: '',
        } as any);

        if (!isEditing) {
          setIndicatorId('');
          setTargetValue('');
          setAchievementValue('');
          setSubValues({});
          setComments('');
        } else if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        console.error("Submission failed");
        alert("Failed to submit data.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error connecting to server.");
    }
  };

  // Improved Input Classes for better visibility and contrast
  const inputClasses = "w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 cursor-pointer appearance-none text-sm ring-offset-2";

  const chevronIcon = (
    <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {userRole === 'Assign employee' ? 'Submit the indicators' : 'Performance Entry'}
        </h1>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600 font-medium">Reporting monitoring data for Imihigo 2025-2026.</p>
      </header>

      {/* System Hierarchy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard
          title="Total Pillars"
          value={stats.pillarsCount}
          color="bg-indigo-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <SummaryCard
          title="Total Outputs"
          value={stats.outputsCount}
          color="bg-violet-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <SummaryCard
          title="Monitored Indicators"
          value={stats.indicatorsCount}
          color="bg-blue-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Form Section */}
        <div className="order-1">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">{initialEntry ? 'Edit Entry' : 'Data Entry'}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Provide monthly performance data for specific indicators.</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                    Submitting as: {userEmail}
                  </span>
                </div>
              </div>
              {initialEntry && onCancelEdit && (
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">1. Pillar</label>
                <div className="relative">
                  <select
                    value={pillarName}
                    onChange={(e) => {
                      setPillarName(e.target.value);
                      setIndicatorId('');
                    }}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Pillar --</option>
                    {PILLARS.map(p => <option key={p.name} value={p.name} className="text-slate-900 font-medium">{p.name}</option>)}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">2. Indicator</label>
                <div className="relative">
                  <select
                    value={indicatorId}
                    onChange={(e) => {
                      setIndicatorId(e.target.value);
                      setTargetValue('');
                      setAchievementValue('');
                    }}
                    disabled={!pillarName}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Indicator --</option>
                    {indicators.length === 0 ? (
                      <option value="" className="text-slate-400" disabled>-- No indicators available for this pillar --</option>
                    ) : (
                      indicators.map(i => <option key={i.id} value={i.id} className="text-slate-900 font-medium">{i.name}</option>)
                    )}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">3. Quarter</label>
                  <div className="relative">
                    <select
                      value={quarterId}
                      onChange={(e) => {
                        setQuarterId(e.target.value);
                        setMonth('');
                      }}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Quarter --</option>
                      {QUARTERS.map(q => <option key={q.id} value={q.id} className="text-slate-900 font-medium">{q.name}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">4. Month</label>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      disabled={!quarterId}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Month --</option>
                      {months.map(m => <option key={m} value={m} className="text-slate-900 font-medium">{m}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>
              </div>

              {/* DYNAMIC VALUE SECTION */}
              <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                  <span>achievements</span>
                  {selectedIndicator && quarterId && (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 italic normal-case tracking-normal">
                      Fixed Target: {selectedPillar?.outputs.flatMap(o => o.indicators).find(i => i.id === indicatorId)?.targets[quarterId as keyof Indicator['targets']] || 0}
                    </span>
                  )}
                </h4>

                {selectedIndicator?.isDual ? (
                  <div className="space-y-4">
                    {/* Sub-indicator specific inputs */}
                    {indicatorId === '3' && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Maize (Ha)</label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Cassava (Ha)</label>
                          <input
                            type="number"
                            value={subValues['cassava'] ?? ''}
                            onChange={(e) => handleSubValueChange('cassava', e.target.value)}
                            placeholder="Cassava"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Rice (Ha)</label>
                          <input
                            type="number"
                            value={subValues['rice'] ?? ''}
                            onChange={(e) => handleSubValueChange('rice', e.target.value)}
                            placeholder="Rice"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Beans (Ha)</label>
                          <input
                            type="number"
                            value={subValues['beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('beans', e.target.value)}
                            placeholder="Beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Soya (Ha)</label>
                          <input
                            type="number"
                            value={subValues['soya'] ?? ''}
                            onChange={(e) => handleSubValueChange('soya', e.target.value)}
                            placeholder="Soya"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '8' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Maize Seeds (Kg)</label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize seeds"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Soya Seeds (Kg)</label>
                          <input
                            type="number"
                            value={subValues['soya'] ?? ''}
                            onChange={(e) => handleSubValueChange('soya', e.target.value)}
                            placeholder="Soya seeds"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '10' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">UREA (Kg)</label>
                          <input
                            type="number"
                            value={subValues['urea'] ?? ''}
                            onChange={(e) => handleSubValueChange('urea', e.target.value)}
                            placeholder="UREA"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">NPK (Kg)</label>
                          <input
                            type="number"
                            value={subValues['npk'] ?? ''}
                            onChange={(e) => handleSubValueChange('npk', e.target.value)}
                            placeholder="NPK"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Blender (Kg)</label>
                          <input
                            type="number"
                            value={subValues['blender'] ?? ''}
                            onChange={(e) => handleSubValueChange('blender', e.target.value)}
                            placeholder="Blender"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Lime (Kg)</label>
                          <input
                            type="number"
                            value={subValues['lime'] ?? ''}
                            onChange={(e) => handleSubValueChange('lime', e.target.value)}
                            placeholder="Lime"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '16' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Maize (Ha)</label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Rice (Ha)</label>
                          <input
                            type="number"
                            value={subValues['rice'] ?? ''}
                            onChange={(e) => handleSubValueChange('rice', e.target.value)}
                            placeholder="Rice"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Beans (Ha)</label>
                          <input
                            type="number"
                            value={subValues['beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('beans', e.target.value)}
                            placeholder="Beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Chilli (Ha)</label>
                          <input
                            type="number"
                            value={subValues['chilli'] ?? ''}
                            onChange={(e) => handleSubValueChange('chilli', e.target.value)}
                            placeholder="Chilli"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Soybeans (Ha)</label>
                          <input
                            type="number"
                            value={subValues['soybeans'] ?? ''}
                            onChange={(e) => handleSubValueChange('soybeans', e.target.value)}
                            placeholder="Soybeans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">French beans (Ha)</label>
                          <input
                            type="number"
                            value={subValues['french_beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('french_beans', e.target.value)}
                            placeholder="French beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '24' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">LSD</label>
                          <input
                            type="number"
                            value={subValues['lsd'] ?? ''}
                            onChange={(e) => handleSubValueChange('lsd', e.target.value)}
                            placeholder="LSD"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">RVF</label>
                          <input
                            type="number"
                            value={subValues['rvf'] ?? ''}
                            onChange={(e) => handleSubValueChange('rvf', e.target.value)}
                            placeholder="RVF"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Brucellosis</label>
                          <input
                            type="number"
                            value={subValues['brucellosis'] ?? ''}
                            onChange={(e) => handleSubValueChange('brucellosis', e.target.value)}
                            placeholder="Brucellosis"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Rabies</label>
                          <input
                            type="number"
                            value={subValues['rabies'] ?? ''}
                            onChange={(e) => handleSubValueChange('rabies', e.target.value)}
                            placeholder="Rabies"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '29' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Goats</label>
                          <input
                            type="number"
                            value={subValues['goats'] ?? ''}
                            onChange={(e) => handleSubValueChange('goats', e.target.value)}
                            placeholder="Goats"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Sheep</label>
                          <input
                            type="number"
                            value={subValues['sheep'] ?? ''}
                            onChange={(e) => handleSubValueChange('sheep', e.target.value)}
                            placeholder="Sheep"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '31' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Pigs Insured</label>
                          <input
                            type="number"
                            value={subValues['pig'] ?? ''}
                            onChange={(e) => handleSubValueChange('pig', e.target.value)}
                            placeholder="Number of pigs"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Chicken Insured</label>
                          <input
                            type="number"
                            value={subValues['chicken'] ?? ''}
                            onChange={(e) => handleSubValueChange('chicken', e.target.value)}
                            placeholder="Number of chicken"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '87' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">15 Classrooms</label>
                          <input
                            type="number"
                            value={subValues['classrooms'] ?? ''}
                            onChange={(e) => handleSubValueChange('classrooms', e.target.value)}
                            placeholder="Classrooms"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">24 Toilets</label>
                          <input
                            type="number"
                            value={subValues['toilets'] ?? ''}
                            onChange={(e) => handleSubValueChange('toilets', e.target.value)}
                            placeholder="Toilets"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Generic Percentage Calculation for all percentage indicators not covered above */}
                    {selectedIndicator?.measurementType === 'percentage' && !['3', '16', '24', '42', '87'].includes(indicatorId) && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Target Population</label>
                          <input
                            type="number"
                            value={subValues['target_pop'] ?? ''}
                            onChange={(e) => {
                              handleSubValueChange('target_pop', e.target.value);
                              // Optional auto-calc if both present? 
                            }}
                            placeholder="e.g. 10000"
                            className={`${inputClasses} placeholder:text-slate-300`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase">Achieved</label>
                          <input
                            type="number"
                            value={subValues['achieved_pop'] ?? ''}
                            onChange={(e) => {
                              handleSubValueChange('achieved_pop', e.target.value);
                            }}
                            placeholder="e.g. 2000"
                            className={`${inputClasses} placeholder:text-slate-300`}
                          />
                        </div>
                        <div className="col-span-2 pt-2 border-t border-blue-100">
                          <p className="text-[10px] text-slate-500 italic">
                            Resulting Percentage: {subValues['target_pop'] !== undefined && subValues['achieved_pop'] !== undefined
                              ? ((Number(subValues['achieved_pop']) / Number(subValues['target_pop'])) * 100).toFixed(1) + '%'
                              : '0%'}
                          </p>
                          <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase tracking-tighter">
                            Note: This percentage will be used as the input for monthly progress.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-[10px] font-bold text-blue-700 uppercase">Value Recorded</label>
                    <input
                      type="number"
                      value={achievementValue}
                      onChange={(e) => setAchievementValue(e.target.value)}
                      placeholder="e.g. 500"
                      className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                      disabled={!indicatorId}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">Add Comment to this Indicator</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Briefly explain any deviations or key notes..."
                    className="w-full min-h-[100px] p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <button
                  type="submit"
                  className={`w-full h-14 rounded-2xl ${initialEntry ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group ring-offset-2 focus:ring-4 focus:ring-slate-900/20`}
                >
                  <span>{initialEntry ? 'Update Changes' : 'Submit Achievement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillFormView;
