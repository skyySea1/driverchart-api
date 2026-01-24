import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { applicationService } from "../services/applicationService";
import { env } from "../utils/env";
import dayjs from "dayjs";
import { Driver } from "@/schemas/driversSchema";

// Richer Seed Data
const drivers: Driver[] = [
  // 1. Valid Driver
  {
    firstName: "John",
    lastName: "Doe",
    dob: "1985-05-15",
    phone: "555-0101",
    email: "john.doe@example.com",
    hireDate: "2020-01-10",
    hireStatus: "Active",
    license: {
      documentNumber: "D12345678",
      state: "FL",
      expiryDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
    },
    medical: {
      documentNumber: "MED123",
      registry: "REG456",
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    mvr: {
      documentNumber: "MVR789",
      expiryDate: dayjs().add(11, "month").format("YYYY-MM-DD"),
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
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    w9Signed: false,
  },
  // 2. Expiring Soon (CDL)
  {
    firstName: "Alice",
    lastName: "Smith",
    dob: "1990-08-20",
    phone: "555-0202",
    email: "alice.smith@example.com",
    hireDate: "2021-03-15",
    hireStatus: "Active",
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    license: {
      documentNumber: "S98765432",
      state: "NY",
      expiryDate: dayjs().add(15, "day").format("YYYY-MM-DD"), // Expiring soon
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
    w9Signed: false,
  },
  // 3. Expired (Medical)
  {
    firstName: "Bob",
    lastName: "Johnson",
    dob: "1978-11-05",
    phone: "555-0303",
    email: "bob.j@example.com",
    hireDate: "2019-06-01",
    hireStatus: "Active",
    license: {
      documentNumber: "C11223344",
      state: "TX",
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    medical: {
      documentNumber: "MED777",
      registry: "REG111",
      expiryDate: dayjs().subtract(5, "day").format("YYYY-MM-DD"), // Expired
    },
    mvr: {
      documentNumber: "MVR222",
      expiryDate: dayjs().add(1, "month").format("YYYY-MM-DD"),
    },
    drugAlcohol: {
      documentNumber: "DA333",
      expiryDate: dayjs().add(3, "month").format("YYYY-MM-DD"),
    },
    roadTest: {
      documentNumber: "RT444",
      examiner: "Capt. Hook",
      date: "2019-06-05",
    },
    emergencyContact: {
      name: "Mary Johnson",
      phone: "555-0304",
      relationship: "Sister",
    },
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    w9Signed: false,
  },
  // 4. Terminated Driver
  {
    firstName: "Charlie",
    lastName: "Brown",
    dob: "1992-02-14",
    phone: "555-0404",
    email: "charlie.b@example.com",
    hireDate: "2022-01-01",
    hireStatus: "Terminated",
    terminationDate: "2023-12-31",
    license: { documentNumber: "D998877", state: "CA", expiryDate: "" },
    medical: {
      documentNumber: "",
      expiryDate: "",
      registry: "",
    },
    mvr: { documentNumber: "", expiryDate: "" },
    drugAlcohol: { documentNumber: "", expiryDate: "" },
    roadTest: { documentNumber: "", examiner: "", date: "" },
    emergencyContact: { name: "", phone: "", relationship: "" },
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    w9Signed: false,
  },
  // 5. New Hire (Missing Docs)
  {
    firstName: "Diana",
    lastName: "Prince",
    dob: "1995-07-07",
    phone: "555-0505",
    email: "diana.p@example.com",
    hireDate: dayjs().format("YYYY-MM-DD"), // Today
    hireStatus: "Active",
    license: { documentNumber: "", state: "", expiryDate: "" },
    medical: {
      documentNumber: "",
      expiryDate: "",
      registry: "",
    },
    mvr: { documentNumber: "", expiryDate: "" },
    drugAlcohol: { documentNumber: "", expiryDate: "" },
    roadTest: { documentNumber: "", examiner: "", date: "" },
    emergencyContact: {
      name: "Bruce Wayne",
      phone: "555-0506",
      relationship: "Friend",
    },
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    w9Signed: false,
  },
  // 6. Expiring Soon (Multiple)
  {
    firstName: "Edward",
    lastName: "Nygma",
    dob: "1980-10-31",
    phone: "555-0606",
    email: "e.nygma@example.com",
    hireDate: "2018-04-01",
    hireStatus: "Active",
    license: {
      documentNumber: "Q123123",
      state: "NJ",
      expiryDate: dayjs().add(10, "day").format("YYYY-MM-DD"), // Expiring
    },
    medical: {
      documentNumber: "MED555",
      registry: "REG222",
      expiryDate: dayjs().add(20, "day").format("YYYY-MM-DD"), // Expiring
    },
    mvr: {
      documentNumber: "MVR888",
      expiryDate: dayjs().add(5, "day").format("YYYY-MM-DD"), // Expiring
    },
    drugAlcohol: {
      documentNumber: "DA999",
      expiryDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
    },
    roadTest: {
      documentNumber: "RT555",
      examiner: "Jim Gordon",
      date: "2018-04-05",
    },
    emergencyContact: {
      name: "Oswald",
      phone: "555-0607",
      relationship: "Associate",
    },
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    w9Signed: false,
  },
  // 7-15: Generated Drivers
  ...Array.from({ length: 9 }).map((_, i) => ({
    firstName: `Driver${i + 7}`,
    lastName: `Test`,
    dob: "1988-01-01",
    phone: `555-070${i}`,
    email: `driver${i + 7}@test.com`,
    hireDate: "2021-01-01",
    hireStatus: "Active" as const,
    middleName: "",
    ssnNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    license: {
      documentNumber: `D${1000 + i}`,
      state: "FL",
      expiryDate: dayjs()
        .add(6 + i, "month")
        .format("YYYY-MM-DD"),
    },
    medical: {
      documentNumber: `M${1000 + i}`,
      registry: `R${1000 + i}`,
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    mvr: {
      documentNumber: `V${1000 + i}`,
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    drugAlcohol: {
      documentNumber: `A${1000 + i}`,
      expiryDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    roadTest: {
      documentNumber: `RT${1000 + i}`,
      examiner: "Tester",
      date: "2021-01-05",
    },
    emergencyContact: {
      name: "Contact",
      phone: "555-0000",
      relationship: "None",
    },
    w9Signed: false,
  })),
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
  {
    busNumber: "BUS-103",
    vin: "5T8GDM9A_ZZ099887",
    vehicleStatus: "Active",
    lastAnnualInspection: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    mileage: 45000,
  },
  {
    busNumber: "BUS-104",
    vin: "2H4GDM9A_AA112233",
    vehicleStatus: "Inactive",
    lastAnnualInspection: dayjs().subtract(13, "month").format("YYYY-MM-DD"), // Expired Inspection
    mileage: 210000,
  },
  {
    busNumber: "BUS-105",
    vin: "3N1GDM9A_BB445566",
    vehicleStatus: "Active",
    lastAnnualInspection: dayjs()
      .subtract(11, "month")
      .add(20, "day")
      .format("YYYY-MM-DD"), // Expiring soon
    mileage: 67000,
  },
];

const applications: any[] = [
  {
    personalInfo: {
      firstName: "Michael",
      lastName: "Jordan",
      email: "mj@bulls.com",
      phone: "555-2323",
    },
    status: "Pending",
    appliedDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
    experienceYears: 10,
    licenses: [{ number: "A1234567" }],
    notes: "Legendary driver.",
  },
  {
    personalInfo: {
      firstName: "Larry",
      lastName: "Bird",
      email: "lb@celtics.com",
      phone: "555-3333",
    },
    status: "Approved",
    appliedDate: dayjs().subtract(5, "day").format("YYYY-MM-DD"),
    experienceYears: 12,
    licenses: [{ number: "B7654321" }],
    notes: "Great awareness.",
  },
  {
    personalInfo: {
      firstName: "Magic",
      lastName: "Johnson",
      email: "magic@lakers.com",
      phone: "555-4444",
    },
    status: "Rejected",
    appliedDate: dayjs().subtract(10, "day").format("YYYY-MM-DD"),
    experienceYears: 2,
    licenses: [{ number: "C998877" }],
    notes: "Not enough experience.",
  },
  {
    personalInfo: {
      firstName: "Shaq",
      lastName: "O'Neal",
      email: "shaq@lakers.com",
      phone: "555-5555",
    },
    status: "Pending",
    appliedDate: dayjs().format("YYYY-MM-DD"),
    experienceYears: 5,
    licenses: [{ number: "D556677" }],
    notes: "Big presence.",
  },
  {
    personalInfo: {
      firstName: "Kobe",
      lastName: "Bryant",
      email: "kobe@lakers.com",
      phone: "555-8248",
    },
    status: "Pending",
    appliedDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    experienceYears: 8,
    licenses: [{ number: "E248248" }],
    notes: "Mamba mentality.",
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
      // Accessing firstName from personalInfo
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
