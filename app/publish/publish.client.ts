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



    const { data: surveyData, error: surveyError } = await supabase.from('surveyruns').insert({
        'userid': userData.user.id,
        'iteration_1_acc': results?.iterations[0].accuracy,
        'iteration_1_constitution': results?.iterations[1].const,
        'iteration_2_acc': results?.iterations[1].accuracy,
        'iteration_2_constitution': results?.iterations[1].accuracy,
        'final_accuracy': results?.modelAccuracy,
        'final_constitution': results?.constitution

    }).select();

    console.log('Insert successful:', data);
    console.log('Survey insert successful:', surveyData);
    console.log(surveyError)

    if (userError) { throw userError }
    if (surveyError) { throw surveyError }
    if (insertError) { throw insertError }

    if (data && surveyData) {
        const storageId = (data[0].upload_id! as any);  // Adjust the indexing based on your actual data structure
        if (results) {
            const bucketName = 'public_survey_results';
            const filePath = `${storageId}.json`;
            const jsonString = JSON.stringify(results);
            console.log(jsonString)
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, jsonString, {
                    contentType: 'application/json',  // Set the MIME type as JSON
                    upsert: true  // Set to true to overwrite existing files with the same path
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
