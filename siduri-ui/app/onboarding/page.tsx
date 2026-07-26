'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Step1Profile } from '@/components/onboarding/Step1Profile';
import { Step2Siduri } from '@/components/onboarding/Step2Siduri';
import { Step3Projects } from '@/components/onboarding/Step3Projects';
import { Step4Games } from '@/components/onboarding/Step4Games';
import { Step5Permissions } from '@/components/onboarding/Step5Permissions';
import { saveOnboardingData } from './actions';

const INITIAL_STATE = {
  profile: { displayName: '', realName: '', nickname: '', timezone: 'Asia/Jakarta', language: '' },
  siduri: { 
    scenarios: {
      spending: '',
      bossFight: '',
      chatSkillIssue: ''
    },
    coreSentence: ''
  },
  projects: [],
  games: [],
  streamRules: { donationThreshold: 5, autoAnswerChat: false, blockedTopics: [] }
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const res = await saveOnboardingData(data);
      if (res.success) {
        router.push('/');
      } else {
        alert("Failed to save: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving the baseline facts.");
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    <Step1Profile key="1" data={data.profile} updateData={(d) => setData({ ...data, profile: d })} />,
    <Step2Siduri key="2" data={data.siduri} updateData={(d) => setData({ ...data, siduri: d })} />,
    <Step3Projects key="3" data={data} updateData={setData} />,
    <Step4Games key="4" data={data} updateData={setData} />,
    <Step5Permissions key="5" data={data} updateData={setData} />
  ];

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1,2,3,4,5].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i ? 'w-8 bg-amber-500' : 
                step > i ? 'w-2 bg-amber-500/50' : 'w-2 bg-zinc-800'
              }`} 
            />
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-zinc-950/50 backdrop-blur-2xl border border-zinc-800/50 rounded-3xl p-8 md:p-12 shadow-2xl">
          {steps[step - 1]}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-zinc-800/50">
            <button 
              onClick={prevStep}
              disabled={step === 1 || isSaving}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === 1 ? 'text-transparent cursor-default' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 5 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-black rounded-full text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Initialization"}
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
