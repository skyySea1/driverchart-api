import { driverService } from "../services/driverService";
import { documentService } from "../services/documentService";
import dayjs from "dayjs";

// This job checks for driver document expirations daily and creates alerts on specific days.
export async function runExpirationCheck() {
  console.log("Starting daily expiration check...");
  const drivers = await driverService.getAll();
  const today = dayjs();
  let alertsCreated = 0;

  for (const d of drivers) {
    if (d.hireStatus !== "Active") continue;

    const checkItem = async (date: string | undefined, label: string) => {
      if (!date) return;
      const due = dayjs(date);
      const diff = due.diff(today, "day");

      if (diff === 30 || diff === 7 || diff === 0) {
        // Create a log entry for the alert
        await documentService.createLog({
          date: today.toDate(),
          fileName: `ALERT: ${label} expiring in ${diff} days`,
          type: "Compliance Alert",
          entityName: `${d.firstName} ${d.lastName}`,
          user: "System Bot",
        });
        alertsCreated++;
      }
    };

    await checkItem(d.cdl?.expiryDate, "CDL");
    await checkItem(d.medical?.expiryDate, "Medical Certificate");
    await checkItem(d.mvr?.expiryDate, "MVR");
    await checkItem(d.drugAlcohol?.expiryDate, "Clearinghouse Query");
  }

  console.log(`Expiration check finished. ${alertsCreated} alerts created.`);
  return { alertsCreated };
}
