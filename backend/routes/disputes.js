import express from 'express';
import {
  createDispute,
  addDisputeMessage,
  resolveDispute,
  getDisputeDetails,
  getMyDisputes,
  getAllDisputes,
  getDisputeStats
} from '../controllers/disputeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.get('/stats', getDisputeStats);

router.use(authenticateToken);

router.post('/', [
  body('paymentId').isMongoId().withMessage('Invalid payment ID'),
  body('reason').isIn([
    'work_not_delivered',
    'work_incomplete', 
    'work_poor_quality',
    'requirements_not_met',
    'communication_issues',
    'deadline_missed',
    'payment_issue',
    'other'
  ]).withMessage('Invalid dispute reason'),
  body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters')
], createDispute);

router.get('/', getAllDisputes);
router.get('/my-disputes', getMyDisputes);
router.get('/:disputeId', validateObjectId('disputeId'), getDisputeDetails);

router.post('/:disputeId/messages', [
  ...validateObjectId('disputeId'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
], addDisputeMessage);

router.put('/:disputeId/resolve', [
  ...validateObjectId('disputeId'),
  body('resolution').isIn(['refund_client', 'pay_freelancer', 'partial_refund', 'no_action']).withMessage('Invalid resolution'),
  body('resolutionNotes').optional().isLength({ max: 500 }).withMessage('Resolution notes cannot exceed 500 characters'),
  body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be a positive number')
], resolveDispute);

export default router;
