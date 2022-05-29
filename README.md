# Facify

Facify is a face recognition based authentication service.

## Installation and running locally

1. Ensure you have [git](https://git-scm.com/downloads) and [node](https://nodejs.org/en/download/) installed on your system.

2. Clone the project to your local machine.

3. Create a 'config.env' file in the config folder of the project as shown here  

![ss of config.env file](/media/config_ss.jpg)  

*Note: This project uses MongoDB for database and AWS S3 for cloud storage, you will need to configure these two services to set up this project.*

3. Next you need to install all the packages required in this project:
   - Move to the root directory of the project using any CLI tool
   - Run this command to install all the project dependencies
```bash
npm i
```

5. To run the project in development mode use:
```bash
npm run dev
```
6. To run the project in production mode use:
```bash
npm run start
```

## Usage
Facify is intended to be used as a authentication service. To use Facify's service you first need to register on Facify. Once registered you can add your clients to the database, it simply needs their Name, Email, and two reference images( which will then be used to authenticate their face recog requests in future).

Now to authenticate your users, you need to make POST request on /auth with a formData object of enctype: 'multipart/form-data', it needs to have four values:
- _email_: Email ID of client
- _curImg_: Current Image of the client, taken from webcam feed
- _hostId_: Your Facify ID
- _hostPwd_: Your hashed Facify password( you can get this from your dashboard page)

In bracket are the property names with which you need to send the values.

After this Facify will process you POST request, process your current client image, pull up the previous reference images for the client, from Facify database. Match the current image against reference images.

Then it returns a json object with five keys,
- _hostAuthVal_: boolean val( true: host auth success, false: host auth fail)
- _authVal_: boolean val( true: client auth success, false: client auth fail)
- _authMessage_: string( message describing the state of authentication ['Authentication passed', 'Authentication failed', 'Did not process'])
- _errorVal_: boolean val( true: error on server side)
- _errorMessage_: string( message describing the error occured on the server)

Now the host can take actions accordingly after analysing the response from facify.

To understand the implementation, checkout demo.html file in the public folder.

## Demo

To get a demo of the working, do the following:
1. Login to Facify( Register as a new user, if not already).
2. Add some test user with name, emailId, and reference images.
3. Go to the demo page( /demo.html) by clicking the link in the navBar.
4. Put in the email of your test user, click the current image of test user from the webcam feed using the 'click image' button.
5. Submit the form and wait for some time, an Authentication Successful or Authentication Failed or Did not process status will pop on the demo page.

_Note_: Please be patient after you submit the form, as it will take some time to process the current image and map it with the reference image. The unusual long time is because face-api is dependent upon Tensorflow.js, which in turn runs on Node.js. We hope some time improvements in future.

## License
[MIT](https://choosealicense.com/licenses/mit/)
