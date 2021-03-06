import { OAuth2Client } from "google-auth-library";
import { nanoid } from "nanoid";
import { RefEnum } from "../util";
import { client } from "../config";
import { Admin, Lancer, Referrals, User } from "../models";
import { PhoneVarificationBody, SignupBody } from "../validation";
import {
    HttpException,
    NotFoundException,
    BadRequestException
} from "../exceptions";

export class AuthService {
    private User = User;
    private Admin = Admin;
    private Lancer = Lancer;
    private Referrals = Referrals;
    private authClient = new OAuth2Client(`${process.env.GOOGLE_CLIENT_ID}`);

    createUser = async (user: SignupBody) => {
        if (!(await this.varifyOtp(user.phone, user.otp)))
            throw new HttpException(401, "Otp varification failed");

        let lancer;
        let refUser;
        if (user.referralId) {
            const [lancerResult, refUserResult] = await Promise.all([
                this.Lancer.findOne().select("-createdAt -updatedAt -wallet -commission"),
                this.User.findOne({ referralId: user.referralId }),
            ]);

            lancer = lancerResult;
            refUser = refUserResult;
        }

        const refAmount: Number = lancer ? lancer.referralAmount : 0;
        const newUser = await this.User.create({
            ...user,
            referralId: nanoid(RefEnum.LENGTH),
            isPhoneVerified: true,
            wallet: refAmount,
        });

        if (!newUser)
            throw new HttpException(400, "Falied to create user");

        if (refUser) {
            refUser.wallet = refUser.wallet.valueOf() + refAmount.valueOf();
            refUser.referralNum = refUser.referralNum.valueOf() + 1;
            refUser.save().catch();

            const referrals = await this.Referrals.findOne({ user: refUser._id });

            if (referrals) {
                referrals.referrals.push({
                    user: newUser._id,
                    amount: refAmount.valueOf(),
                });
                referrals.save().catch();
            } else {
                this.Referrals.create({
                    user: refUser._id,
                    referrals: [
                        {
                            user: newUser._id,
                            amount: refAmount.valueOf(),
                        },
                    ],
                }).catch();
            }
        }

        return newUser;
    };

    createUsingGoogle = async (tokenId: string) => {
        const data = await this.getGoogleData(tokenId);
        const payload = data.getPayload();

        if (!payload)
            throw new HttpException(401, "invalied credential");

        const name = payload.name;
        const email = payload.email;
        const image = payload.picture;
        const googleId = data.getUserId();

        const newUser = await this.User.create({
            name,
            email,
            googleId,
            image: {
                url: image,
            },
            referralId: nanoid(RefEnum.LENGTH),
            isEmailVarified: true,
        });

        if (!newUser)
            throw new HttpException(400, "Falied to create user");

        return newUser;
    };

    signinUser = async (email: string, password: string) => {
        const user = await this.User.findOne({ email });

        if (user && user.isBlocked)
            throw new HttpException(401, "Account has been blocked");

        if (user && (await user.matchPassword(password)))
            return user;
        else
            throw new HttpException(401, "Credential incorrect");
    };

    signinUsingGoogle = async (tokenId: string) => {
        const data = await this.getGoogleData(tokenId);
        const user = await this.User.findOne({ googleId: data.getUserId() });

        if (!user)
            throw new HttpException(401, "Account is not registered");

        if (user && user.isBlocked)
            throw new HttpException(401, "Account has been blocked");

        return user;
    };

    signinAdmin = async (email: string, password: string) => {
        const admin = await this.Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password)))
            return admin;
        else
            throw new HttpException(401, "Credential incorrect");
    };

    varifyPhone = async (id: string, data: PhoneVarificationBody) => {
        const user = await this.User.findById(id);

        if (!user)
            throw new NotFoundException("user not found");

        if (!(await this.varifyOtp(data.phone, data.otp)))
            throw new BadRequestException("Invalied OTP, Varification failed");

        user.isPhoneVerified = true;
        await user.save();

        return true;
    };

    linkGoogle = async (id: string, tokenId: string) => {
        const user = await this.User.findById(id);

        if (!user)
            throw new NotFoundException("user not found");

        const data = await this.authClient
            .verifyIdToken({
                idToken: tokenId,
                audience: `${process.env.GOOGLE_CLIENT_ID}`,
            })
            .catch((_err) => {
                throw new HttpException(401, "google account authentication failed");
            });

        const payload = data.getPayload()
        if (!payload)
            throw new HttpException(401, "invalied credential");

        const email = payload.email;
        const image = payload.picture;
        const googleId = data.getUserId();

        user.email = (email as string) || user.email;
        user.image = {
            url: image as string,
        };
        user.googleId = googleId as string;
        user.isEmailVarified = true;
        await user.save();

        return user.email;
    };
    
    getGoogleData = async (tokenId: string) => {
        const data = await this.authClient
            .verifyIdToken({
                idToken: tokenId,
                audience: `${process.env.GOOGLE_CLIENT_ID}`,
            })
            .catch((_err) => {
                throw new HttpException(401, "google account authentication failed");
            });

        return data;
    };

    sendOtp = async (phone: string): Promise<boolean> | never => {
        try {
            await client.verify
                .services(`${process.env.TWILIO_SERVICE_ID}`)
                .verifications.create({ to: `+91${phone}`, channel: "sms" });

            return true;
        } catch (_err) {
            throw new HttpException(400, "Failed to send otp, Please try again");
        }
    };

    varifyOtp = async (phone: string, otp: string): Promise<boolean> | never => {
        console.log(phone, otp);

        try {
            const { status } = await client.verify
                .services(`${process.env.TWILIO_SERVICE_ID}`)
                .verificationChecks.create({ to: `+91${phone}`, code: otp });

            if (status !== "approved")
                throw new Error("not approved");

            return true;
        } catch (_err) {
            throw new HttpException(400, "Invalid OTP");
        }
    };
}
