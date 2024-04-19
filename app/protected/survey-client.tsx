"use client"
import { useEffect, useState } from "react";
import { Baseline, Dataset, Iteration } from "../typing/types";
import Step1Component from "@/components/survey/step-1";
import IterationComponent from "@/components/survey/iteration";
import FinalComponent from "@/components/survey/final";

type SurveyClientProps = {
    dataset: Dataset
}

export default function SurveyClient({ dataset }: SurveyClientProps) {

    const trainTestSplit = (dataset: Dataset, trainSize = 0.75) => {
        const indices = Array.from({ length: dataset.length }, (_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];  // ES6 array destructuring swap
        }
        const splitIdx = Math.floor(indices.length * trainSize);
        const trainIndices = indices.slice(0, splitIdx);
        const testIndices = indices.slice(splitIdx);
        return { trainIndices, testIndices };
    };

    const { trainIndices, testIndices } = trainTestSplit(dataset)
    const stepDescriptions: any = {
        1: "What would you do? Baseline data collection",
        2: "Iteration 1: Constitution 1",
        3: "Iteration 2: Refine constitution",
        4:"Evaluation"
    }
    const [step, setStep] = useState(1);
    const [baselineResults, setBaselineResults] = useState<Baseline[]>([]);
    const [iterations, setIterations] = useState<Iteration[]>([]);




    useEffect(() => {
        if (baselineResults.length > 0) {
            setStep(s => s + 1);
        }
    }, [baselineResults.length]); //


    useEffect(() => {
        if (iterations.length > 0) {
            setStep(s => s + 1)
        }


    }, [iterations])

    return (
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
            <div className="w-full">
                <div className="py-6 font-bold bg-purple-950 text-center">
                    <p style={{ color: 'white' }}>Step {step}: {stepDescriptions[step]}</p>
                </div>

                {step == 1 && <Step1Component dataset={dataset} passUpResults={setBaselineResults}></Step1Component>}
                {step == 2 && <IterationComponent
                    c={''}
                    dataset={baselineResults.filter((v, i) => trainIndices.includes(i))}
                    count={1}
                    setIterations={setIterations}
                ></IterationComponent>}

                {step == 3 && <IterationComponent
                c={iterations[0].const} 
                dataset={iterations[0].responses} 
                count={2}
                setIterations={setIterations}
                ></IterationComponent>}

                {step == 4 && <FinalComponent c={iterations[1].const} iterations={iterations} testIndices={testIndices} dataset={dataset} baseline={baselineResults}></FinalComponent>}
            </div>
        </div>
    );
}
