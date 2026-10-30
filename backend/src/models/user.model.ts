import { Schema, model } from "mongoose";
import type { IUser } from "../types/user.type";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationTokenExpiry: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordTokenExpiry:{
        type: Date
    },
    avatarUrl: {
        type: String,
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });



userSchema.pre<IUser>("save", function () {
    if (this.isNew) {
        this.avatarUrl = `https://res.cloudinary.com/dyvf51tiu/image/upload/v1762787877/avatars/${this.name.charAt(0).toUpperCase()}.png`;
    }
});


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password: string) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({ _id: this._id, email: this.email, name: this.name }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.forgotPasswordTokenExpiry = Date.now() + 2 * 24 * 60 * 60 * 1000;

    return resetToken;
};
const User = model<IUser>('User', userSchema);

export default User;
