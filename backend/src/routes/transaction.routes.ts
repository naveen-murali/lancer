import { Router } from 'express';
import { Routes } from "../interface";
import { Role } from '../util';
import { TransactionController } from '../controllers';
import { CreatePaypalPaymentBodyVal, CreateWithdrawalRequestBodyVal } from '../validation';
import { checkRoles, protect, ValidateBody } from '../middleware';

export class TransactionRoutes implements Routes {
    public path: string = "/transactions";
    public router: Router = Router();
    private transactionController: TransactionController = new TransactionController();

    constructor() { this.initializeRoutes(); }

    initializeRoutes(): void {
        const transactions = this.path;

        const {
            createPaypalPyament,
            getUserTransactions,
            getAllTransactions,
            refundTransaction,
            cancelTransaction,
            withdrawTransaction,
            withdrawRequest,
        } = this.transactionController;

        this.router
            .route(`${transactions}`)
            .get(protect, checkRoles([Role.BUYER]), getUserTransactions);

        this.router
            .route(`${transactions}/admin`)
            .get(protect, checkRoles([Role.ADMIN]), getAllTransactions);

        this.router
            .route(`${transactions}/payment/paypal`)
            .post(protect, checkRoles([Role.BUYER]), ValidateBody(CreatePaypalPaymentBodyVal.safeParse), createPaypalPyament);

        this.router
            .route(`${transactions}/withdraw`)
            .post(protect, checkRoles([Role.BUYER]), ValidateBody(CreateWithdrawalRequestBodyVal.safeParse), withdrawRequest);

        this.router
            .route(`${transactions}/:id/withdraw`)
            .patch(protect, checkRoles([Role.ADMIN]), withdrawTransaction);

        this.router
            .route(`${transactions}/:id/refund`)
            .patch(protect, checkRoles([Role.ADMIN]), refundTransaction);

        this.router
            .route(`${transactions}/:id/cancel`)
            .patch(protect, checkRoles([Role.ADMIN]), cancelTransaction);
    }
}