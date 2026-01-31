import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { applicationService } from "../services/applicationService";
import { userService } from "../services/userService";
import { db } from "../services/firebaseService";
import { env } from "../utils/env";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";

// Default Users
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

// Helper to generate random driver
const generateDriver = (index: number) => {
  const hireStatus = faker.helpers.arrayElement([
    "Active",
    "Terminated",
    "Pending",
    "Rehired",
  ]);
  const isActive = hireStatus === "Active" || hireStatus === "Rehired";

  return {
    firstName: faker.person.firstName(),
    middleName: faker.person.middleName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(), // normalize email
    phone: faker.phone.number(),
    dob: dayjs(faker.date.birthdate({ min: 21, max: 65, mode: "age" })).format(
      "YYYY-MM-DD"
    ),
    ssnNumber: faker.string
      .numeric(9)
      .replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3"),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode(),
    hireDate: dayjs(faker.date.past({ years: 3 })).format("YYYY-MM-DD"),
    hireStatus,
    license: {
      documentNumber: faker.string.alphanumeric(9).toUpperCase(),
      state: faker.location.state({ abbreviated: true }),
      expiryDate: isActive
        ? dayjs()
            .add(faker.number.int({ min: 1, max: 24 }), "month")
            .format("YYYY-MM-DD")
        : dayjs()
            .subtract(faker.number.int({ min: 1, max: 12 }), "month")
            .format("YYYY-MM-DD"),
      file:
        Math.random() > 0.3
          ? `https://example.com/license-${index}.pdf`
          : undefined,
    },
    medical: {
      documentNumber: faker.string.alphanumeric(10).toUpperCase(),
      registry: faker.string.numeric(10),
      expiryDate: isActive
        ? dayjs()
            .add(faker.number.int({ min: 1, max: 12 }), "month")
            .format("YYYY-MM-DD")
        : dayjs()
            .subtract(faker.number.int({ min: 1, max: 6 }), "month")
            .format("YYYY-MM-DD"),
      file:
        Math.random() > 0.4
          ? `https://example.com/medical-${index}.pdf`
          : undefined,
    },
    mvr: {
      documentNumber: `MVR-${dayjs().year()}-${index}`,
      expiryDate: dayjs()
        .add(faker.number.int({ min: 3, max: 12 }), "month")
        .format("YYYY-MM-DD"),
      file:
        Math.random() > 0.5
          ? `https://example.com/mvr-${index}.pdf`
          : undefined,
    },
    drugAlcohol: {
      documentNumber: `DA-${dayjs().year()}-${index}`,
      expiryDate: dayjs()
        .add(faker.number.int({ min: 6, max: 12 }), "month")
        .format("YYYY-MM-DD"),
      file:
        Math.random() > 0.5
          ? `https://example.com/drug-${index}.pdf`
          : undefined,
    },
    roadTest: {
      documentNumber: `RT-${dayjs().year()}-${index}`,
      examiner: faker.person.fullName(),
      date: dayjs(faker.date.past({ years: 1 })).format("YYYY-MM-DD"),
      expiryDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
      file:
        Math.random() > 0.6
          ? `https://example.com/roadtest-${index}.pdf`
          : undefined,
    },
    emergencyContact: {
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      relationship: faker.helpers.arrayElement([
        "Spouse",
        "Parent",
        "Sibling",
        "Friend",
      ]),
    },
    isFlagged: Math.random() > 0.9,
    flagReason: Math.random() > 0.9 ? "Pending safety review" : "",

    // New fields
    w9Signed: faker.datatype.boolean(),
    drugTestSignature: faker.person.fullName(),
    drugTestDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    authReleaseSignature: faker.person.fullName(),
    authReleaseDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    pspDisclosureSignature: faker.person.fullName(),
    pspDisclosureDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    fmcsaConsentSignature: faker.person.fullName(),
    fmcsaConsentDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    alcoholDrugPolicySignature: faker.person.fullName(),
    alcoholDrugPolicyDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    generalWorkPolicySignature: faker.person.fullName(),
    generalWorkPolicyDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
    fairCreditReportingSignature: faker.person.fullName(),
    fairCreditReportingDate: dayjs(faker.date.past()).format("YYYY-MM-DD"),
  };
};

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
    lastAnnualInspection: dayjs().subtract(13, "month").format("YYYY-MM-DD"),
    mileage: 22000,
  },
  {
    busNumber: "103",
    vin: "3HGCM82633A001122",
    vehicleStatus: "Active",
    lastAnnualInspection: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    mileage: 5000,
  },
  {
    busNumber: "201",
    vin: "4HGCM82633A003344",
    vehicleStatus: "Inactive",
    lastAnnualInspection: dayjs().subtract(24, "month").format("YYYY-MM-DD"),
    mileage: 150000,
  },
];

