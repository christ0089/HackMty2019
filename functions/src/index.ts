import * as functions from 'firebase-functions';
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//const automl = require('@google-cloud/automl');
//const fs = require('fs');


import * as admin from 'firebase-admin';

//const client = new automl.PredictionServiceClient();

export const fileTriggerUpload = functions.storage.bucket().object().onFinalize((data) => {
    admin.firestore().collection("Results").doc(data.name).set({
        "Results" : "Ok"
    }).catch(e => {
        console.log(e);
    })
});

