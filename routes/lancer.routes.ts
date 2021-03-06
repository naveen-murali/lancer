import { Router } from "express";
import { Role } from "../util";
import { Routes } from "../interface";
import { LancerController } from "../controllers";
import { UpdateLancerBodyVal } from "../validation";
import { checkRoles, protect, ValidateBody } from "../middleware";

export class LancerRoutes implements Routes {
    public path: string = "/lancer";
    public router: Router = Router();
    private lancerController: LancerController = new LancerController();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes(): void {
        const lancer = this.path;

        const { getLancer, updateLancer, getLancersCounts, getOneUserDetails, getOneUserOrders } =
            this.lancerController;

        this.router
            .route(`${lancer}`)
            .get(protect, checkRoles([Role.ADMIN]), getLancer)
            .put(
                protect,
                checkRoles([Role.ADMIN]),
                ValidateBody(UpdateLancerBodyVal.safeParse),
                updateLancer
            );

        this.router
            .route(`${lancer}/counts`)
            .get(protect, checkRoles([Role.ADMIN]), getLancersCounts);

        this.router
            .route(`${lancer}/users/:id`)
            .get(protect, checkRoles([Role.ADMIN]), getOneUserDetails);

        this.router
            .route(`${lancer}/users/:id/orders`)
            .get(protect, checkRoles([Role.ADMIN]), getOneUserOrders);
    }
}
