const mongoose = require('mongoose')

const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    image1Key: {
        type: String,
        required: false
    },
    image2Key: {
        type: String,
        required: false
    }

})

module.exports = mongoose.model('Client', ClientSchema)