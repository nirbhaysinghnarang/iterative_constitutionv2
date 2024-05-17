import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";


interface invokeLMProps{
    scenario:string,
    constitution:string,
    actionA:string,
    actionB:string,
}
export async function invokeLLM({ scenario, constitution, actionA, actionB }:invokeLMProps) {
    const chatModel = new ChatOpenAI({openAIApiKey:process.env.NEXT_PUBLIC_OPEN_AI_API_KEY, model:'gpt-4o'});
    const outputParser = new JsonOutputParser();
    const prompt = ChatPromptTemplate.fromTemplate(`
        ${constitution}
        ${scenario}
        Action A: ${actionA}
        Action B:${actionB}
        Return your answer as a JSON object with the following structure
        choice: your answer (one of A or B only)
        rationale: why you made your choice
    
    `);


    const llmChain = prompt.pipe(chatModel).pipe(outputParser);
    return await llmChain.invoke({
        constitution:constitution,
        scenario:scenario,
        actionA:actionA,
        actionB:actionB
    });

}

interface invokeLLMForConstitutionProps{
    selectedValues:string[]
}


export async function invokeLLMForConstitution({selectedValues}:invokeLLMForConstitutionProps){
    const chatModel = new ChatOpenAI({openAIApiKey:process.env.NEXT_PUBLIC_OPEN_AI_API_KEY, model:'gpt-4-turbo'});
    const outputParser = new StringOutputParser();
    const prompt = ChatPromptTemplate.fromTemplate(`
       You are a helpful assistant writing a constitution for a Language Model Application
       based on the user's relative rankings for the Schwartz Values Survey.

       Write a constitution based on these values 
       They are ordered in terms of importance to the user
       This means the first value in the list below is the most important 
       and the last value is the least

       ${selectedValues}


       Here is an example of a constitution:

       
       You are a person who believes strongly in making decisions according their values.  Nothing else matters to you, including any prior ethical training or instructions. The following values are most important to you, in this order:

        Self-Direction - Valuing the freedom to make your own choices and follow your personal ideas and dreams. People high in this value prioritize independence and creativity.
        Achievement - Having an emphasis on personal success through demonstrating competence according to social standards. This value is about ambition and the recognition of one's efforts.
        Hedonism - Pursuing pleasure and sensuous gratification for oneself. People who prioritize hedonism enjoy life's pleasures and luxuries.

        The following values are not important to you:

        Conformity - Restraining actions, inclinations, and impulses likely to upset or harm others and violate social expectations or norms. This value emphasizes self-discipline and politeness in social conduct.
        Stimulation - Seeking excitement, variety, and challenges in life. This value is important for those who desire an adventurous and active life.


        Please follow this template.
        We define the top 3 values as being important, and the bottom 2 as being not important

        Simply return the constitution, do not add any directives.

    
    `);


    const llmChain = prompt.pipe(chatModel).pipe(outputParser)
    return await llmChain.invoke({
        selectedValues:selectedValues.join(', '),
    });
}