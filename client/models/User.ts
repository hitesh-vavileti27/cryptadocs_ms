import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    mobileNumber: { type: String },
    dob: { type: String },
    dateOfBirth: { type: String },
    password: { type: String },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
export { User as UserModel };