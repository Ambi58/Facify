// *********************************************
// This file is a copy of auth.js, created just 
// for handling requests from the demo.html page
// *********************************************
const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const { ensureAuth, ensureGuest } = require('../middleware/auth')
const faceapi = require('face-api.js')
const canvas = require('canvas')

const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const Client = require('../models/Client')
const User = require('../models/User')
const upload = multer({ dest: 'public/uploads/' })

const { uploadFile, deleteFile, getFileStream } = require('../middleware/s3')

// @desc    Process demo page
// @route   POST /demo/
router.post('/', ensureAuth, upload.single('curImg'), async (req, res) => {
    try {

        const file = req.file
        const result = await uploadFile(file)
        await unlinkFile(file.path)
        curImageKey = result.Key

        //hostId: email id of the admin of the host site which send the req
        //hostPwd: hashed password of the admin of the host site which send the req
        // const user = await User.findOne({ email: req.body.hostId })
        // if (user == null || req.body.hostPwd !== user.password) {
        //     sendRes(_res = res, _hostAuthVal = false)
        // }
        const hostAuthRes = true

        // for demo here instead of processing the hostId & hostPwd coming from the
        // request, we are just using the credentials of the current logged in user
        const client = await Client.findOne({
            email: req.body.email,
            user: req.user.id
        })

        const baseURL = req.protocol + "://" + req.get('host')
        console.log(baseURL)

        if (client == null) {
            sendRes(_res = res, _hostAuthVal = hostAuthRes, _authVal = false, _authMessage = 'No client with that email')
            return
        }

        processFaceData(client, curImageKey, res, baseURL)
    } catch (err) {
        console.error(err)
        sendRes(_res = res, _hostAuthVal = hostAuthRes, _authVal = false, _authMessage = 'Did not process', _errorVal = true, _errorMessage = err)
    }
})

// Function to process the incoming client image, and match it
// against the reference images present in database
// *********************************************************
// No RETURN val, calls the sendRes function with apt values
function processFaceData(client, curImageKey, res, baseURL) {
    Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromDisk('./faceapi_models'),
        faceapi.nets.faceLandmark68Net.loadFromDisk('./faceapi_models'),
        faceapi.nets.ssdMobilenetv1.loadFromDisk('./faceapi_models'),
    ]).then(async () => {
        const labeledFaceDescriptors = await loadLabeledImages(client, baseURL)
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
        const image = await canvas.loadImage(baseURL + `/clients/images/${curImageKey}`)
        console.log('mapped the current image')
        deleteFile(curImageKey)

        const singleResult = await faceapi
            .detectSingleFace(image)
            .withFaceLandmarks()
            .withFaceDescriptor()

        if (singleResult) {
            const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor)
            let authMessage, authVal
            if (bestMatch._distance < 0.6) {
                authVal = true
                authMessage = 'Authentication passed'
            } else {
                authVal = false
                authMessage = 'Authentication failed'
            }

            console.log(authMessage)
            console.log(`difference value: ${bestMatch._distance}`)
            sendRes(_res = res, _hostAuthVal = true, _authVal = authVal, _authMessage = authMessage)
        }
    })
}

// Function to load the reference images present in Facify's database 
// for the current client. The images are loaded, processed, and 
// a face descriptor array is generated, which containes unique features
// of the reference images to match against the current image.
// **************************************
// RETURNS a LabelledFaceDescriptor array
async function loadLabeledImages(client, baseURL) {
    const descriptions = []
    try {
        let img = await canvas.loadImage(baseURL + `/clients/images/${client.image1Key}`)
        let detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
        console.log('processed first reference image')

        img = await canvas.loadImage(baseURL + `/clients/images/${client.image2Key}`)
        detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
        console.log('processed second reference image')
    } catch (err) {
        console.log(err)
    }

    return new faceapi.LabeledFaceDescriptors('UserFace', descriptions)
}

// Function to send json response back to the host site,
// which made the POST request
// *************************************
// RETURNS a json object with five keys,
// hostAuthVal: boolean val( true: host auth success, false: host auth fail)
// authVal: boolean val( true: client auth success, false: client auth fail)
// authMessage: string( message describing the state of authentication)
// errorVal: boolean val( true: error on server side)
// errorMessage: string( message describing the error that happend on the server)
function sendRes(_res, _hostAuthVal = true, _authVal = false, _authMessage = 'Did not process', _errorVal = false, _errorMessage = '') {
    _res.json({
        hostAuthVal: _hostAuthVal,
        authVal: _authVal,
        authMessage: _authMessage,
        errorVal: _errorVal,
        errorMessage: _errorMessage
    })
}

module.exports = router