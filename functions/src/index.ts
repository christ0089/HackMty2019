import * as functions from 'firebase-functions';
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//const automl = require('@google-cloud/automl');
//const fs = require('fs');

const bucket = 'gs://facturaapp-e7560.appspot.com/';

import * as admin from 'firebase-admin';
admin.initializeApp(
    { 'storageBucket': bucket }
);
//const client = new automl.PredictionServiceClient();

export const fileTriggerUpload = functions.storage.bucket().object().onFinalize((data) => {
    if (data === undefined) {
        return;
    }

    let name = data.name as string
    const imageUri = `${bucket}/${data.name}`;
    name = name.replace("user_eye/", "");

    

    admin.firestore().collection("Results").doc(name).set({
        "Results": "Ok",
        "Threshold": "100%"
    }).catch(e => {
        console.log(e);
    })
});



const automl = require('@google-cloud/automl').v1beta1;
const fs = require('fs');

// Create client for prediction service.
const client = new automl.PredictionServiceClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
const projectId = `eyedetector-4483e`;
const computeRegion = "us-central1";
const modelId = 'High_Cholesterol';
// const filePath = `local text file path of content to be classified, e.g. "./resources/test.txt"`;
const scoreThreshold = '.75';

async function getDataModel(projectId: string, filePath: string) {
    // Get the full path of the model.
    const modelFullId = client.modelPath(projectId, computeRegion, modelId);
    
    // Read the file content for prediction.
    const content = fs.readFileSync(filePath, 'base64');
    
    const params: any = {};
    
    if (scoreThreshold) {
        params.score_threshold = scoreThreshold;
    }
    
    // Set the payload by giving the content and type of the file.
    const payload:any = null;
    payload.image = { imageBytes: content };
    
    // params is additional domain-specific parameters.
    // currently there is no additional parameters supported.
    const [response] = await client.predict({
        name: modelFullId,
        payload: payload,
        params: params,
    });
    console.log(`Prediction results:`);
    response.payload.forEach((result: any) => {
        console.log(`Predicted class name: ${result.displayName}`);
        console.log(`Predicted class score: ${result.classification.score}`);
    });
    
}