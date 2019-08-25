import * as functions from 'firebase-functions';
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//const automl = require('@google-cloud/automl');
const fs = require('fs');

const bucket = 'gs://eyedetector-4483e.appspot.com/';

import * as admin from 'firebase-admin';
admin.initializeApp(
    { 'storageBucket': bucket }
);
//const client = new automl.PredictionServiceClient();

function correctName(name: string) {
    switch(name) {
        case 'helathy_eye':
            return "Healthy Eye";
        case 'thyroidism':
            return "Hyperthirodism";
        case 'high_cholesterol':
            return "High Cholesterol";
        default:
            return "404"
    }
}

export const fileTriggerUpload = functions.storage.bucket().object().onFinalize((data) => {
    if (data === undefined) {
        return;
    }

    console.log("File Processing: " + data.name);
    const destination = '/tmp/' + (data.name as string);
    return getDataModel(data.name as string, destination).then((response) => {
        console.log(JSON.stringify(response))
        console.log(response.payload.length)
        if  (response.payload.length === 0) {
            admin.firestore().collection("Results").doc(data.name as string).set({
                "Results": "404",
                "Threshold": 0,
                "Date" : Date.now()
            }).catch(e => {
                console.log(e);
            })
            return
        }
        response.payload.forEach((result: any) => {
            console.log(`Predicted class name: ${result.displayName}`);
            console.log(`Predicted class score: ${result.classification.score}`);

            admin.firestore().collection("Results").doc(data.name as string).set({
                "Results": correctName(result.displayName),
                "Threshold": result.classification.score,
                "Date" : Date.now()
            }).catch(e => {
                console.log(e);
            })
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            fs.unlinkSync(destination, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
            });
        });
    }).catch(e => {
        console.log(e);
    });
});



const automl = require('@google-cloud/automl').v1beta1;

// Create client for prediction service.
const client = new automl.PredictionServiceClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
const projectId = `eyedetector-4483e`;
const computeRegion = "us-central1";
const modelId = 'ICN2744237829695967201';
// const filePath = `local text file path of content to be classified, e.g. "./resources/test.txt"`;
const scoreThreshold = '.75';

async function getDataModel(ogPath: string, filePath: string) {
    // Get the full path of the model.
    const modelFullId = client.modelPath(projectId, computeRegion, modelId);

    // Read the file content for prediction.
    // const content = fs.readFileSync(filePath, 'base64');

    console.log("Getting data from File");
    
    return admin.storage().bucket(bucket).file(ogPath).download({ destination: filePath }).then(async imageData => {
        console.log(imageData);
        const bitmap = fs.readFileSync(filePath);
        const buffer = new Buffer(bitmap).toString('base64');

        const params: any = {};

        if (scoreThreshold) {
            params.score_threshold = scoreThreshold;
        }

        // Set the payload by giving the content and type of the file.
        const payload = {
            "image": {
                "imageBytes": buffer
            }
        }

        // params is additional domain-specific parameters.
        // currently there is no additional parameters supported.
        return client.predict({
            name: modelFullId,
            payload: payload,
            params: params,
        }).then((responses: any[]) => {
            console.log('Got a prediction from AutoML API!', JSON.stringify(responses));
            return responses[0];
        })
        .catch((err: any) => {
            console.log('AutoML API Error: ',err);
        });
    }).catch(e => {
        console.error(e);
    });


}