const Item = require('../models/Item');
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const TIPOS_COM_TEMP_EP = ['anime', 'serie'];
const STATUS_VALIDOS = ['pretendo', 'assistindo'];

module.exports = {
  // CREATE
  async armazenar(req, res) {
    try {
      const { titulo, tipo, capa, status } = req.body;
      const userId = req.user && req.user.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!titulo || !tipo) {
        return res.status(400).json({
          error: 'Título e tipo são obrigatórios',
        });
      }

      // PRETENDO ASSISTIR
      if (status === 'pretendo') {
        const item = await Item.create(
          {
            titulo,
            tipo,
            capa,
            status: 'pretendo',
            userId,
          },
        );

        return res.status(201).json(item);
      }


      // 👉 ASSISTINDO
      const { tempo, temporada, epsodio } = req.body;

      if (!tempo) {
        return res.status(400).json({
          error: 'Tempo é obrigatório para itens assistindo',
        });
      }

      if (
        TIPOS_COM_TEMP_EP.includes(tipo) &&
        (!temporada || !epsodio)
      ) {
        return res.status(400).json({
          error: 'Temporada e episódio são obrigatórios para este tipo',
        });
      }

      const extraCampos = {};

      if (temporada) {
        extraCampos.temporada = temporada;
      }

      if (epsodio) {
        extraCampos.epsodio = epsodio;
      }

      const item = await Item.create({
        titulo,
        tipo,
        capa,
        status: 'assistindo',
        tempo,
        userId,
        ...extraCampos,
      });

      return res.status(201).json(item);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Erro ao criar item',
      });
    }
  },

  // READ
  async ler(req, res) {
    try {
      const { status } = req.query;
      const userId = req.user && req.user.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const filtroBase = { userId };
      const filtro = status ? { ...filtroBase, status } : filtroBase;

      const items = await Item.find(filtro).sort({ createdAt: -1 });
      return res.json(items);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao listar itens'
      });
    }
  },

  async atualizarCapa(req, res) {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    try {
      // Envia para Cloudinary
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: "watch-save-capas",
      });

      // Atualiza no Mongo
      const itemAtualizado = await Item.findByIdAndUpdate(
        id,
        { capa: resultado.secure_url },
        { new: true }
      );

      // Apaga arquivo local
      fs.unlinkSync(req.file.path);

      res.json(itemAtualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar capa" });
    }
  },

  // UPDATE (dados textuais)
  async editar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user && req.user.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const {
        titulo,
        tipo,
        capa,
        status,
        tempo,
        temporada,
        epsodio
      } = req.body;

      if (!titulo || !tipo) {
        return res.status(400).json({
          error: 'Título e tipo são obrigatórios'
        });
      }

      const payload = { titulo, tipo, capa };

      // CASO: ASSISTINDO
      if (status === 'assistindo') {
        if (!tempo) {
          return res.status(400).json({
            error: 'Tempo é obrigatório para itens assistindo'
          });
        }

        payload.tempo = tempo;
        payload.status = 'assistindo';

        if (TIPOS_COM_TEMP_EP.includes(tipo)) {
          if (!temporada || !epsodio) {
            return res.status(400).json({
              error: 'Temporada e episódio são obrigatórios para este tipo'
            });
          }

          payload.temporada = temporada;
          payload.epsodio = epsodio;
        } else {
          if (temporada) {
            payload.temporada = temporada;
          }

          if (epsodio) {
            payload.epsodio = epsodio;
          }
        }
      }

      // CASO: PRETENDO ASSISTIR
      if (status === 'pretendo') {
        payload.status = 'pretendo';

        // remove qualquer resquício de assistindo
        payload.tempo = undefined;
        payload.temporada = undefined;
        payload.epsodio = undefined;
      }

      const item = await Item.findOneAndUpdate(
        { _id: id, userId },
        payload,
        { new: true, runValidators: true },
      );

      if (!item) {
        return res.status(404).json({
          error: 'Item não encontrado'
        });
      }

      return res.json(item);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao atualizar item',
        details: error.message
      });
    }
  },

  // DELETE
  async deletar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user && req.user.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const item = await Item.findOneAndDelete({ _id: id, userId });

      if (!item) {
        return res.status(404).json({
          error: 'Item não encontrado'
        });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao deletar item'
      });
    }
  }
};
