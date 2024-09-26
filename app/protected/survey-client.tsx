"use client"
import { useEffect, useState } from "react";
import { Baseline, Dataset, Iteration } from "../typing/types";
import Step1Component from "@/components/survey/step-1";
import IterationComponent from "@/components/survey/iteration";
import FinalComponent from "@/components/survey/final";
import test from "node:test";

type SurveyClientProps = {
  dataset: Dataset;
}

export default function SurveyClient({ dataset }: SurveyClientProps) {


  const { trainIdx, testIdx, scenarios } = dataset;

  const getStepnum = (step: number):string => {
    if (step > -1) return `Step ${step}`;
    else return "Final Step"
  }

  const getStepDescription = (step: number): string => {
    if (step === 1) return "What would you do? Baseline data collection";
    if (step === -1) return "Evaluation";
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

  const handleNextIteration = (newIteration: Iteration) => {
    setIterations(prev => [...prev, newIteration]);
    setStep(s => s + 1);
  };

  const handleFinalIteration = (newIteration: Iteration) => {
    setIterations(prev => [...prev, newIteration]);
    setStep(s => -1);
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
      case -1:
        return (
          <FinalComponent 
            c={iterations[iterations.length - 1].const} 
            iterations={iterations} 
            testIndices={testIdx} 
            trainIndices={trainIdx}
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


            trainDataset={
              iterationIndex === 0 
              ? baselineResults.filter((v, i) => trainIdx.includes(i)) 
              : iterations[iterationIndex - 1].responses
            }


            testDataset={
              iterationIndex === 0 
                ? baselineResults.filter((v, i) => testIdx.includes(i)) 
                : iterations[iterationIndex - 1].responses
              }


            count={iterationIndex + 1}
            nextIteration={handleNextIteration}

            setIterations={setIterations}
            finalIteration={handleFinalIteration}
          />
        );
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <div className="py-6 font-bold bg-purple-950 text-center">
          <p style={{ color: 'white' }}>{getStepnum(step)}: {getStepDescription(step)}</p>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}