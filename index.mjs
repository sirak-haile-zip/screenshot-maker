import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import AWS from 'aws-sdk';
// require('aws-sdk/lib/maintenance_mode_message').suppress = true;

// Initialize the AWS S3 SDK
const s3 = new AWS.S3();

export const handler = async (event, context) => {

  // Placeholder for S3 bucket name (to be filled)
  const bucketName = 'screenshot-maker-store'; // S3 bucket name

  // Extract the URL from the event or default to 'https://www.example.com'
  const url = event?.parameters?.find(p => p.name === "url")?.value;
  const inputText = event?.inputText;

  // Safely retrieve the function name from the event object
  const functionName = event?.function || "defaultFunction";
  const actionGroupName = event?.actionGroup || "defaultActionGroup";

  // Parse the URL to extract the hostname
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;

  // Construct the S3 key using the hostname
  const s3Key = `screenshots/${hostname}-${Date.now()}.png`;

  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
      ),
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle0" });

    const browserVersion = await browser.version();
    const pageTitle = await page.title();

    // Take a screenshot of the page
    const screenshotBuffer = await page.screenshot();

    // Define parameters for the S3 upload
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: screenshotBuffer
    };

    // Upload the screenshot to the S3 bucket
    await s3.upload(params).promise();
    console.log('Screenshot uploaded to S3');

    await page.close();
    // Define the JSON body for the function's output.
    // The format is specific to function schemas.
    // const functionResult = {
    //     "status": "success",
    //     "message": `Function '${functionName}' in action group '${actionGroupName}' completed successfully.`,
    //     "details": {
    //         "url": event?.parameters?.find(p => p.name === "url")?.value,
    //         "inputText": event?.inputText
    //     }
    // };

    // Define the plain text body for the function's output.
    // Concatenate the data into a human-readable string.
    const textResponse = `Function '${functionName}' in action group '${actionGroupName}' completed successfully. The URL processed was: ${url}. The original prompt was: "${inputText}".`;


    // Serialize the function output into a string
    // const functionResultStr = JSON.stringify(functionResult);

    // The Bedrock agent requires the JSON body to be a string.
    console.log("event: " + JSON.stringify(event));
    console.log("context: " + JSON.stringify(context));
    // console.log("functionResult: " + functionResultStr);
    console.log("textResponse: " + textResponse);

    // This is the final, required format for the Bedrock agent's response.
    // Construct the final Bedrock response object using 'function' and 'functionResponse'.
    const response = {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": actionGroupName,
            "function": functionName,
            "functionResponse": {
                // "responseState": "SUCCESS", // Or "FAILURE"
                "responseBody": {
                    // Specify the content type as 'text/plain' and use the plain text string.
                    "TEXT": {
                      "body": textResponse
                  }
                }
            }
        }
    };

    console.log("response: " + JSON.stringify(response));

    return response;
  } catch (error) {
    // Handle and log errors
    console.error('Error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