const generateApplication = () => {
  const status = faker.helpers.arrayElement([
    "New",
    "Pending",
    "Hired",
    "Rejected",
  ]);

  return {
    status: status as "New" | "Pending" | "Hired" | "Rejected",
    appliedDate: dayjs(faker.date.recent({ days: 60 })).format("YYYY-MM-DD"),
    personalInfo: {
      firstName: faker.person.firstName(),
      middleName: faker.person.middleName(),
      lastName: faker.person.lastName(),
      dob: dayjs(
        faker.date.birthdate({ min: 21, max: 60, mode: "age" })
      ).format("YYYY-MM-DD"),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      ssnNumber: faker.string
        .numeric(9)
        .replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3"),
      medicalExpirationDate: dayjs().add(1, "year").format("YYYY-MM-DD"),
    },
    addresses: [
      {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        fromDate: "2020-01-01",
        present: true,
      },
    ],
    licenses: [
      {
        number: faker.string.alphanumeric(9).toUpperCase(),
        state: faker.location.state({ abbreviated: true }),
        class: faker.helpers.arrayElement(["A", "B", "C"]),
        expirationDate: dayjs().add(2, "year").format("YYYY-MM-DD"),
        endorsements: faker.helpers.arrayElement(["P", "S", "N", ""]),
        restrictions: "",
      },
    ],
    employmentHistory: [],
    accidents: [],
    violations: [],
    vehicleExperience: [],
    notes: status === "Rejected" ? "Does not meet experience requirements" : "",

    // New fields
    forfeitures: "",
    deniedLicense: false,
    suspendedLicense: false,
    denialSuspensionExplanation: "",
    drugTestPositiveOrRefusal: false,
    drugTestDocumentation: "N/A" as "N/A" | "Yes" | "No",
    drugTestSignature: "",
    drugTestDate: "",
    authReleaseSignature: "",
    authReleaseDate: "",
    pspDisclosureSignature: "",
    pspDisclosureDate: "",
    fmcsaConsentSignature: "",
    fmcsaConsentDate: "",
    alcoholDrugPolicySignature: "",
    alcoholDrugPolicyDate: "",
    generalWorkPolicySignature: "",
    generalWorkPolicyDate: "",
    fairCreditReportingSignature: "",
    fairCreditReportingDate: "",

    isFlagged: false,
    flagReason: "",
    flagDate: "",
  };
};

async function seed() {
  console.log(`Seeding data for COLLECTION_ID: ${env.COLLECTION_ID}...`);

  try {
    // 1. Seed Users (and Auth)
    console.log("Seeding Users...");
    for (const u of users) {
      const existingInFirestore = await userService.getByEmail(u.email);

      if (existingInFirestore && existingInFirestore.id) {
        console.log(`User ${u.email} exists in Firestore. updating role...`);
        try {
          await userService.updateUser(existingInFirestore.id, {
            role: u.role,
          });
        } catch (e: any) {
          console.log(`Error updating user ${u.email}: ${e.message}`);
        }
      } else {
        try {
          await userService.createUser(u);
          console.log(`Created new user: ${u.email} (${u.role})`);
        } catch (err: any) {
          console.log(`Error creating user ${u.email}: ${err.message}`);
        }
      }
    }

    // 2. Seed Drivers (Generate 20)
    console.log("Seeding Drivers...");
    const driversToSeed = Array.from({ length: 20 }, (_, i) =>
      generateDriver(i)
    );

    for (const d of driversToSeed) {
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

    // 4. Seed Applications (Generate 20)
    console.log("Seeding Applications...");
    const appsToSeed = Array.from({ length: 20 }, () => generateApplication());

    for (const a of appsToSeed) {
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
