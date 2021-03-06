import { Router } from "express";
import { Role } from "../util";
import { Routes } from "../interface";
import { UserController } from "../controllers";
import { protect, checkRoles, ValidateBody } from "../middleware";
import {
    AddSellerInfoBodyVal,
    EditSellerInfoBodyVal,
    EditUserBodyVal
} from "../validation";

export class UserRoutes implements Routes {
    public path: string = "/users";
    public router: Router = Router();
    public userController: UserController = new UserController();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes(): void {
        const users = this.path;
        const {
            editUser,
            blockUser,
            unblockUser,
            getAllUsers,
            getUserById,
            addSellerInfo,
            getSellerInfo,
            editSellerInfo,
            getUsersEarnings,
            getUsersReferrals,
        } = this.userController;

        this.router
            .route(`${users}`)
            .get(protect, checkRoles([Role.ADMIN]), getAllUsers);

        this.router
            .route(`${users}/:id/earnings`)
            .get(protect, checkRoles([Role.BUYER]), getUsersEarnings);

        this.router
            .route(`${users}/:id/referrals`)
            .get(protect, checkRoles([Role.BUYER]), getUsersReferrals);

        this.router
            .route(`${users}/:id/sellers`)
            .get(getSellerInfo)
            .post(
                protect,
                checkRoles([Role.BUYER]),
                ValidateBody(AddSellerInfoBodyVal.safeParse),
                addSellerInfo
            )
            .put(
                protect,
                checkRoles([Role.SELLER]),
                ValidateBody(EditSellerInfoBodyVal.safeParse),
                editSellerInfo
            );

        this.router
            .route(`${users}/:id/block`)
            .patch(protect, checkRoles([Role.ADMIN]), blockUser);

        this.router
            .route(`${users}/:id/unblock`)
            .patch(protect, checkRoles([Role.ADMIN]), unblockUser);

        this.router
            .route(`${users}/:id`)
            .get(protect, checkRoles([Role.BUYER]), getUserById)
            .put(
                protect,
                checkRoles([Role.BUYER, Role.SELLER]),
                ValidateBody(EditUserBodyVal.safeParse),
                editUser
            );
    }
}
