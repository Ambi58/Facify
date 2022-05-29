const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const { ensureAuth, ensureGuest } = require('../middleware/auth')

const Client = require('../models/Client')
const upload = multer({ dest: 'public/uploads/' })
const imageUpload = upload.fields([{ name: 'refImage1', maxCount: 1 }, { name: 'refImage2', maxCount: 1 }])

const { uploadFile, deleteFile, getFileStream } = require('../middleware/s3')

// @desc    Show add page
// @route   GET /clients/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('clients/add')
})

// @desc    Process add page
// @route   POST /clients
router.post('/', ensureAuth, imageUpload, async (req, res) => {
    try {
        const file1 = req.files.refImage1[0]        //uploading reference image 1 to aws
        const result1 = await uploadFile(file1)
        await unlinkFile(file1.path)
        req.body.image1Key = result1.key

        const file2 = req.files.refImage2[0]        //uploading reference image 2 to aws
        const result2 = await uploadFile(file2)
        await unlinkFile(file2.path)
        req.body.image2Key = result2.key

        req.body.user = req.user.id
        await Client.create(req.body)
        res.redirect('/dashboard')
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc    Get the images stored on the server
// @route   GET /clients/images/:key
router.get('/images/:key', (req, res) => {
    const key = req.params.key
    const readStream = getFileStream(key)

    readStream.pipe(res)
})

// @desc    Show single client
// @route   GET /clients/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        let client = await Client.findById(req.params.id).populate('user').lean()

        if (!client) {
            return res.render('error/404')
        }

        if (client.user._id != req.user.id) {
            res.render('error/404')
        } else {
            res.render('clients/show', {
                client,
            })
        }
    } catch (err) {
        console.error(err)
        res.render('error/404')
    }
})

// @desc    Show edit page
// @route   GET /clients/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const client = await Client.findOne({
            _id: req.params.id
        }).lean()

        if (!client) {
            return res.render('error/404')
        }

        if (client.user != req.user.id) {
            res.redirect('/clients')
        } else {
            res.render('clients/edit', {
                client,
            })
        }
    } catch (err) {
        console.error(err)
        return res
            .render('error/500')
    }
})

// @desc    Update client/Process edit Page
// @route   PUT /clients/:id
router.put('/:id', ensureAuth, imageUpload, async (req, res) => {
    try {
        let client = await Client.findById(req.params.id).lean()
        if (!client) {
            return res.render('error/404')
        }

        if (client.user != req.user.id) {
            res.redirect('/clients')
        } else {
            if (req.files.refImage1) {
                const file1 = req.files.refImage1[0]
                if (file1 != null) {
                    deleteFile(client.image1Key)
                    const result1 = await uploadFile(file1)
                    await unlinkFile(file1.path)
                    req.body.image1Key = result1.key
                }
            } else {
                req.body.image1Key = client.image1Key
            }

            if (req.files.refImage2) {
                const file2 = req.files.refImage2[0]
                if (file2 != null) {
                    deleteFile(client.image2Key)
                    const result2 = await uploadFile(file2)
                    await unlinkFile(file2.path)
                    req.body.image2Key = result2.key
                }
            } else {
                req.body.image2Key = client.image2Key
            }

            client = await Client.findOneAndUpdate({ _id: req.params.id }, req.body, {
                new: true,
                runValidators: true
            })
            res.redirect('/dashboard')
        }
    } catch (err) {
        console.error('hello')
        console.error(err)
        return res.render('error/500')
    }
})

// @desc    Delete client
// @route   Delete /clients/:id
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const client = await Client.findOne({
            _id: req.params.id
        }).lean()
        deleteFile(client.image1Key)
        deleteFile(client.image2Key)
        await Client.remove({ _id: req.params.id })
        res.redirect('/dashboard')
    } catch (err) {
        console.error(err)
        return res.render('error/500')
    }
})

module.exports = router