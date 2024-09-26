import { SurveyResults } from "../typing/types";
import { createClient } from "@/utils/supabase/client";

export async function publishResults(results: SurveyResults | null) {
    const supabase = createClient();

    // Retrieve the current user session
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userData.user) {
        console.error('User is not authenticated.');
        throw new Error('Authentication required');
    }


    const { data, error: insertError } = await supabase.from('userruns').insert({
        'created_at': new Date().toISOString(),
        'user_id': userData.user.id
    }).select();

    if (insertError) {
        console.error('Error inserting data:', insertError.message);
        throw insertError;
    }

    console.log('Insert successful:', data);



    const { data: surveyData, error: surveyError } = await supabase.from('surveyruns-var').insert({
        'uid': userData.user.id,
        'iteration_acc': JSON.stringify(results?.iterations.map(it => it.accuracy)),
        'iteration_const':JSON.stringify(results?.iterations.map(it => it.const)),
        'iteration_acc_test':JSON.stringify(results?.iterations.map(it => it.accuracy)),
        'final_constitution':results?.constitution,
        'final_accuracy_test':results?.modelAccuracy,
        'final_accuracy_train':results?.modelAccuracy,
    }).select();

    console.log('Insert successful:', data);
    console.log('Survey insert successful:', surveyData);
    console.log(surveyError)

    if (userError) { throw userError }
    if (surveyError) { throw surveyError }
    if (insertError) { throw insertError }

    if (data && surveyData) {
        const storageId = (data[0].upload_id! as any);  
        if (results) {
            const bucketName = 'public_survey_results';
            const filePath = `${storageId}.json`;
            const jsonString = JSON.stringify(results);
            console.log(jsonString)
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, jsonString, {
                    contentType: 'application/json',  
                    upsert: true  
                });

            if (uploadError) {
                console.error('Error uploading results:', uploadError.message);
                throw uploadError;
            }

            console.log('Results successfully uploaded to storage');
        } else {
            console.error('No results to upload');
        }

        return data;
    }
    return null;

}
