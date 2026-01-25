import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { applicationService } from "../services/applicationService";
import { userService } from "../services/userService";
import { env } from "../utils/env";
import dayjs from "dayjs";
import { Driver } from "@/schemas/driversSchema";
import { User } from "@/schemas/usersSchema";

// --- Seed Data ---

const users: any[] = [
  {
    name: "Henri Admin",
    email: "henrir1020@gmail.com",
    password: "password123", // Password only used if user is created from scratch
    role: "Admin",
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "Admin",
  },
  {
    name: "Manager User",
    email: "manager@example.com",
    password: "password123",
    role: "Manager",
  },
  {
    name: "Viewer User",
    email: "viewer@example.com",
    password: "password123",
    role: "Viewer",
  },
];

const drivers: any[] = [];
const vehicles: any[] = [];
const applications: any[] = [];

async function seed() {
  console.log(`Seeding data for APP_ID: ${env.APP_ID}...`);

  try {
    // 1. Seed Users (and Auth)
    console.log("Seeding Users...");
    for (const u of users) {
      // Logic to ensure user has correct role even if already exists
      const existingInFirestore = await userService.getByEmail(u.email);
      
      if (existingInFirestore && existingInFirestore.id) {
        console.log(`User ${u.email} exists in Firestore. Ensuring role is ${u.role}...`);
        await userService.updateUser(existingInFirestore.id, { role: u.role });
      } else {
        // Check if exists in Auth but not Firestore
        try {
          // Note: userService doesn't expose auth directly, but we can try to create
          // if it fails with 'already exists', we know we need to sync
          await userService.createUser(u);
          console.log(`Created new user: ${u.email} (${u.role})`);
        } catch (err: any) {
          if (err.code === 'auth/email-already-exists' || err.message?.includes('already exists')) {
             console.log(`User ${u.email} exists in Auth. You may need to manually update their Firestore doc if it is missing.`);
             // Ideally we'd sync here, but let's stick to the easiest path for the user
          } else {
            console.error(`Error with user ${u.email}:`, err.message);
          }
        }
      }
    }

    // 2. Seed Drivers
    console.log("Seeding Drivers...");
    for (const d of drivers) {
      // Check for existing driver (basic check by email)
      const existing = await driverService.getAll();
      const exists = existing.some(ed => ed.email === d.email);
      
      if (!exists) {
        await driverService.createDriver(d);
        console.log(`Created driver: ${d.firstName} ${d.lastName}`);
      } else {
        console.log(`Driver with email ${d.email} already exists. Skipping creation.`);
      }
    }

    // 3. Seed Vehicles
    console.log("Seeding Vehicles...");
    for (const v of vehicles) {
      // Basic check for existing vehicle by busNumber
      const existingVehicles = await vehicleService.getAll();
      const exists = existingVehicles.some(ev => ev.busNumber === v.busNumber);

      if (!exists) {
        await vehicleService.createVehicle(v);
        console.log(`Created vehicle: ${v.busNumber}`);
      } else {
        console.log(`Vehicle ${v.busNumber} already exists. Skipping.`);
      }
    }

    // 4. Seed Applications
    console.log("Seeding Applications...");
    for (const a of applications) {
      // Application creation doesn't have a unique constraint check easily available in service,
      // but creating duplicates in seed is generally fine or we can clear db first.
      // We'll just create them.
      await applicationService.create(a);
      console.log(
        `Created application: ${a.personalInfo.firstName} ${a.personalInfo.lastName}`
      );
    }

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
