const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema(
  { 
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    capa: {
      type: String,
      default: null
    },
    tipo: {
      type: String,
      enum: ['anime', 'filme', 'serie', 'documentario'],
      required: true
    },

    // OPCIONAL (não existe em filme)
    temporada: {
      type: Number,
      required: false,
      min: 1
    },

    // OPCIONAL (não existe em filme)
    epsodio: {
      type: Number,
      required: false,
      min: 1
    },

    tempo: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pretendo', 'assistindo'],
      default: 'pretendo',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },

  {
    timestamps: true
  }
)

module.exports = mongoose.model('Item', ItemSchema)
