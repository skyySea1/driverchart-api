import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { applicationService } from "../services/applicationService";
import { userService } from "../services/userService";
import { db } from "../services/firebaseService";
import { env } from "../utils/env";
import dayjs from "dayjs";
import { Driver } from "@/schemas/driversSchema";
import { Application } from "@/schemas/applicationSchema";
import { User } from "@/schemas/usersSchema";

// --- Seed Data ---

const users: any[] = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "desenv",
    role: "Admin",
  },
  {
    name: "Manager User",
    email: "manager@example.com",
    password: "desenv",
    role: "Manager",
  },
  {
    name: "Dispatcher User",
    email: "dispatcher@example.com",
    password: "desenv",
    role: "Dispatcher",
  },
];

const drivers: any[] = [
  // 1. Active Driver - Fully Compliant
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    dob: "1985-05-15",
    ssnNumber: "123-00-4567",
    address: "123 Maple St",
    city: "Orlando",
    state: "FL",
    zip: "32801",
    hireDate: "2023-01-10",
    hireStatus: "Active",
    license: {
      documentNumber: "D12345678",
      state: "FL",
      expiryDate: dayjs().add(2, "year").format("YYYY-MM-DD"), // Valid
      file: "https://example.com/license.pdf",
    },
    medical: {
      documentNumber: "M987654321",
      registry: "1234567890",
      expiryDate: dayjs().add(6, "month").format("YYYY-MM-DD"), // Valid
    },
    mvr: {
      documentNumber: "MVR-2024",
      expiryDate: dayjs().add(3, "month").format("YYYY-MM-DD"), // Valid
    },
    drugAlcohol: {
      documentNumber: "DA-2024",
      expiryDate: dayjs().add(10, "month").format("YYYY-MM-DD"), // Valid
    },
    roadTest: {
      examiner: "Jane Smith",
      date: "2023-01-05",
      expiryDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
    },
    emergencyContact: {
      name: "Jane Doe",
      phone: "(555) 987-6543",
      relationship: "Spouse",
    },
  },
  // 2. Terminated Driver - Documents Expiring Soon
  {
    firstName: "Robert",
    lastName: "Smith",
    email: "robert.smith@example.com",
    phone: "(555) 222-3333",
    dob: "1990-08-20",
    ssnNumber: "222-00-3333",
    address: "456 Oak Ave",
    city: "Miami",
    state: "FL",
    zip: "33101",
    hireDate: "2023-03-22",
    hireStatus: "Terminated",
    license: {
      documentNumber: "S55566677",
      state: "FL",
      expiryDate: dayjs().add(15, "day").format("YYYY-MM-DD"), // Expiring Soon (<30 days)
    },
    medical: {
      expiryDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"), // Expired
    },
    mvr: {},
    drugAlcohol: {},
    roadTest: {},
    emergencyContact: {
      name: "Bob Smith Sr",
      phone: "(555) 111-2222",
      relationship: "Father",
    },
  },
  // 3. Pending Driver (Pre-Hire) - Shadow Record
  {
    firstName: "Michael",
    lastName: "Jordan",
    email: "mj@example.com",
    phone: "(555) 232-2323",
    dob: "1988-02-17",
    ssnNumber: "333-00-4444",
    address: "23 Bull Run",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    hireDate: dayjs().format("YYYY-MM-DD"),
    hireStatus: "Pending", // PENDING STATUS
    license: {
      documentNumber: "J23232323",
      state: "IL",
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    medical: {
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    mvr: {},
    drugAlcohol: {},
    roadTest: {},
    emergencyContact: {},
    notes: "Awaiting drug test results.",
  },
];

const vehicles: any[] = [
  {
    busNumber: "101",
    vin: "1HGCM82633A004352",
    vehicleStatus: "Active",
    lastAnnualInspection: dayjs().subtract(3, "month").format("YYYY-MM-DD"),
    mileage: 15000,
  },
  {
    busNumber: "102",
    vin: "2HGCM82633A009988",
    vehicleStatus: "Maintenance",
    lastAnnualInspection: dayjs().subtract(13, "month").format("YYYY-MM-DD"), // Overdue
    mileage: 22000,
  },
];

const applications: any[] = [
  // 1. New Application
  {
    status: "New",
    appliedDate: dayjs().format("YYYY-MM-DD"),
    personalInfo: {
      firstName: "Alice",
      lastName: "Wonderland",
      dob: "1995-04-12",
      email: "alice@example.com",
      phone: "(555) 777-8888",
      ssnNumber: "999-00-1111",
      medicalExpirationDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    addresses: [
      {
        street: "1 Rabbit Hole",
        city: "Wonderland",
        state: "FL",
        zip: "32000",
        fromDate: "2020-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: "W111222333",
        state: "FL",
        class: "B",
        expirationDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
      },
    ],
    employmentHistory: [],
    accidents: [],
    violations: [],
  },
  // 2. Pending Application (Linked to Michael Jordan - though IDs won't link automatically in seed unless we forced it, distinct records are fine for demo)
  {
    status: "New",
    appliedDate: dayjs().subtract(5, "day").format("YYYY-MM-DD"),
    personalInfo: {
      firstName: "Michael",
      lastName: "Jordan", // Matches Pending Driver
      dob: "1988-02-17",
      email: "mj@example.com",
      phone: "(555) 232-2323",
      ssnNumber: "333-00-4444",
    },
    addresses: [
      {
        street: "23 Bull Run",
        city: "Chicago",
        state: "IL",
        zip: "60601",
        fromDate: "2010-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: "J23232323",
        state: "IL",
        class: "A",
        expirationDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
      },
    ],
    employmentHistory: [],
    accidents: [],
    violations: [],
    notes: "Moved to new, await verification.",
  },
  // 3. Rejected Application
  {
    status: "Rejected",
    appliedDate: dayjs().subtract(10, "day").format("YYYY-MM-DD"),
    personalInfo: {
      firstName: "Bad",
      lastName: "Driver",
      dob: "2000-01-01",
      email: "bad@example.com",
      phone: "(555) 666-6666",
      ssnNumber: "666-00-6666",
    },
    addresses: [
      {
        street: "666 Hell St",
        city: "Nowhere",
        state: "NY",
        zip: "00000",
        fromDate: "2010-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: "BAD-666",
        state: "NY",
        class: "C",
        expirationDate: dayjs().add(5, "year").format("YYYY-MM-DD"),
      },
    ],
    notes: "Multiple recent accidents.",
  },

  {
    status: "New",
    appliedDate: dayjs().format("YYYY-MM-DD"),
    personalInfo: {
      firstName: "Neyman",
      lastName: "Jr",
      dob: "1995-04-12",
      email: "neyman@example.com",
      phone: "(555) 777-8888",
      ssnNumber: "999-00-1111",
      medicalExpirationDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    addresses: [
      {
        street: "1 Narnia",
        city: "Wonderland",
        state: "FL",
        zip: "32000",
        fromDate: "2020-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: "W111222333",
        state: "FL",
        class: "B",
        expirationDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
      },
    ],
    employmentHistory: [],
    accidents: [],
    violations: [],
  },

  {
    status: "Hired",
    appliedDate: dayjs().format("YYYY-MM-DD"),
    personalInfo: {
      firstName: "Messi",
      lastName: "Pelé",
      dob: "1995-04-12",
      email: "messi@example.com",
      phone: "(555) 777-8888",
      ssnNumber: "999-00-1111",
      medicalExpirationDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    addresses: [
      {
        street: "1 Rabbit Hole",
        city: "Wonderland",
        state: "FL",
        zip: "32000",
        fromDate: "2020-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: "W111222333",
        state: "FL",
        class: "B",
        expirationDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
      },
    ],
    employmentHistory: [],
    accidents: [],
    violations: [],
  },
];

async function seed() {
  console.log(`Seeding data for APP_ID: ${env.APP_ID}...`);

  try {
    // 1. Seed Users (and Auth)
    console.log("Seeding Users...");
    for (const u of users) {
      const existingInFirestore = await userService.getByEmail(u.email);

      if (existingInFirestore && existingInFirestore.id) {
        console.log(
          `User ${u.email} exists in Firestore. Ensuring role is ${u.role}...`
        );
        try {
          await userService.updateUser(existingInFirestore.id, {
            role: u.role,
          });
        } catch (err: any) {
          if (
            err.code === "auth/user-not-found" ||
            err.message?.includes("no user record")
          ) {
            console.log(
              `User ${u.email} found in Firestore but MISSING in Auth. Re-creating...`
            );
            // Delete orphaned firestore doc
            await db
              .collection(`artifacts/${env.APP_ID}/public/data/users`)
              .doc(existingInFirestore.id as string)
              .delete();
            // Create fresh
            await userService.createUser(u);
            console.log(`Re-created user: ${u.email}`);
          } else {
            throw err;
          }
        }
      } else {
        // Check if exists in Auth but not Firestore
        try {
          // Note: userService doesn't expose auth directly, but we can try to create
          // if it fails with 'already exists', we know we need to sync
          await userService.createUser(u);
          console.log(`Created new user: ${u.email} (${u.role})`);
        } catch (err: any) {
          if (
            err.code === "auth/email-already-exists" ||
            err.message?.includes("already exists")
          ) {
            console.log(
              `User ${u.email} exists in Auth. You may need to manually update their Firestore doc if it is missing.`
            );
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
      const existing = await driverService.getAll();
      const exists = existing.some((ed) => ed.email === d.email);

      if (!exists) {
        await driverService.createDriver(d);
        console.log(`Created driver: ${d.firstName} ${d.lastName}`);
      } else {
        console.log(`Driver with email ${d.email} already exists. Skipping.`);
      }
    }

    // 3. Seed Vehicles
    console.log("Seeding Vehicles...");
    for (const v of vehicles) {
      const existingVehicles = await vehicleService.getAll();
      const exists = existingVehicles.some(
        (ev) => ev.busNumber === v.busNumber
      );

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
      // Basic check to avoid infinite dupes on re-run
      const existingApps = await applicationService.getAll();
      const exists = existingApps.some(
        (ea) => ea.personalInfo.email === a.personalInfo.email
      );

      if (!exists) {
        await applicationService.create(a);
        console.log(
          `Created application: ${a.personalInfo.firstName} ${a.personalInfo.lastName}`
        );
      } else {
        console.log(
          `Application for ${a.personalInfo.email} already exists. Skipping.`
        );
      }
    }

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
