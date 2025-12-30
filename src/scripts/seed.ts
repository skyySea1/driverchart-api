import { db } from "../utils/firebase";
import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { env } from "../utils/env";
import dayjs from "dayjs";
import { Driver } from '../../../vue/src/types';

// Mock Data
const drivers = [
  {
    firstName: "John",
    lastName: "Doe",
    dob: "1985-05-15",
    phone: "555-0101",
    email: "john.doe@example.com",
    hireDate: "2020-01-10",
    hireStatus: "Active",
    cdl: {
      documentNumber: "D12345678",
      state: "FL",
      expiryDate: dayjs().add(2, "month").format("YYYY-MM-DD"), // Expiring soon
    },
    medical: {
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    mvr: {
      expiryDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"), // Expired
    },
    drugAlcohol: {
      expiryDate: dayjs().add(6, "month").format("YYYY-MM-DD"),
    },
    roadTest: {
      examiner: "Sgt. Pepper",
      date: "2020-01-15",
    },
    emergencyContact: {
      name: "Jane Doe",
      phone: "555-0102",
      relationship: "Spouse",
    },
  },
  {
    firstName: "Alice",
    lastName: "Smith",
    dob: "1990-08-20",
    phone: "555-0202",
    email: "alice.smith@example.com",
    hireDate: "2021-03-15",
    hireStatus: "Active",
    cdl: {
      documentNumber: "S98765432",
      state: "NY",
      expiryDate: dayjs().add(3, "year").format("YYYY-MM-DD"),
    },
    medical: {
      expiryDate: dayjs().add(2, "month").format("YYYY-MM-DD"), // Expiring soon
    },
    mvr: {
      expiryDate: dayjs().add(11, "month").format("YYYY-MM-DD"),
    },
    drugAlcohol: {
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    roadTest: {
      examiner: "Officer Krupke",
      date: "2021-03-20",
    },
    emergencyContact: {
      name: "Bob Smith",
      phone: "555-0203",
      relationship: "Brother",
    },
  },
];

const vehicles = [
  {
    busNumber: "BUS-101",
    vin: "1HGCM82633A004352",
    vehicleStatus: "Active",
    lastAnnualInspection: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
    mileage: 120500,
  },
  {
    busNumber: "BUS-102",
    vin: "1M8GDM9A_KP042788",
    vehicleStatus: "Maintenance",
    lastAnnualInspection: dayjs().subtract(11, "month").format("YYYY-MM-DD"), // Due soon
    mileage: 89000,
  },
];

async function seed() {
  console.log(`Seeding data for APP_ID: ${env.APP_ID}...`);

  try {
    console.log("Seeding Drivers...");
    for (const d of drivers) {
      // Cast to any to bypass strict type checks for optional fields in seed
      
      await driverService.createDriver(d as any);
      console.log(`Created driver: ${d.firstName} ${d.lastName}`);
    }

    console.log("Seeding Vehicles...");
    for (const v of vehicles) {
      await vehicleService.createVehicle(v as any);
      console.log(`Created vehicle: ${v.busNumber}`);
    }

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
