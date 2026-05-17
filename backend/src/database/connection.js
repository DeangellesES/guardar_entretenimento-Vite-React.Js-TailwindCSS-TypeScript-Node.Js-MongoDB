const mongoose = require('mongoose')
const dns = require('dns')

dns.setServers(['8.8.8.8', '8.8.4.4'])

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('🟢 MongoDB conectado')
  } catch (error) {
    console.error('🔴 Erro ao conectar no MongoDB', error)
  }
}

module.exports = connectDatabase