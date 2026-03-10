const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

module.exports = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(
        null,
        path.resolve(__dirname, '..', '..', '..', 'uploads')
      )
    },

    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(6).toString('hex')
      const fileName = `${hash}-${file.originalname}`
      cb(null, fileName)
    },
  }),

  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'))
    }
    cb(null, true)
  },
}
