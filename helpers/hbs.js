const moment = require('moment')

module.exports = {
    formatDate: function (date, format) {
        return moment(date).format(format)
    },
    editIcon: function (clientUser, loggedUser, clientId, floating = true) {
        if (clientUser._id.toString() == loggedUser._id.toString()) {
            if (floating) {
                return `<a href="/clients/edit/${clientId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`
            } else {
                return `<a href="/clients/edit/${clientId}"><i class="fas fa-edit fa-small"></i></a>`
            }
        } else {
            return ''
        }
    }
}