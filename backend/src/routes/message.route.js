import Router from 'express'
import {authMiddleware} from '../middlewares/auth.middleware.js'
import { createCoversation, getCoversations, sendMessage , getMessages, deleteConversation, renameConversation} from '../controllers/message.controller.js'

const router = Router()

router.post('/create-conversation', authMiddleware, createCoversation)
router.get('/get-conversations', authMiddleware, getCoversations)
router.post('/send-message/:conversationId', authMiddleware, sendMessage)   
router.get('/get-message/:conversationId', authMiddleware, getMessages)   
router.delete('/delete-conversation/:conversationId', authMiddleware, deleteConversation)
router.put('/rename-conversation/:conversationId', authMiddleware, renameConversation)

export default router