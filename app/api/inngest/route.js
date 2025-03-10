import { serve } from "inngest/next";
import {inngest, synchUserCreation, syncUserDeletion, syncUserUpdation} from "@/config/inngest";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
      synchUserCreation,
      syncUserUpdation,
      syncUserDeletion
  ],
});
