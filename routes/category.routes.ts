import { Router } from "express";
import { Role } from "../util";
import { Routes } from "../interface";
import { CategoryController } from "../controllers";
import {
    AddCategoryBodyVal,
    AddSubCategoryBodyVal,
    EditCategoryBodyVal,
    EditSubCategoryBodyVal,
} from "../validation";
import { protect, checkRoles, ValidateBody } from "../middleware";

export class CategoryRoutes implements Routes {
    public path: string = "/category";
    public router: Router = Router();
    public categoryController: CategoryController = new CategoryController();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes(): void {
        const category = this.path;
        const {
            addCategory,
            addSubCategory,
            getAllCategory,
            getAllCategoryForAdmin,
            getCategorySubcategory,
            editCategory,
            editSubCategory,
            getOneSubCategory,
            blockCategory,
            unblockCategory,
            blockSubCategory,
            unblockSubCategory,
            getCategorySubcategoryForAdmin,
        } = this.categoryController;

        this.router
            .route(`${category}`)
            .get(getAllCategory)
            .post(
                protect,
                checkRoles([Role.ADMIN]),
                ValidateBody(AddCategoryBodyVal.safeParse),
                addCategory
            );

        this.router
            .route(`${category}/admin`)
            .get(protect, checkRoles([Role.ADMIN]), getAllCategoryForAdmin);

        this.router
            .route(`${category}/subcategory`)
            .post(
                protect,
                checkRoles([Role.ADMIN]),
                ValidateBody(AddSubCategoryBodyVal.safeParse),
                addSubCategory
            );

        this.router
            .route(`${category}/subcategory/:id`)
            .get(protect, checkRoles([Role.ADMIN]), getOneSubCategory)
            .put(
                protect,
                checkRoles([Role.ADMIN]),
                ValidateBody(EditSubCategoryBodyVal.safeParse),
                editSubCategory
            );

        this.router
            .route(`${category}/block/:id`)
            .patch(protect, checkRoles([Role.ADMIN]), blockCategory);

        this.router
            .route(`${category}/unblock/:id`)
            .patch(protect, checkRoles([Role.ADMIN]), unblockCategory);

        this.router
            .route(`${category}/subcategory/block/:id`)
            .patch(protect, checkRoles([Role.ADMIN]), blockSubCategory);

        this.router
            .route(`${category}/subcategory/unblock/:id`)
            .patch(protect, checkRoles([Role.ADMIN]), unblockSubCategory);

        this.router
            .route(`${category}/admin/:id`)
            .get(protect, checkRoles([Role.ADMIN]), getCategorySubcategoryForAdmin);

        this.router
            .route(`${category}/:id`)
            .get(getCategorySubcategory)
            .put(
                protect,
                checkRoles([Role.ADMIN]),
                ValidateBody(EditCategoryBodyVal.safeParse),
                editCategory
            );
    }
}
