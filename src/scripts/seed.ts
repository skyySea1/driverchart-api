import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { applicationService } from "../services/applicationService";
import { env } from "../utils/env";
import dayjs from "dayjs";

// Mock Data with 'any' to bypass strict TS checks during seeding
const drivers: any[] = [
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
      expiryDate: dayjs().add(2, "month").format("YYYY-MM-DD"),
    },
    medical: {
      documentNumber: "MED123",
      registry: "REG456",
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    mvr: {
      documentNumber: "MVR789",
      expiryDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    },
    drugAlcohol: {
      documentNumber: "DA101",
      expiryDate: dayjs().add(6, "month").format("YYYY-MM-DD"),
    },
    roadTest: {
      documentNumber: "RT202",
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
      documentNumber: "MED999",
      registry: "REG888",
      expiryDate: dayjs().add(2, "month").format("YYYY-MM-DD"),
    },
    mvr: {
      documentNumber: "MVR555",
      expiryDate: dayjs().add(11, "month").format("YYYY-MM-DD"),
    },
    drugAlcohol: {
      documentNumber: "DA444",
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    roadTest: {
      documentNumber: "RT333",
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

const vehicles: any[] = [
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
    lastAnnualInspection: dayjs().subtract(11, "month").format("YYYY-MM-DD"),
    mileage: 89000,
  },
];

const applications: any[] = [
  {
    firstName: "Michael",
    lastName: "Jordan",
    email: "mj@bulls.com",
    phone: "555-2323",
    status: "Pending",
    appliedDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
    experienceYears: 10,
    cdlNumber: "A1234567",
  },
  {
    firstName: "Larry",
    lastName: "Bird",
    email: "lb@celtics.com",
    phone: "555-3333",
    status: "Approved",
    appliedDate: dayjs().subtract(5, "day").format("YYYY-MM-DD"),
    experienceYears: 12,
    cdlNumber: "B7654321",
  },
];

async function seed() {
  console.log(`Seeding data for APP_ID: ${env.APP_ID}...`);

  try {
    console.log("Seeding Drivers...");
    for (const d of drivers) {
      await driverService.createDriver(d);
      console.log(`Created driver: ${d.firstName} ${d.lastName}`);
    }

    console.log("Seeding Vehicles...");
    for (const v of vehicles) {
      await vehicleService.createVehicle(v);
      console.log(`Created vehicle: ${v.busNumber}`);
    }

    console.log("Seeding Applications...");
    for (const a of applications) {
      await applicationService.create(a);
      console.log(`Created application: ${a.firstName} ${a.lastName}`);
    }

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();