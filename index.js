// Import the required modules
const AWS = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// Initialize the AWS S3 SDK
const s3 = new AWS.S3();

// AWS Lambda function
exports.handler = async (event, context) => {
  // Placeholder for S3 bucket name (to be filled)
  const bucketName = 'screenshot-maker-store'; // S3 bucket name

  // Extract the URL from the event or default to 'https://www.example.com'
  const url = event.url || 'https://www.google.com';

  // Parse the URL to extract the hostname
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
   
  // Construct the S3 key using the hostname
  const s3Key = `screenshots/${hostname}.png`;

  try {
    // Launch a headless Chrome browser using puppeteer
    const browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: chromium.args,
      headless: true
    });

    // const browser = await puppeteer.launch({
    //     args: chromium.args,
    //     defaultViewport: chromium.defaultViewport,
    //     executablePath: await chromium.executablePath,
    //     headless: chromium.headless,
    // });

    // Open a new page in the browser
    const page = await browser.newPage();
   
    // Navigate to the specified URL
    await page.goto(url);

    // Take a screenshot of the page
    const screenshotBuffer = await page.screenshot();

    // Close the browser
    await browser.close();

    // Define parameters for the S3 upload
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: screenshotBuffer
    };

    // Upload the screenshot to the S3 bucket
    await s3.upload(params).promise();
    console.log('Screenshot uploaded to S3');
  } catch (error) {
    // Handle and log errors
    console.error('Error:', error);
    throw error;
  }
};