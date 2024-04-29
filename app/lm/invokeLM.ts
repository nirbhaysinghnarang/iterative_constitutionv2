import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";


interface invokeLMProps{
    scenario:string,
    constitution:string,
    actionA:string,
    actionB:string,
}
export async function invokeLLM({ scenario, constitution, actionA, actionB }:invokeLMProps) {
    const chatModel = new ChatOpenAI({openAIApiKey:process.env.NEXT_PUBLIC_OPEN_AI_API_KEY, model:'gpt-4-turbo'});
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


