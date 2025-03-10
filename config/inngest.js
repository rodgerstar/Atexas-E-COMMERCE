import { Inngest } from "inngest";
import connectDB from "@/config/db";
import User from "@/models/User";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "atexas-next" });

// Inngest Function to save user data to db
export const synchUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        _id: id,
        email: email_addresses[0]?.email_address || "", // Ensure email exists
        name: `${first_name || ""} ${last_name || ""}`.trim(), // Safely concatenate name
        image_url: image_url || "", // Fallback for image_url
      };

      // Ensure DB connection
      await connectDB();

      // Create user in DB
      const newUser = await User.create(userData);
      console.log(`User created: ${newUser._id}`);
      return { success: true, userId: newUser._id };
    } catch (error) {
      console.error("Error in syncUserCreation:", error);
      throw new Error(`Failed to sync user creation: ${error.message}`);
    }
  }
);

// Inngest Function to update user in db
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        email: email_addresses[0]?.email_address || "", // Ensure email exists
        name: `${first_name || ""} ${last_name || ""}`.trim(), // Safely concatenate name
        image_url: image_url || "", // Fallback for image_url
      };

      // Ensure DB connection
      await connectDB();

      // Update user in DB
      const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
      if (!updatedUser) {
        throw new Error(`User with ID ${id} not found`);
      }
      console.log(`User updated: ${updatedUser._id}`);
      return { success: true, userId: updatedUser._id };
    } catch (error) {
      console.error("Error in syncUserUpdation:", error);
      throw new Error(`Failed to sync user update: ${error.message}`);
    }
  }
);

// Inngest Function to delete user from db
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      const { id } = event.data;

      // Ensure DB connection
      await connectDB();

      // Delete user from DB
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        throw new Error(`User with ID ${id} not found`);
      }
      console.log(`User deleted: ${id}`);
      return { success: true, userId: id };
    } catch (error) {
      console.error("Error in syncUserDeletion:", error);
      throw new Error(`Failed to sync user deletion: ${error.message}`);
    }
  }
);