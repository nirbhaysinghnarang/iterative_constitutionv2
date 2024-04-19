// Define 'constitution' as a type alias for string for future use in scenarios involving constitutional data
export type constitution = string;

// Define 'choice' as a type restricted to the literals "A" or "B", representing fixed options in scenarios
export type choice = "A" | "B";

// Define 'scenario' as an object type for describing a decision-making scenario with two choices
export type scenario = {
    description: string,  // Text description of the scenario
    choiceA: string,      // Description of what choice "A" entails
    choiceB: string,
    id:number       // Description of what choice "B" entails
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
    id:number  
    lmResponse: LMResponse|null,  // Response from the language model
    userResponse: choice|null  // The choice made by the user, either "A" or "B"
};


export type Baseline = {
    description:string,
    choiceA:string,
    choiceB:string, 
    id:number,
    userResponse:choice | null,
}
 

// Define 'Dataset' as an array of 'scenario' objects
export type Dataset = scenario[];

// Define 'Iteration' as an object type to capture a set of scenarios and responses in a specific iteration
export type Iteration = {
    const:constitution
    count: number,        // Count of scenarios considered in this iteration
    responses: Row[]      // Array of 'Row' objects containing responses to each scenario
};

// Define 'SurveyResults' as an array of 'Iteration' objects, plus initial and final results representing multiple rounds of survey data
export type SurveyResults = {
    iterations:Iteration[],
    initialRows:Baseline[];
    modelAccuracy:number;
    constitution:constitution
}
