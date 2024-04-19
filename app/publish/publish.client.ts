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

    // Insert a new row into 'userruns' with the user's ID from the user data
    const { data, error: insertError } = await supabase.from('userruns').insert({
        'created_at': new Date().toISOString(),
        'user_id': userData.user.id
    }).select();

    if (insertError) {
        console.error('Error inserting data:', insertError.message);
        throw insertError;
    }

    console.log('Insert successful:', data);

    if(data){
        const storageId = (data[0].upload_id! as any);  // Adjust the indexing based on your actual data structure
        console.log(data)
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
