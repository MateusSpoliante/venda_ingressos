/**
 * @swagger
 * tags:
 *   - name: Usuários
 *     description: Rotas de cadastro e login
 *   - name: Eventos
 *     description: CRUD de eventos
 *   - name: Ingressos
 *     description: Controle de ingressos
 *   - name: Pedidos
 *     description: Criação e listagem de pedidos
 *   - name: Transferência
 *     description: Transferência de ingressos entre usuários
 */

/**
 * @swagger
 * /api/cadastro:
 *   post:
 *     summary: Cadastra um novo usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cpfCnpj:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               organizador:
 *                 type: string
 *                 enum: [S, N]
 *     responses:
 *       200:
 *         description: Usuário cadastrado com sucesso
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Faz login de usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */

/**
 * @swagger
 * /api/eventos:
 *   get:
 *     summary: Lista todos os eventos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Retorna todos os eventos cadastrados
 */

/**
 * @swagger
 * /api/organizador/eventos:
 *   get:
 *     summary: Lista eventos do organizador logado
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retorna eventos do organizador
 */

/**
 * @swagger
 * /api/organizador/eventos:
 *   post:
 *     summary: Cria um novo evento
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               data_evento:
 *                 type: string
 *                 format: date-time
 *               categoria:
 *                 type: string
 *               estado:
 *                 type: string
 *               cidade:
 *                 type: string
 *               local:
 *                 type: string
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Evento criado com sucesso
 */

/**
 * @swagger
 * /api/ingressos/{eventoId}:
 *   get:
 *     summary: Lista ingressos de um evento
 *     tags: [Ingressos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Retorna os ingressos do evento
 */

/**
 * @swagger
 * /api/organizador/ingressos:
 *   post:
 *     summary: Cria ingressos para um evento
 *     tags: [Ingressos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               evento_id:
 *                 type: integer
 *               tipo_ingresso:
 *                 type: string
 *               preco:
 *                 type: number
 *               quantidade:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ingresso criado com sucesso
 */

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Cria um novo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingresso_id:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                     preco_unitario:
 *                       type: number
 *     responses:
 *       200:
 *         description: Pedido criado com sucesso
 */

/**
 * @swagger
 * /api/pedidos/meus:
 *   get:
 *     summary: Lista pedidos do usuário autenticado
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retorna lista de pedidos
 */

/**
 * @swagger
 * /api/vendas/organizador:
 *   get:
 *     summary: Lista todas as vendas dos eventos do organizador logado
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retorna uma lista de vendas
 *       500:
 *         description: Erro ao buscar vendas do organizador
 */

/* ============================================================
   ===============  ROTAS DE TRANSFERÊNCIA  ====================
   ============================================================ */

/**
 * @swagger
 * /api/ingressos/transferir:
 *   post:
 *     summary: Cria uma solicitação de transferência de ingresso
 *     tags: [Transferência]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingresso_id:
 *                 type: integer
 *               cpf_destinatario:
 *                 type: string
 *               valor:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Solicitação criada com sucesso
 *       400:
 *         description: Erro ao criar solicitação
 */

/**
 * @swagger
 * /api/ingressos/transferencias/recebidas:
 *   get:
 *     summary: Lista transferências recebidas pelo usuário autenticado
 *     tags: [Transferência]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transferências recebidas
 */

/**
 * @swagger
 * /api/ingressos/transferencias/enviadas:
 *   get:
 *     summary: Lista transferências enviadas pelo usuário autenticado
 *     tags: [Transferência]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transferências enviadas
 */

/**
 * @swagger
 * /api/ingressos/transferencias/aceitar:
 *   post:
 *     summary: Aceita uma solicitação de transferência
 *     tags: [Transferência]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferencia_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transferência concluída
 *       400:
 *         description: Erro ao concluir transferência
 */

/**
 * @swagger
 * /api/ingressos/transferencias/recusar:
 *   post:
 *     summary: Recusa uma solicitação de transferência
 *     tags: [Transferência]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferencia_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transferência recusada
 *       400:
 *         description: Erro ao recusar transferência
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
