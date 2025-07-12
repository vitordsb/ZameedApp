/**
 * This is a utility script to help create the first admin user in the system.
 * 
 * To use this script, run it from the console in your browser:
 * 1. Open your browser's developer tools (F12 or right-click -> Inspect)
 * 2. Go to the Console tab
 * 3. Copy and paste this entire script into the console
 * 4. Run it by pressing Enter
 * 5. Follow the instructions in the console
 */

(async function setupAdmin() {
  try {
    console.log("Z Platform - Admin Bootstrap Utility");
    console.log("===================================");
    console.log("This utility will create the first admin user in the system.");
    console.log("You should only run this once when setting up the platform.");
    
    // Replace these values with your desired admin credentials
    const adminData = {
      username: "admin",
      password: "admin1234",
      confirmPassword: "admin1234",
      email: "admin@example.com",
      name: "System Admin",
      userType: "admin"
    };
    
    console.log("\nAttempting to create admin user with:");
    console.log(`Username: ${adminData.username}`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Name: ${adminData.name}`);
    
    const response = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("\n✅ Success! Admin user created.");
      console.log("You can now log in using the provided credentials.");
      console.log("Access the admin dashboard at /admin after logging in.");
    } else {
      console.error("\n❌ Failed to create admin user.");
      console.error(`Error: ${result.message || 'Unknown error'}`);
      console.log("This might be because an admin user already exists.");
    }
  } catch (error) {
    console.error("\n❌ An error occurred:", error);
    console.log("Please check your network connection and try again.");
  }
})();