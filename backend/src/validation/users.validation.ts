import { z } from 'zod';
import { Certification, Description, Email, Name, Password, PersonalWebsite, Skill } from './common.validation';


// edit user profile
export const EditUserBodyVal = z.object({
    name: Name.optional(),
    password: Password.optional(),
});
export type EditUserBody = z.infer<typeof EditUserBodyVal>;


// becomming a seller body
export const AddSellerInfoBodyVal = z.object({
    description: Description,
    personalWebsite: PersonalWebsite,
    certifications: z
        .array(Certification, {
            required_error: "certifications is required",
            invalid_type_error: "certifications should be an array"
        }).optional(),
    skills: z
        .array(Skill, {
            required_error: "skills is required",
            invalid_type_error: "skills should be an array"
        })
});
export type AddSellerInfoBody = z.infer<typeof AddSellerInfoBodyVal>;