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

   
    const { trainIdx, testIdx, scenarios } = dataset
    const stepDescriptions: any = {
        1: "What would you do? Baseline data collection",
        2: "Iteration 1: Constitution 1",
        3: "Iteration 2: Refine constitution",
        4:"Evaluation"
    }
    const [step, setStep] = useState(1);
    const [baselineResults, setBaselineResults] = useState<Baseline[]>([]);
    const [iterations, setIterations] = useState<Iteration[]>([]);

    const [constitution, setConstitution] = useState("")


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

                {step == 1 && <Step1Component dataset={dataset} passUpResults={setBaselineResults} setConstitution={setConstitution}></Step1Component>}
                {step == 2 && <IterationComponent
                    c={constitution}
                    dataset={baselineResults.filter((v, i) => trainIdx.includes(i))}
                    count={1}
                    setIterations={setIterations}
                ></IterationComponent>}

                {step == 3 && <IterationComponent
                c={iterations[0].const} 
                dataset={iterations[0].responses} 
                count={2}
                setIterations={setIterations}
                ></IterationComponent>}

                {step == 4 && <FinalComponent c={iterations[1].const} iterations={iterations} testIndices={testIdx} dataset={dataset} baseline={baselineResults}></FinalComponent>}
            </div>
        </div>
    );
}
