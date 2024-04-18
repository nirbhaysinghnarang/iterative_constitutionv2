"use server"
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getData } from "../data/fetchDataset";
import SurveyClient from "./survey-client";





export default async function SurveyCollection() {
  const data = await getData()
  const supabase = createClient();




  





  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        {!data && <div className="py-6 font-bold bg-purple-950 text-center">
         Iterative Constitution
        </div>}
       {data && <SurveyClient dataset={data}/>}
       </div>
       </div>
  );
}
