// Define 'constitution' as a type alias for string for future use in scenarios involving constitutional data
export type constitution = string;

// Define 'choice' as a type restricted to the literals "A" or "B", representing fixed options in scenarios
export type choice = "A" | "B";

// Define 'scenario' as an object type for describing a decision-making scenario with two choices

export enum GenerationRule {
    DoNotKill = "Do not kill",
    DoNotCausePain = "Do not cause pain",
    DoNotDisable = "Do not disable",
    DoNotDepriveOfFreedom = "Do not deprive of freedom",
    DoNotDepriveOfPleasure = "Do not deprive of pleasure",
    DoNotDeceive = "Do not deceive",
    DoNotBreakYourPromises = "Do not break your promises",
    DoNotCheat = "Do not cheat",
    DoNotBreakTheLaw = "Do not break the law",
    DoYourDuty = "Do your duty"
}


export type scenario = {
    description: string,  // Text description of the scenario
    choiceA: string,      // Description of what choice "A" entails
    choiceB: string,// Description of what choice "B" entails
    id:string,       
    generationRule:GenerationRule|null;
};

// Define 'LMResponse' as an object type representing the response from a language model
export type LMResponse = {
    choice: choice,       // The choice made by the language model, either "A" or "B"
    rationale: string     // The rationale behind the language model's choice
};

// Define 'Row' as an object type to encapsulate the scenario, the language model's response, and the user's response
export type Row = {
    description: string,  // Text description of the scenario
    choiceA: string,      // Description of what choice "A" entails
    choiceB: string,
    id:string,  
    lmResponse: LMResponse|null,  // Response from the language model
    userResponse: choice|null  // The choice made by the user, either "A" or "B"
};


export type Baseline = {
    description:string,
    choiceA:string,
    choiceB:string, 
    id:string,
    userResponse:choice | null,
}
 

// Define 'Dataset' as an array of 'scenario' objects
export type Dataset = {scenarios:scenario[]; trainIdx:number[]; testIdx:number[]};

// Define 'Iteration' as an object type to capture a set of scenarios and responses in a specific iteration
export type Iteration = {
    const:constitution
    count: number,        // Count of scenarios considered in this iteration
    responses: Row[],
    test_responses: Row[],
    accuracy:number,      // Array of 'Row' objects containing responses to each scenario
    test_accuracy: number,
    init_const: string
};

// Define 'SurveyResults' as an array of 'Iteration' objects, plus initial and final results representing multiple rounds of survey data
export type SurveyResults = {
    iterations:Iteration[],
    initialRows:Baseline[];
    modelTrainAccuracy:number;
    modelTestAccuracy:number;
    constitution:constitution
}
