"use client"
import { useState } from "react";
import { Dataset } from "../typing/types";
import Step1Component from "@/components/survey/step-1";


type SurveyClientProps = {
    dataset: Dataset
}

export default function SurveyClient({ dataset }: SurveyClientProps) {
    const stepDescriptions:any = {
        1:"What would you do? Baseline data collection"
    }
    const [step, setStep] = useState(1);
    

    return (
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
            <div className="w-full">
                <div className="py-6 font-bold bg-purple-950 text-center">
                   <p style={{color:'white'}}>Step {step}: {stepDescriptions[step]}</p> 
                </div>

                {step ==1 && <Step1Component dataset={dataset}></Step1Component>}
            </div>
        </div>
    );
}
