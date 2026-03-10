const express = require('express')
const multer = require('multer');
const ItemController = require('../controllers/ItemController')
const upload = require("../middlewares/upload");
const authMiddleware = require('../middlewares/auth');

const router = express.Router()

// Criar item
// POST http://localhost:3333/api/items para adicionar dados
router.post('/items', authMiddleware, ItemController.armazenar)

// Listar itens
// GET http://localhost:3333/api/items para ler dados
router.get('/items', authMiddleware, ItemController.ler)

// UPDATE
// PUT http://localhost:3333/api/items/ID_DO_ITEM para editar/alterar
router.put('/items/:id', authMiddleware, ItemController.editar)

router.patch(
  "/items/:id/capa",
  upload.single("capa"),
  authMiddleware,
  ItemController.atualizarCapa 
);

// DELETE
//DELETE  http://localhost:3333/api/items/ID_DO_ITEM usar no Postman para deletar
router.delete('/items/:id', authMiddleware, ItemController.deletar)

module.exports = router