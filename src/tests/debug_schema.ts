
import { z } from "zod";
import { ApplicationSchema } from "../schemas/applicationsSchema";

// Mock payload from user
const payload = {
  "id": "",
  "personalInfo": {
    "firstName": "marcell",
    "middleName": "opacio",
    "lastName": "henrique",
    "dob": "2000-10-11",
    "email": "henrir1020@gmail.com",
    "phone": "(555)789-4567",
    "ssnNumber": "123-45-7894"
  },
  "addresses": [
    {
      "street": "1234565asdas",
      "city": "orlando",
      "state": "FL",
      "zip": "32801",
      "fromDate": "2025-12-31",
      "toDate": "2026-01-19"
    }
  ],
  "licenses": [
    {
      "number": "A123456",
      "state": "FL",
      "class": "A",
      "endorsements": "P",
      "restrictions": "NONE",
      "expirationDate": "2027-10-11"
    }
  ],
  "vehicleExperience": [
    {
      "type": "Passenger Bus",
      "totalMileage": "10000"
    }
  ],
  "accidents": [],
  "violations": [],
  "employmentHistory": [],
  "notes": "sdfg",
  "status": "Pending",
  "appliedDate": "2026-01-19"
};

try {
  ApplicationSchema.parse(payload);
  console.log("Validation Successful");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation Failed:", JSON.stringify(error.issues, null, 2));
  } else {
    console.error("Unexpected error:", error);
  }
}
