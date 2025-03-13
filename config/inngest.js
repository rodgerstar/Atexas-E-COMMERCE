import { Inngest } from "inngest";
import connectDB from "@/config/db";
import User from "@/models/User";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "atexas-next" });

// Inngest Function to save user data to db
export const synchUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log("Received clerk/user.created event:", JSON.stringify(event, null, 2));
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      console.log("Extracted user data:", { id, first_name, last_name, email_addresses, image_url });

      // Prepare user data with correct field names and validation
      const userData = {
        _id: id,
        email: email_addresses[0]?.email_address || "", // Ensure email exists
        name: `${first_name || ""} ${last_name || ""}`.trim() || "Unknown", // Safely concatenate name, default to "Unknown"
        imageUrl: image_url || "", // Use camelCase to match schema
      };
      console.log("Prepared user data for creation:", userData);

      // Validate required fields
      if (!id) {
        throw new Error("User ID is required but was not provided in the event data");
      }
      if (!userData.email) {
        throw new Error("Email is required but was not provided in the event data");
      }
      if (!userData.imageUrl) {
        throw new Error("Image URL is required but was not provided in the event data");
      }

      // Ensure DB connection
      await connectDB();
      console.log("Database connection established for user creation");

      // Create user in DB
      const newUser = await User.create(userData);
      console.log(`User created successfully: ${newUser._id}`);
      return { success: true, userId: newUser._id };
    } catch (error) {
      console.error("Error in syncUserCreation:", error);
      if (error.name === "ValidationError") {
        console.error("Validation errors:", error.errors);
      } else if (error.code === 11000) {
        console.error("Duplicate key error:", error.keyValue);
      }
      throw new Error(`Failed to sync user creation: ${error.message}`);
    }
  }
);

// Inngest Function to update user in db
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log("Received clerk/user.updated event:", JSON.stringify(event, null, 2));
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      console.log("Extracted user data:", { id, first_name, last_name, email_addresses, image_url });

      // Prepare user data with correct field names and validation
      const userData = {
        email: email_addresses[0]?.email_address || "", // Ensure email exists
        name: `${first_name || ""} ${last_name || ""}`.trim() || "Unknown", // Safely concatenate name
        imageUrl: image_url || "", // Use camelCase to match schema
      };
      console.log("Prepared user data for update:", userData);

      // Validate required fields
      if (!id) {
        throw new Error("User ID is required but was not provided in the event data");
      }
      if (!userData.email) {
        throw new Error("Email is required but was not provided in the event data");
      }
      if (!userData.imageUrl) {
        throw new Error("Image URL is required but was not provided in the event data");
      }

      // Ensure DB connection
      await connectDB();
      console.log("Database connection established for user update");

      // Update user in DB
      const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
      if (!updatedUser) {
        console.warn(`User with ID ${id} not found during update`);
        throw new Error(`User with ID ${id} not found`);
      }
      console.log(`User updated successfully: ${updatedUser._id}`);
      return { success: true, userId: updatedUser._id };
    } catch (error) {
      console.error("Error in syncUserUpdation:", error);
      if (error.name === "ValidationError") {
        console.error("Validation errors:", error.errors);
      } else if (error.code === 11000) {
        console.error("Duplicate key error:", error.keyValue);
      }
      throw new Error(`Failed to sync user update: ${error.message}`);
    }
  }
);

// Inngest Function to delete user from db
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    console.log("Received clerk/user.deleted event:", JSON.stringify(event, null, 2));
    try {
      const { id } = event.data;
      console.log("Extracted user ID for deletion:", id);

      if (!id) {
        throw new Error("User ID is required for deletion");
      }

      // Ensure DB connection
      await connectDB();
      console.log("Database connection established for user deletion");

      // Delete user from DB
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        console.warn(`User with ID ${id} not found during deletion`);
        return { success: false, message: `User with ID ${id} not found` };
      }
      console.log(`User deleted successfully: ${id}`);
      return { success: true, userId: id };
    } catch (error) {
      console.error("Error in syncUserDeletion:", error);
      throw new Error(`Failed to sync user deletion: ${error.message}`);
    }
  }
);

// ingest function to create useer order in db
export const createUserOrder = inngest.createFunction(
    {
      id: 'create-user-order',
      batchEvents: {
        maxSize: 5,
        timeout: '5s'
      }
    },
    {event: 'order/created'},
    async ({events}) => {
      const orders = events.map((event)=> {
        return {
          userId: event.data.userId,
          items: event.data.items,
          amount: event.data.amount,
          address: event.data.address,
          date: event.data.date
        }
      })

      await connectDB()
      await Order.insertMany(orders)

      return { success: true, processed: orders.length}

    }
)