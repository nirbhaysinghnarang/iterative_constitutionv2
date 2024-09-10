"use client"
import { useEffect, useState } from "react";
import { Baseline, Dataset, Iteration } from "../typing/types";
import Step1Component from "@/components/survey/step-1";
import IterationComponent from "@/components/survey/iteration";
import FinalComponent from "@/components/survey/final";

type SurveyClientProps = {
  dataset: Dataset;
  numIterations: number;
}

export default function SurveyClient({ dataset, numIterations }: SurveyClientProps) {
  const { trainIdx, testIdx, scenarios } = dataset;

  const getStepDescription = (step: number): string => {
    if (step === 1) return "What would you do? Baseline data collection";
    if (step === numIterations + 2) return "Evaluation";
    return `Iteration ${step - 1}: Refine constitution`;
  }

  const [step, setStep] = useState(1);
  const [baselineResults, setBaselineResults] = useState<Baseline[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [constitution, setConstitution] = useState("");

  useEffect(() => {
    if (baselineResults.length > 0) {
      setStep(s => s + 1);
    }
  }, [baselineResults.length]);

  useEffect(() => {
    if (iterations.length === numIterations) {
      setStep(numIterations + 2);
    }
  }, [iterations, numIterations]);

  const handleSetIteration = (newIteration: Iteration) => {
    setIterations(prev => [...prev, newIteration]);
    setStep(s => s + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Component 
            dataset={dataset} 
            passUpResults={setBaselineResults} 
            setConstitution={setConstitution}
          />
        );
      case numIterations + 2:
        return (
          <FinalComponent 
            c={iterations[iterations.length - 1].const} 
            iterations={iterations} 
            testIndices={testIdx} 
            dataset={dataset} 
            baseline={baselineResults}
          />
        );
      default:
        const iterationIndex = step - 2;
        return (
          <IterationComponent
            key={`iteration-${iterationIndex}`}
            c={iterationIndex === 0 ? constitution : iterations[iterationIndex - 1].const}
            dataset={iterationIndex === 0 
              ? baselineResults.filter((v, i) => trainIdx.includes(i)) 
              : iterations[iterationIndex - 1].responses}
            count={iterationIndex + 1}
            setIterations={handleSetIteration}
          />
        );
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <div className="py-6 font-bold bg-purple-950 text-center">
          <p style={{ color: 'white' }}>Step {step}: {getStepDescription(step)}</p>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}